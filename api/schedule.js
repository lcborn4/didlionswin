// Schedule API - Get previous, current, and next Lions games
// Using built-in fetch (Node.js 18+)

const LIONS_ID = '8';
const ESPN_API_BASE = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl';

// In-memory cache for faster responses
let scheduleCache = {
    data: null,
    timestamp: 0,
    ttl: 10 * 60 * 1000 // 10 minutes (increased for better performance)
};

// Don't clear cache on module load - keep it warm for faster responses

export const handler = async (event, context) => {
    // Handle preflight OPTIONS requests
    if (event.httpMethod === 'OPTIONS' || event.requestContext?.http?.method === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Max-Age': '86400'
            },
            body: ''
        };
    }

    try {
        console.log('Schedule request received');

        // Check for cache bypass query parameter
        const queryParams = event.queryStringParameters || {};
        const bypassCache = queryParams.nocache === 'true' || queryParams.clearCache === 'true';

        // Clear cache if requested
        if (bypassCache) {
            console.log('Cache bypass requested - clearing cache');
            scheduleCache.data = null;
            scheduleCache.timestamp = 0;
        }

        // Check cache first (unless bypassed)
        const currentTime = Date.now();
        if (!bypassCache && scheduleCache.data && (currentTime - scheduleCache.timestamp) < scheduleCache.ttl) {
            console.log('Returning cached schedule data');
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Cache-Control': 'public, max-age=1800'
                },
                body: JSON.stringify({
                    ...scheduleCache.data,
                    timestamp: new Date().toISOString(),
                    cached: true
                })
            };
        }

        // Get current schedule
        const schedule = await getSchedule();
        const now = new Date();

        // Optimize: Only process recent games for faster response
        // ESPN API typically returns items in reverse chronological order (newest first)
        // But when combining multiple seasons, we need to ensure we get the most recent games
        const MAX_GAMES_TO_PROCESS = 20; // Increased to ensure we get recent games from all seasons
        
        // Take games from the END of the schedule items array (most recent)
        // ESPN typically returns newest first, but when combining seasons, take from end to be safe
        const gamesToFetch = Math.min(schedule.items.length, MAX_GAMES_TO_PROCESS);
        const limitedItems = schedule.items.slice(-gamesToFetch); // Take last N items (most recent)
        console.log(`Processing ${limitedItems.length} most recent games (from ${schedule.items.length} total)`);

        // Get games in parallel for speed
        const fetchedGames = await Promise.all(
            limitedItems.map(async (item) => {
                try {
                    const response = await fetch(item.$ref);
                    return await response.json();
                } catch (error) {
                    console.error('Error fetching game:', error);
                    return null;
                }
            })
        );
        
        // Filter out nulls and sort games by date (oldest to newest)
        const validGames = fetchedGames.filter(game => game !== null);
        validGames.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Use the sorted valid games
        const allGamesSorted = validGames;

        // Find latest, previous, and next games based on current date
        let currentIndex = -1;
        let nextUpcomingIndex = -1;
        let mostRecentCompletedGame = null;
        let mostRecentCompletedTime = 0;

        // Use current date/time to determine game positions
        const nowTime = now.getTime();

        for (let i = 0; i < allGamesSorted.length; i++) {
            const gameDate = new Date(allGamesSorted[i].date);
            const gameTime = gameDate.getTime();

            // Next game = the first upcoming game (in the future from current date)
            if (nextUpcomingIndex === -1 && gameTime > nowTime) {
                nextUpcomingIndex = i;
            }

            // Check if this is today's game (within 6 hours to catch games that might be live)
            const timeDiff = Math.abs(gameTime - nowTime);
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            if (hoursDiff <= 6) {
                currentIndex = i;
            }
        }

        // Find the most recent completed game by checking game status
        // Start from the most recent past games and check their status
        console.log(`Checking ${allGamesSorted.length} games for completed status...`);
        for (let i = allGamesSorted.length - 1; i >= 0; i--) {
            const gameDate = new Date(allGamesSorted[i].date);
            const gameTime = gameDate.getTime();
            
            // Only check past games
            if (gameTime <= nowTime) {
                try {
                    const gameData = await formatGame(allGamesSorted[i]);
                    console.log(`Game ${i} (${allGamesSorted[i].name}): status=${gameData.status}, result=${gameData.result}, isLive=${gameData.isLive}, score=${gameData.score?.lions}-${gameData.score?.opponent}`);
                    // Check if game is completed:
                    // 1. Status is FINAL or FINAL_OVERTIME
                    // 2. Has a result (WIN/LOSS/TIE)
                    // 3. Has scores and is not live (fallback for games that might have scores but status not updated yet)
                    const hasScores = gameData.score && (gameData.score.lions > 0 || gameData.score.opponent > 0);
                    const isCompleted = (gameData.status === 'STATUS_FINAL' || gameData.status === 'STATUS_FINAL_OVERTIME') 
                                     || gameData.result 
                                     || (hasScores && !gameData.isLive && gameData.status !== 'STATUS_SCHEDULED' && gameData.status !== 'STATUS_IN_PROGRESS');
                    
                    if (isCompleted) {
                        // Found a completed game, this is our latest
                        console.log(`Found completed game: ${allGamesSorted[i].name} (status=${gameData.status}, result=${gameData.result})`);
                        mostRecentCompletedGame = allGamesSorted[i];
                        mostRecentCompletedTime = gameTime;
                        break; // Found the most recent completed game, stop searching
                    }
                } catch (error) {
                    console.error(`Error checking game ${i} status:`, error);
                }
            }
        }
        
        if (!mostRecentCompletedGame) {
            console.log('WARNING: No completed games found in past games');
        }

        // Determine previous, current, and next games
        const currentYear = getCurrentSeasonYear();
        const result = {
            previousGame: null,
            currentGame: null,
            latestGame: null,
            nextGame: null,
            season: {
                type: 'regular',
                year: currentYear
            }
        };

        // CRITICAL: Check ALL recent games for live status (not just time-based)
        // A game could be live even if it started hours ago (overtime, delays, etc.)
        let liveGameFound = false;

        // OPTIMIZE: Check games within the last 12 hours in parallel for live status
        // This catches games that started earlier but are still in progress
        const recentGamesToCheck = allGamesSorted.slice(0, Math.min(allGamesSorted.length, 8))
            .filter((game, i) => {
                const gameDate = new Date(game.date);
                const gameTime = gameDate.getTime();
                const hoursDiff = Math.abs(gameTime - nowTime) / (1000 * 60 * 60);
                return hoursDiff <= 12; // Check games from the past 12 hours or next 6 hours
            });

        // Format recent games in parallel (much faster than sequential)
        if (recentGamesToCheck.length > 0) {
            try {
                const recentGameData = await Promise.all(
                    recentGamesToCheck.map(game => formatGame(game).catch(err => {
                        console.error(`Error formatting game ${game.id}:`, err);
                        return null;
                    }))
                );

                // Find live game from the formatted data
                for (let i = 0; i < recentGameData.length; i++) {
                    const gameData = recentGameData[i];
                    if (gameData && (gameData.isLive || gameData.status === 'STATUS_IN_PROGRESS')) {
                        result.currentGame = gameData;
                        liveGameFound = true;
                        const liveGameIndex = allGamesSorted.findIndex(g => g.id === recentGamesToCheck[i].id);

                        // Find the most recent COMPLETED game (before the live game)
                        // Search backwards from the live game
                        for (let j = liveGameIndex - 1; j >= 0; j--) {
                            const otherGameDate = new Date(allGamesSorted[j].date);
                            const otherGameTime = otherGameDate.getTime();
                            if (otherGameTime < nowTime) {
                                // Format this game to check if completed
                                try {
                                    const otherGameData = await formatGame(allGamesSorted[j]);
                                    if (otherGameData.status === 'STATUS_FINAL' || otherGameData.status === 'STATUS_FINAL_OVERTIME' || otherGameData.result) {
                                        mostRecentCompletedGame = allGamesSorted[j];
                                        mostRecentCompletedTime = otherGameTime;
                                        break; // Found the most recent completed game
                                    }
                                } catch (error) {
                                    console.error(`Error checking completed game ${j}:`, error);
                                }
                            }
                        }
                        break; // Found live game, stop searching
                    }
                }
            } catch (error) {
                console.error('Error checking recent games for live status:', error);
            }
        }

        // If no live game found, check the time-based currentIndex for scheduled/upcoming games
        if (!liveGameFound && currentIndex >= 0) {
            const currentGameData = await formatGame(allGamesSorted[currentIndex]);

            if (currentGameData.status === 'STATUS_FINAL' || currentGameData.status === 'STATUS_FINAL_OVERTIME') {
                // Game is finished - it's the latest game, not current
                result.latestGame = currentGameData;
                mostRecentCompletedGame = allGamesSorted[currentIndex];
            } else if (currentGameData.status === 'STATUS_SCHEDULED') {
                // Game is scheduled but not started yet - it's the current/next game
                result.currentGame = currentGameData;
            }
        }

        // Latest completed game = most recently completed game (before current date)
        // Only if we don't already have it from current game check
        if (!result.latestGame && mostRecentCompletedGame) {
            const latestGameData = await formatGame(mostRecentCompletedGame);
            // Only set as latest if it's actually completed (not live)
            if (!latestGameData.isLive && (latestGameData.status === 'STATUS_FINAL' || latestGameData.status === 'STATUS_FINAL_OVERTIME' || latestGameData.result)) {
                result.latestGame = latestGameData;
            }
        }

        // Find previous game - the game that occurred before the latest game
        // Do this whether we set latestGame above or from the currentGame check
        if (result.latestGame && mostRecentCompletedGame) {
            const latestGameDate = new Date(mostRecentCompletedGame.date);
            let previousGame = null;
            let previousGameTime = 0;

            // Search all games to find the one before the latest game
            for (let i = 0; i < allGamesSorted.length; i++) {
                // Skip the latest game itself
                if (allGamesSorted[i].id === mostRecentCompletedGame.id) continue;

                const gameDate = new Date(allGamesSorted[i].date);
                const gameTime = gameDate.getTime();

                // Find the game that's before the latest game but closest to it
                if (gameTime < latestGameDate.getTime() && gameTime > previousGameTime) {
                    // Verify this game is completed before considering it
                    try {
                        const gameData = await formatGame(allGamesSorted[i]);
                        if (gameData.status === 'STATUS_FINAL' || gameData.status === 'STATUS_FINAL_OVERTIME' || gameData.result) {
                            previousGame = allGamesSorted[i];
                            previousGameTime = gameTime;
                        }
                    } catch (error) {
                        console.error(`Error checking previous game ${i}:`, error);
                    }
                }
            }

            if (previousGame) {
                result.previousGame = await formatGame(previousGame);
            }
        } else if (!result.latestGame && mostRecentCompletedGame) {
            // If we didn't set latestGame (maybe it wasn't completed), still try to find previous
            // This handles edge cases where we found a game but it wasn't marked as completed
            const latestGameDate = new Date(mostRecentCompletedGame.date);
            let previousGame = null;
            let previousGameTime = 0;

            for (let i = 0; i < allGamesSorted.length; i++) {
                if (allGamesSorted[i].id === mostRecentCompletedGame.id) continue;

                const gameDate = new Date(allGamesSorted[i].date);
                const gameTime = gameDate.getTime();

                if (gameTime < latestGameDate.getTime() && gameTime > previousGameTime) {
                    try {
                        const gameData = await formatGame(allGamesSorted[i]);
                        if (gameData.status === 'STATUS_FINAL' || gameData.status === 'STATUS_FINAL_OVERTIME' || gameData.result) {
                            previousGame = allGamesSorted[i];
                            previousGameTime = gameTime;
                        }
                    } catch (error) {
                        console.error(`Error checking previous game ${i}:`, error);
                    }
                }
            }

            if (previousGame) {
                result.previousGame = await formatGame(previousGame);
            }
        }

        // Next game = the upcoming game (first game in the future)
        if (nextUpcomingIndex >= 0) {
            const nextGameDate = new Date(allGamesSorted[nextUpcomingIndex].date);
            // Double-check that this game is actually in the future
            if (nextGameDate.getTime() > nowTime) {
                result.nextGame = await formatGame(allGamesSorted[nextUpcomingIndex]);
            } else {
                // Game is in the past, check if there are more games to fetch
                console.log('Next game found is in the past, checking for more games...');
                // Try fetching more games if available
                if (schedule.items.length > gamesToFetch) {
                    // Fetch additional games to find future ones
                    const additionalItems = schedule.items.slice(gamesToFetch, Math.min(schedule.items.length, gamesToFetch + 10));
                    const additionalGames = await Promise.all(
                        additionalItems.map(async (item) => {
                            const response = await fetch(item.$ref);
                            return await response.json();
                        })
                    );
                    // Sort and find next future game
                    additionalGames.sort((a, b) => new Date(a.date) - new Date(b.date));
                    for (const game of additionalGames) {
                        const gameDate = new Date(game.date);
                        if (gameDate.getTime() > nowTime) {
                            result.nextGame = await formatGame(game);
                            break;
                        }
                    }
                }
                // If still no future game found, show next season placeholder
                if (!result.nextGame) {
                    const nextSeasonYear = currentYear + 1;
                    result.nextGame = {
                        name: `Regular Season ${nextSeasonYear}`,
                        date: `${nextSeasonYear}-09-07T00:00Z`,
                        status: 'SCHEDULED',
                        opponent: 'TBD'
                    };
                }
            }
        } else {
            // No future game found in initial batch, try fetching more games
            if (schedule.items.length > gamesToFetch) {
                console.log('No future game in first batch, fetching more games...');
                const additionalItems = schedule.items.slice(gamesToFetch, Math.min(schedule.items.length, gamesToFetch + 10));
                const additionalGames = await Promise.all(
                    additionalItems.map(async (item) => {
                        const response = await fetch(item.$ref);
                        return await response.json();
                    })
                );
                // Sort and find next future game
                additionalGames.sort((a, b) => new Date(a.date) - new Date(b.date));
                for (const game of additionalGames) {
                    const gameDate = new Date(game.date);
                    if (gameDate.getTime() > nowTime) {
                        result.nextGame = await formatGame(game);
                        break;
                    }
                }
            }
            // If still no future game found, show next season placeholder
            if (!result.nextGame) {
                const nextSeasonYear = currentYear + 1;
                result.nextGame = {
                    name: `Regular Season ${nextSeasonYear}`,
                    date: `${nextSeasonYear}-09-07T00:00Z`,
                    status: 'SCHEDULED',
                    opponent: 'TBD'
                };
            }
        }

        console.log('Schedule processed:', {
            total: allGamesSorted.length,
            latestGame: mostRecentCompletedGame ? {
                date: new Date(mostRecentCompletedGame.date).toISOString(),
                name: mostRecentCompletedGame.name
            } : 'none',
            nextGame: nextUpcomingIndex >= 0 && allGamesSorted[nextUpcomingIndex] ? {
                date: new Date(allGamesSorted[nextUpcomingIndex].date).toISOString(),
                name: allGamesSorted[nextUpcomingIndex].name
            } : 'none',
            current: currentIndex,
            nowTime: new Date().toISOString()
        });

        // Cache the result
        scheduleCache.data = result;
        scheduleCache.timestamp = currentTime;

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Cache-Control': 'public, max-age=1800' // Cache for 30 minutes
            },
            body: JSON.stringify({
                ...result,
                timestamp: new Date().toISOString(),
                cached: false
            })
        };

    } catch (error) {
        console.error('Error getting schedule:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: 'Failed to get schedule',
                message: error.message,
                timestamp: new Date().toISOString()
            })
        };
    }
};

// Helper function to determine current NFL season year
// NFL season spans two calendar years (Sept - Feb)
function getCurrentSeasonYear() {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const year = now.getFullYear();

    // NFL regular season is Sept (9) - Jan (1), playoffs through Feb (2)
    // If we're in Jan-Feb, we're still in the previous year's season
    if (month <= 2) {
        return year - 1;
    }
    // March-August: previous season ended, next season hasn't started
    // But check current year for preseason games starting in August
    if (month <= 8) {
        return year;
    }
    // September-December: current year's season
    return year;
}

async function getSchedule() {
    const currentYear = getCurrentSeasonYear();
    const previousYear = currentYear - 1;
    const nextYear = currentYear + 1;
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12

    // During regular season (Sept-Feb), prioritize regular season games
    // During offseason (Mar-Aug), include preseason games
    const isRegularSeason = month >= 9 || month <= 2;

    // Build URL list based on season
    const urls = [];

    if (isRegularSeason) {
        // Regular season: prioritize current year regular season, skip preseason
        urls.push(`${ESPN_API_BASE}/seasons/${currentYear}/types/2/teams/8/events`); // Current year regular season (PRIORITY)
        urls.push(`${ESPN_API_BASE}/seasons/${previousYear}/types/2/teams/8/events`); // Previous year regular season (for Jan-Feb)
        urls.push(`${ESPN_API_BASE}/seasons/${nextYear}/types/2/teams/8/events`); // Next year (if late in current season)
    } else {
        // Offseason: include preseason games for upcoming season
        urls.push(`${ESPN_API_BASE}/seasons/${currentYear}/types/2/teams/8/events`); // Current year regular season
        urls.push(`${ESPN_API_BASE}/seasons/${currentYear}/types/1/teams/8/events`); // Current year preseason
        urls.push(`${ESPN_API_BASE}/seasons/${previousYear}/types/2/teams/8/events`); // Previous year regular season
    }

    let combinedSchedule = { items: [] };

    for (const url of urls) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                if (data.items && data.items.length > 0) {
                    console.log(`Adding schedule from: ${url} (${data.items.length} games)`);
                    combinedSchedule.items = combinedSchedule.items.concat(data.items);
                }
            }
        } catch (error) {
            console.log(`Failed to fetch from ${url}:`, error.message);
        }
    }

    if (combinedSchedule.items.length === 0) {
        throw new Error('No schedule data available');
    }

    return combinedSchedule;
}

async function formatGame(game) {
    try {
        // Get detailed game info
        const gameData = await getGameDetails(game.id);
        const competition = gameData.competitions[0];

        // Get teams
        const teams = competition.competitors;
        const homeTeam = teams.find(t => t.homeAway === 'home');
        const awayTeam = teams.find(t => t.homeAway === 'away');

        // OPTIMIZE: Fetch team data in parallel instead of sequentially
        const [homeTeamData, awayTeamData] = await Promise.all([
            fetch(homeTeam.team.$ref).then(r => r.json()),
            fetch(awayTeam.team.$ref).then(r => r.json())
        ]);

        // Check if Lions are home or away (compare as strings)
        const lionsIsHome = homeTeamData.id.toString() === LIONS_ID.toString();
        const opponentTeamData = lionsIsHome ? awayTeamData : homeTeamData;

        // Get scores if available
        let lionsScore = 0;
        let opponentScore = 0;
        let result = null;

        // Get game status first - need it to determine if game is live
        // Status might be a direct object or a $ref link
        let gameStatus = 'UNKNOWN';
        if (competition.status) {
            if (competition.status.$ref) {
                // Status is a reference, fetch it
                try {
                    const statusData = await fetch(competition.status.$ref).then(r => r.json());
                    gameStatus = statusData.type?.name || 'UNKNOWN';
                } catch (error) {
                    console.error('Error fetching game status:', error);
                    gameStatus = 'UNKNOWN';
                }
            } else if (competition.status.type?.name) {
                gameStatus = competition.status.type.name;
            }
        }
        const isGameLive = gameStatus === 'STATUS_IN_PROGRESS';

        if (homeTeam.score && awayTeam.score) {
            // OPTIMIZE: Fetch score data in parallel
            const scorePromises = [];
            if (typeof homeTeam.score === 'object' && homeTeam.score.$ref) {
                scorePromises.push(fetch(homeTeam.score.$ref).then(r => r.json()).then(data => ({ type: 'home', data })));
            } else {
                scorePromises.push(Promise.resolve({ type: 'home', data: homeTeam.score }));
            }
            if (typeof awayTeam.score === 'object' && awayTeam.score.$ref) {
                scorePromises.push(fetch(awayTeam.score.$ref).then(r => r.json()).then(data => ({ type: 'away', data })));
            } else {
                scorePromises.push(Promise.resolve({ type: 'away', data: awayTeam.score }));
            }
            
            const scoreResults = await Promise.all(scorePromises);
            const homeScoreData = scoreResults.find(r => r.type === 'home')?.data || homeTeam.score;
            const awayScoreData = scoreResults.find(r => r.type === 'away')?.data || awayTeam.score;

            const homeScore = parseInt(homeScoreData.value || homeScoreData || 0);
            const awayScore = parseInt(awayScoreData.value || awayScoreData || 0);

            lionsScore = lionsIsHome ? homeScore : awayScore;
            opponentScore = lionsIsHome ? awayScore : homeScore;

            // CRITICAL: Never set a result if the game is in progress
            if (isGameLive) {
                result = null; // Explicitly clear result for live games
            } else if (gameStatus === 'STATUS_FINAL' || gameStatus === 'STATUS_FINAL_OVERTIME') {
                // Game is finished, determine result
                if (lionsScore > opponentScore) {
                    result = 'WIN';
                } else if (lionsScore < opponentScore) {
                    result = 'LOSS';
                } else {
                    result = 'TIE';
                }
            } else {
                // Game is scheduled or unknown - don't set a result
                result = null;
            }
        }

        return {
            id: game.id,
            name: game.name,
            date: game.date,
            opponent: opponentTeamData.displayName,
            homeAway: lionsIsHome ? 'home' : 'away',
            score: {
                lions: lionsScore,
                opponent: opponentScore
            },
            result: isGameLive ? null : result, // Explicitly clear result if live
            status: gameStatus,
            isLive: isGameLive
        };
    } catch (error) {
        console.error('Error formatting game:', error);
        return {
            id: game.id,
            name: game.name,
            date: game.date,
            opponent: 'Unknown',
            homeAway: 'unknown',
            score: { lions: 0, opponent: 0 },
            result: null,
            status: 'UNKNOWN'
        };
    }
}

async function getGameDetails(gameId) {
    const gameUrl = `${ESPN_API_BASE}/events/${gameId}`;
    const response = await fetch(gameUrl);

    if (!response.ok) {
        throw new Error(`Game details API error: ${response.status}`);
    }

    return await response.json();
}
