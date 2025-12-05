// Schedule API - Get previous, current, and next Lions games
// Using built-in fetch (Node.js 18+)

const LIONS_ID = '8';
const ESPN_API_BASE = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl';

// In-memory cache for faster responses
let scheduleCache = {
    data: null,
    timestamp: 0,
    ttl: 5 * 60 * 1000 // 5 minutes (reduced for fresher data)
};

// Clear cache on module load to ensure fresh data
scheduleCache.data = null;
scheduleCache.timestamp = 0;

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

        // Process all available games to ensure we capture all games including the most recent ones
        // NFL teams play ~17 regular season games + preseason, so fetch all games to be safe
        const gamesToFetch = schedule.items.length; // Fetch ALL games to ensure we don't miss any
        const limitedItems = schedule.items.slice(0, gamesToFetch);
        console.log(`Processing ${limitedItems.length} games out of ${schedule.items.length} total`);

        // Get games in parallel for speed
        const allGames = await Promise.all(
            limitedItems.map(async (item) => {
                const response = await fetch(item.$ref);
                return await response.json();
            })
        );

        // Sort games by date (oldest to newest)
        allGames.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Find latest, previous, and next games based on current date
        let currentIndex = -1;
        let nextUpcomingIndex = -1;
        let mostRecentCompletedGame = null;
        let mostRecentCompletedTime = 0;

        // Use current date/time to determine game positions
        const nowTime = now.getTime();

        for (let i = 0; i < allGames.length; i++) {
            const gameDate = new Date(allGames[i].date);
            const gameTime = gameDate.getTime();

            // Next game = the first upcoming game (in the future from current date)
            if (nextUpcomingIndex === -1 && gameTime > nowTime) {
                nextUpcomingIndex = i;
            }

            // Latest game = the most recent completed game (closest to now, but in the past)
            if (gameTime <= nowTime && gameTime > mostRecentCompletedTime) {
                mostRecentCompletedGame = allGames[i];
                mostRecentCompletedTime = gameTime;
            }

            // Check if this is today's game (within 4 hours)
            const timeDiff = Math.abs(gameTime - nowTime);
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            if (hoursDiff <= 4) {
                currentIndex = i;
            }
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

        // Check current game first (if within 4 hours) - this might be live
        if (currentIndex >= 0) {
            const currentGameData = await formatGame(allGames[currentIndex]);
            // If game is live, set it as currentGame (not latestGame)
            if (currentGameData.isLive || currentGameData.status === 'STATUS_IN_PROGRESS') {
                result.currentGame = currentGameData;
                // Don't include live game as latestGame - find the most recent completed one
                mostRecentCompletedGame = null;
                mostRecentCompletedTime = 0;
                
                // Find the most recent COMPLETED game (before the live game)
                for (let i = 0; i < allGames.length; i++) {
                    if (i === currentIndex) continue; // Skip the live game
                    const gameDate = new Date(allGames[i].date);
                    const gameTime = gameDate.getTime();
                    if (gameTime < nowTime && gameTime > mostRecentCompletedTime) {
                        mostRecentCompletedGame = allGames[i];
                        mostRecentCompletedTime = gameTime;
                    }
                }
            } else if (currentGameData.status === 'STATUS_FINAL' || currentGameData.status === 'STATUS_FINAL_OVERTIME') {
                // Game is finished - it's the latest game, not current
                result.latestGame = currentGameData;
                mostRecentCompletedGame = allGames[currentIndex];
            } else {
                // Game is scheduled but not started yet - it's the next game
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

                // Previous game = the game that occurred before the latest game
                const latestGameDate = new Date(mostRecentCompletedGame.date);
                let previousGame = null;
                let previousGameTime = 0;

                for (let i = 0; i < allGames.length; i++) {
                    if (i === currentIndex) continue; // Skip current game if it exists
                    const gameDate = new Date(allGames[i].date);
                    const gameTime = gameDate.getTime();

                    // Find the game that's before the latest game but closest to it
                    if (gameTime < latestGameDate.getTime() && gameTime > previousGameTime) {
                        previousGame = allGames[i];
                        previousGameTime = gameTime;
                    }
                }

                if (previousGame) {
                    result.previousGame = await formatGame(previousGame);
                }
            }
        }

        // Next game = the upcoming game (first game in the future)
        if (nextUpcomingIndex >= 0) {
            const nextGameDate = new Date(allGames[nextUpcomingIndex].date);
            // Double-check that this game is actually in the future
            if (nextGameDate.getTime() > nowTime) {
                result.nextGame = await formatGame(allGames[nextUpcomingIndex]);
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
                    if (gameDate.getTime() > nowWithBuffer.getTime()) {
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
            total: allGames.length,
            latestGame: mostRecentCompletedGame ? {
                date: new Date(mostRecentCompletedGame.date).toISOString(),
                name: mostRecentCompletedGame.name
            } : 'none',
            nextGame: nextUpcomingIndex >= 0 && allGames[nextUpcomingIndex] ? {
                date: new Date(allGames[nextUpcomingIndex].date).toISOString(),
                name: allGames[nextUpcomingIndex].name
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

        // Get team info by following the $ref links
        const homeTeamData = await fetch(homeTeam.team.$ref).then(r => r.json());
        const awayTeamData = await fetch(awayTeam.team.$ref).then(r => r.json());

        // Check if Lions are home or away (compare as strings)
        const lionsIsHome = homeTeamData.id.toString() === LIONS_ID.toString();
        const opponentTeamData = lionsIsHome ? awayTeamData : homeTeamData;

        // Get scores if available
        let lionsScore = 0;
        let opponentScore = 0;
        let result = null;

        if (homeTeam.score && awayTeam.score) {
            // Follow score references if they exist
            const homeScoreData = typeof homeTeam.score === 'object' && homeTeam.score.$ref
                ? await fetch(homeTeam.score.$ref).then(r => r.json())
                : homeTeam.score;
            const awayScoreData = typeof awayTeam.score === 'object' && awayTeam.score.$ref
                ? await fetch(awayTeam.score.$ref).then(r => r.json())
                : awayTeam.score;

            const homeScore = parseInt(homeScoreData.value || homeScoreData || 0);
            const awayScore = parseInt(awayScoreData.value || awayScoreData || 0);

            lionsScore = lionsIsHome ? homeScore : awayScore;
            opponentScore = lionsIsHome ? awayScore : homeScore;

            // Only set result if game is actually finished (not live/in progress)
            const gameStatus = competition.status?.type?.name || 'UNKNOWN';
            if (gameStatus === 'STATUS_FINAL' || gameStatus === 'STATUS_FINAL_OVERTIME') {
                // Game is finished, determine result
                if (lionsScore > opponentScore) {
                    result = 'WIN';
                } else if (lionsScore < opponentScore) {
                    result = 'LOSS';
                } else {
                    result = 'TIE';
                }
            } else {
                // Game is live or not finished yet - don't set a result
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
            result: result,
            status: competition.status?.type?.name || 'UNKNOWN',
            isLive: competition.status?.type?.name === 'STATUS_IN_PROGRESS'
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
