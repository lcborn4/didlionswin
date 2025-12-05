// Live Score API - Serverless function for real-time score updates
// Using built-in fetch (Node.js 18+)

const LIONS_ID = '8';
const ESPN_API_BASE = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl';

// In-memory cache to reduce API calls and costs
let cache = {
    data: null,
    timestamp: 0,
    ttl: 60 * 1000 // 60 seconds
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
        console.log('Live score request received');

        // Check cache first to reduce ESPN API calls
        const now = Date.now();
        if (cache.data && (now - cache.timestamp) < cache.ttl) {
            console.log('Returning cached data');
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Cache-Control': 'no-cache'
                },
                body: JSON.stringify({
                    ...cache.data,
                    cached: true,
                    cacheAge: Math.floor((now - cache.timestamp) / 1000)
                })
            };
        }

        // Get game ID from query parameters
        const gameId = event.queryStringParameters?.gameId;

        if (!gameId) {
            // Get current/latest game if no ID provided
            const schedule = await getSchedule();
            const latestGameId = await findLatestGame(schedule);
            return await getLiveGameData(latestGameId);
        }

        return await getLiveGameData(gameId);

    } catch (error) {
        console.error('Error fetching live score:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: 'Failed to fetch live score',
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
    
    // Try current year regular season first, then preseason, then previous year as fallback
    const urls = [
        `${ESPN_API_BASE}/seasons/${currentYear}/types/2/teams/8/events`, // Current year regular season (PRIORITY)
        `${ESPN_API_BASE}/seasons/${currentYear}/types/1/teams/8/events`, // Current year preseason
        `${ESPN_API_BASE}/seasons/${previousYear}/types/2/teams/8/events`, // Previous year regular season (for Jan-Feb)
        `${ESPN_API_BASE}/seasons/${nextYear}/types/2/teams/8/events`  // Next year (if late in current season)
    ];

    for (const url of urls) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                if (data.items && data.items.length > 0) {
                    console.log(`Using schedule from: ${url}`);
                    return data;
                }
            }
        } catch (error) {
            console.log(`Failed to fetch from ${url}:`, error.message);
        }
    }

    throw new Error('No schedule data available');
}

async function findLatestGame(schedule) {
    const now = new Date();
    const nowTime = now.getTime();

    // Get actual event data from items
    if (!schedule.items || schedule.items.length === 0) {
        throw new Error('No games found in schedule');
    }

    // Get the first 5 recent games
    const games = await Promise.all(
        schedule.items.slice(0, 5).map(async (item) => {
            try {
                const response = await fetch(item.$ref);
                return await response.json();
            } catch (error) {
                console.error(`Error fetching game:`, error);
                return null;
            }
        })
    );

    // Filter out nulls
    const validGames = games.filter(game => game !== null && game.id);

    // Find the game closest to now (could be past or future)
    let latestGame = null;
    let closestTimeDiff = Infinity;

    for (const game of validGames) {
        const gameTime = Date.parse(game.date);
        const timeDiff = Math.abs(gameTime - nowTime);
        
        // If this game is closer to now, use it
        if (timeDiff < closestTimeDiff) {
            closestTimeDiff = timeDiff;
            latestGame = game;
        }
    }

    if (latestGame) {
        console.log(`Found latest game: ${latestGame.id} (${latestGame.name})`);
        return latestGame.id;
    }

    // Fallback to first game
    if (validGames.length > 0) {
        return validGames[0].id;
    }

    throw new Error('No valid games found in schedule');
}

async function getLiveGameData(gameId) {
    console.log(`Fetching live data for game: ${gameId}`);

    const gameUrl = `${ESPN_API_BASE}/events/${gameId}`;
    const gameResponse = await fetch(gameUrl);

    if (!gameResponse.ok) {
        throw new Error(`Game API error: ${gameResponse.status}`);
    }

    const gameData = await gameResponse.json();
    
    if (!gameData.competitions || !gameData.competitions[0]) {
        throw new Error('Invalid game data: no competitions found');
    }
    
    const competition = gameData.competitions[0];

    if (!competition.competitors || competition.competitors.length < 2) {
        throw new Error('Invalid game data: insufficient competitors');
    }

    // Get scores safely
    let teamOneScore = { value: 0 };
    let teamTwoScore = { value: 0 };
    
    try {
        const teamOneScoreRef = competition.competitors[0]?.score?.$ref || competition.competitors[0]?.score;
        const teamTwoScoreRef = competition.competitors[1]?.score?.$ref || competition.competitors[1]?.score;
        
        if (teamOneScoreRef && typeof teamOneScoreRef === 'string' && teamOneScoreRef.includes('http')) {
            teamOneScore = await fetch(teamOneScoreRef).then(r => r.json()).catch(() => ({ value: 0 }));
        } else if (teamOneScoreRef && typeof teamOneScoreRef === 'object') {
            teamOneScore = teamOneScoreRef;
        }
        
        if (teamTwoScoreRef && typeof teamTwoScoreRef === 'string' && teamTwoScoreRef.includes('http')) {
            teamTwoScore = await fetch(teamTwoScoreRef).then(r => r.json()).catch(() => ({ value: 0 }));
        } else if (teamTwoScoreRef && typeof teamTwoScoreRef === 'object') {
            teamTwoScore = teamTwoScoreRef;
        }
    } catch (error) {
        console.error('Error fetching scores:', error);
        // Continue with default scores of 0
    }

    // Get game status safely
    let status = { type: { name: 'UNKNOWN' }, period: 0, displayClock: '' };
    
    try {
        const statusRef = competition.status?.$ref || competition.status;
        
        if (statusRef && typeof statusRef === 'string' && statusRef.includes('http')) {
            status = await fetch(statusRef).then(r => r.json()).catch(() => status);
        } else if (statusRef && typeof statusRef === 'object') {
            status = statusRef;
        }
    } catch (error) {
        console.error('Error fetching status:', error);
        // Continue with default status
    }

    const statusName = status.type?.name || status.type || 'UNKNOWN';

    // Determine Lions result
    let lionsResult = '';
    let lionsScore = 0;
    let opponentScore = 0;
    let opponentName = 'Unknown';

    competition.competitors.forEach((competitor) => {
        if (competitor.id === LIONS_ID) {
            lionsScore = competitor.id === competition.competitors[0].id ?
                (teamOneScore.value || teamOneScore || 0) : (teamTwoScore.value || teamTwoScore || 0);

            if (competitor.winner !== undefined) {
                lionsResult = competitor.winner ? 'WIN' : 'LOSS';
            } else if (statusName === 'STATUS_IN_PROGRESS') {
                lionsResult = 'In Progress';
            }
        } else {
            opponentName = competitor.team?.displayName || 'Unknown';
            opponentScore = competitor.id === competition.competitors[0].id ?
                (teamOneScore.value || teamOneScore || 0) : (teamTwoScore.value || teamTwoScore || 0);
        }
    });

    const liveData = {
        gameId: gameId,
        name: gameData.name || 'Unknown Game',
        date: gameData.date || new Date().toISOString(),
        status: statusName,
        result: lionsResult,
        score: {
            lions: lionsScore,
            opponent: opponentScore
        },
        opponent: opponentName,
        isLive: statusName === 'STATUS_IN_PROGRESS',
        timestamp: new Date().toISOString(),
        quarter: status.period || 0,
        clock: status.displayClock || '',
        espnUrl: `https://www.espn.com/nfl/game/_/gameId/${gameId}`
    };

    // Cache the result
    cache = {
        data: liveData,
        timestamp: Date.now(),
        ttl: liveData.isLive ? 60 * 1000 : 5 * 60 * 1000 // 1 min if live, 5 min if not
    };

    console.log('Live data retrieved:', {
        result: lionsResult,
        score: `${lionsScore}-${opponentScore}`,
        status: status.type.name
    });

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Cache-Control': liveData.isLive ? 'no-cache' : 'public, max-age=300'
        },
        body: JSON.stringify(liveData)
    };
}
