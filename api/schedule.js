// Schedule API - Get previous, current, and next Lions games
// Using built-in fetch (Node.js 18+)

const LIONS_ID = '8';
const ESPN_API_BASE = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl';

// In-memory cache for faster responses
let scheduleCache = {
    data: null,
    timestamp: 0,
    ttl: 30 * 60 * 1000 // 30 minutes
};

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

        // Check cache first
        const now = Date.now();
        if (scheduleCache.data && (now - scheduleCache.timestamp) < scheduleCache.ttl) {
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

        // Get only the first 10 games for performance (should cover recent + upcoming)
        const limitedItems = schedule.items.slice(0, 10);
        console.log(`Processing ${limitedItems.length} games out of ${schedule.items.length} total`);

        // Get games in parallel for speed
        const allGames = await Promise.all(
            limitedItems.map(async (item) => {
                const response = await fetch(item.$ref);
                return await response.json();
            })
        );

        // Sort games by date
        allGames.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Find current position in schedule
        let currentIndex = -1;
        let latestCompletedIndex = -1;

        for (let i = 0; i < allGames.length; i++) {
            const gameDate = new Date(allGames[i].date);
            if (gameDate <= now) {
                latestCompletedIndex = i;
            }

            // Check if this is today's game (within 4 hours)
            const timeDiff = Math.abs(gameDate.getTime() - now.getTime());
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            if (hoursDiff <= 4) {
                currentIndex = i;
            }
        }

        // Determine previous, current, and next games
        const result = {
            previousGame: null,
            currentGame: null,
            latestGame: null,
            nextGame: null,
            season: {
                type: 'preseason',
                year: 2025
            }
        };

        // Latest completed game
        if (latestCompletedIndex >= 0) {
            result.latestGame = await formatGame(allGames[latestCompletedIndex]);
        }

        // Previous game (before latest completed)
        if (latestCompletedIndex > 0) {
            result.previousGame = await formatGame(allGames[latestCompletedIndex - 1]);
        }

        // Current game (if any today)
        if (currentIndex >= 0) {
            result.currentGame = await formatGame(allGames[currentIndex]);
        }

        // Next upcoming game
        const nextIndex = latestCompletedIndex + 1;
        if (nextIndex < allGames.length) {
            result.nextGame = await formatGame(allGames[nextIndex]);
        } else {
            // No more preseason games, check regular season
            result.nextGame = {
                name: 'Regular Season 2025',
                date: '2025-09-07T00:00Z', // Approximate start
                status: 'SCHEDULED',
                opponent: 'TBD'
            };
        }

        console.log('Schedule processed:', {
            total: allGames.length,
            latest: latestCompletedIndex,
            current: currentIndex
        });

        // Cache the result
        scheduleCache.data = result;
        scheduleCache.timestamp = now;

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

async function getSchedule() {
    // Try 2025 preseason first, then 2025 regular season, then fall back to 2024
    const urls = [
        `${ESPN_API_BASE}/seasons/2025/types/1/teams/8/events`, // 2025 preseason
        `${ESPN_API_BASE}/seasons/2025/types/2/teams/8/events`, // 2025 regular season
        `${ESPN_API_BASE}/seasons/2024/types/2/teams/8/events`  // 2024 regular season
    ];

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

            if (lionsScore > opponentScore) {
                result = 'WIN';
            } else if (lionsScore < opponentScore) {
                result = 'LOSS';
            } else {
                result = 'TIE';
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
            status: competition.status.type.name
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
