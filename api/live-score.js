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
function getEasternDateParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    }).formatToParts(date);
    const get = (type) => parseInt(parts.find(p => p.type === type)?.value || '0', 10);
    return { year: get('year'), month: get('month'), day: get('day') };
}

function getCurrentSeasonYear() {
    const { year, month } = getEasternDateParts();
    if (month <= 2) {
        return year - 1;
    }
    return year;
}

async function getSchedule() {
    const currentYear = getCurrentSeasonYear();
    const previousYear = currentYear - 1;
    const nextYear = currentYear + 1;

    // Merge preseason + regular so live games during August aren't missed once
    // the regular-season schedule is already published.
    const urls = [
        `${ESPN_API_BASE}/seasons/${currentYear}/types/1/teams/8/events`,
        `${ESPN_API_BASE}/seasons/${currentYear}/types/2/teams/8/events`,
        `${ESPN_API_BASE}/seasons/${previousYear}/types/2/teams/8/events`,
        `${ESPN_API_BASE}/seasons/${nextYear}/types/2/teams/8/events`
    ];

    const combined = { items: [] };
    const seen = new Set();

    for (const url of urls) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                if (data.items && data.items.length > 0) {
                    console.log(`Adding live-score schedule from: ${url} (${data.items.length} games)`);
                    for (const item of data.items) {
                        const key = item.$ref || item.id;
                        if (key && seen.has(key)) continue;
                        if (key) seen.add(key);
                        combined.items.push(item);
                    }
                }
            }
        } catch (error) {
            console.log(`Failed to fetch from ${url}:`, error.message);
        }
    }

    if (combined.items.length === 0) {
        throw new Error('No schedule data available');
    }

    return combined;
}

async function findLatestGame(schedule) {
    const now = new Date();
    const nowTime = now.getTime();

    if (!schedule.items || schedule.items.length === 0) {
        throw new Error('No games found in schedule');
    }

    // Load all stubs, then pick the game closest to now (live / just finished / soon)
    const games = await Promise.all(
        schedule.items.map(async (item) => {
            try {
                const response = await fetch(item.$ref);
                return await response.json();
            } catch (error) {
                console.error(`Error fetching game:`, error);
                return null;
            }
        })
    );

    const validGames = games.filter(game => game !== null && game.id);
    validGames.sort((a, b) => new Date(a.date) - new Date(b.date));

    let latestGame = null;
    let closestTimeDiff = Infinity;

    for (const game of validGames) {
        const gameTime = Date.parse(game.date);
        const timeDiff = Math.abs(gameTime - nowTime);

        if (timeDiff < closestTimeDiff) {
            closestTimeDiff = timeDiff;
            latestGame = game;
        }
    }

    if (latestGame) {
        console.log(`Found latest game: ${latestGame.id} (${latestGame.name})`);
        return latestGame.id;
    }

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
