// Live Score API - Serverless function for real-time score updates
import fetch from 'node-fetch';

const LIONS_ID = '8';
const ESPN_API_BASE = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl';

// In-memory cache to reduce API calls and costs
let cache = {
    data: null,
    timestamp: 0,
    ttl: 60 * 1000 // 60 seconds
};

export const handler = async (event, context) => {
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
            const latestGameId = findLatestGame(schedule);
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

async function getSchedule() {
    const scheduleUrl = `${ESPN_API_BASE}/seasons/2024/types/2/teams/8/events`;
    const response = await fetch(scheduleUrl);

    if (!response.ok) {
        throw new Error(`ESPN API error: ${response.status}`);
    }

    return await response.json();
}

function findLatestGame(schedule) {
    const now = new Date();
    let latestGameIndex = 0;

    schedule.events.forEach((event, index) => {
        if (Date.parse(event.date) <= now.getTime()) {
            latestGameIndex = index;
        }
    });

    return schedule.events[latestGameIndex].id;
}

async function getLiveGameData(gameId) {
    console.log(`Fetching live data for game: ${gameId}`);

    const gameUrl = `${ESPN_API_BASE}/events/${gameId}`;
    const gameResponse = await fetch(gameUrl);

    if (!gameResponse.ok) {
        throw new Error(`Game API error: ${gameResponse.status}`);
    }

    const gameData = await gameResponse.json();
    const competition = gameData.competitions[0];

    // Get scores
    const teamOneScoreUrl = competition.competitors[0].score['$ref'];
    const teamTwoScoreUrl = competition.competitors[1].score['$ref'];

    const [teamOneScore, teamTwoScore] = await Promise.all([
        fetch(teamOneScoreUrl).then(r => r.json()),
        fetch(teamTwoScoreUrl).then(r => r.json())
    ]);

    // Get game status
    const statusUrl = competition.status['$ref'];
    const status = await fetch(statusUrl).then(r => r.json());

    // Determine Lions result
    let lionsResult = '';
    let lionsScore = 0;
    let opponentScore = 0;
    let opponentName = '';

    competition.competitors.forEach((competitor) => {
        if (competitor.id === LIONS_ID) {
            lionsScore = competitor.id === competition.competitors[0].id ?
                teamOneScore.value : teamTwoScore.value;

            if (competitor.winner !== undefined) {
                lionsResult = competitor.winner ? 'WIN' : 'LOSS';
            } else if (status.type.name === 'STATUS_IN_PROGRESS') {
                lionsResult = 'In Progress';
            }
        } else {
            opponentName = competitor.team.displayName;
            opponentScore = competitor.id === competition.competitors[0].id ?
                teamOneScore.value : teamTwoScore.value;
        }
    });

    const liveData = {
        gameId: gameId,
        name: gameData.name,
        date: gameData.date,
        status: status.type.name,
        result: lionsResult,
        score: {
            lions: lionsScore,
            opponent: opponentScore
        },
        opponent: opponentName,
        isLive: status.type.name === 'STATUS_IN_PROGRESS',
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
