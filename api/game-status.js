// Game Status API - Check if Lions game is currently live
// Using built-in fetch (Node.js 18+)

const LIONS_ID = '8';
const ESPN_API_BASE = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl';

export const handler = async (event, context) => {
    try {
        console.log('Game status check requested');

        // Get Lions schedule
        const schedule = await getSchedule();
        const today = new Date();

        // Find today's game or the most recent game
        let currentGame = null;
        let nextGame = null;

        schedule.events.forEach((event, index) => {
            const gameDate = new Date(event.date);
            const timeDiff = gameDate.getTime() - today.getTime();
            const hoursDiff = timeDiff / (1000 * 60 * 60);

            // Game is today or recently finished (within 4 hours)
            if (Math.abs(hoursDiff) <= 4) {
                currentGame = event;
            }

            // Next upcoming game
            if (timeDiff > 0 && !nextGame) {
                nextGame = event;
            }
        });

        let gameStatus = {
            hasLiveGame: false,
            isGameDay: false,
            currentGame: null,
            nextGame: nextGame,
            shouldPoll: false,
            pollInterval: 300000, // 5 minutes default
            season: {
                isOffSeason: false,
                type: 'Regular Season'
            }
        };

        if (currentGame) {
            // Get detailed game info
            const gameData = await getGameDetails(currentGame.id);
            const competition = gameData.competitions[0];
            const statusUrl = competition.status['$ref'];
            const status = await fetch(statusUrl).then(r => r.json());

            gameStatus.isGameDay = true;
            gameStatus.currentGame = {
                id: currentGame.id,
                name: currentGame.name,
                date: currentGame.date,
                status: status.type.name,
                isLive: status.type.name === 'STATUS_IN_PROGRESS',
                isPreGame: status.type.name === 'STATUS_SCHEDULED',
                isPostGame: status.type.name === 'STATUS_FINAL'
            };

            // Determine if we should poll and how often
            if (status.type.name === 'STATUS_IN_PROGRESS') {
                gameStatus.hasLiveGame = true;
                gameStatus.shouldPoll = true;
                gameStatus.pollInterval = 60000; // 1 minute during live game
            } else if (status.type.name === 'STATUS_SCHEDULED') {
                const gameTime = new Date(currentGame.date);
                const timeUntilGame = gameTime.getTime() - today.getTime();

                // Start polling 30 minutes before game
                if (timeUntilGame <= 30 * 60 * 1000) {
                    gameStatus.shouldPoll = true;
                    gameStatus.pollInterval = 120000; // 2 minutes before game
                }
            }
        }

        // Check if it's off-season
        if (!currentGame && nextGame) {
            const nextGameDate = new Date(nextGame.date);
            const daysUntilNext = (nextGameDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

            if (daysUntilNext > 30) {
                gameStatus.season.isOffSeason = true;
            }
        }

        console.log('Game status:', {
            hasLive: gameStatus.hasLiveGame,
            shouldPoll: gameStatus.shouldPoll,
            interval: gameStatus.pollInterval
        });

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
            },
            body: JSON.stringify({
                ...gameStatus,
                timestamp: new Date().toISOString(),
                timezone: 'America/New_York'
            })
        };

    } catch (error) {
        console.error('Error checking game status:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: 'Failed to check game status',
                message: error.message,
                hasLiveGame: false,
                shouldPoll: false,
                timestamp: new Date().toISOString()
            })
        };
    }
};

async function getSchedule() {
    const scheduleUrl = `${ESPN_API_BASE}/seasons/2024/types/2/teams/8/events`;
    const response = await fetch(scheduleUrl);

    if (!response.ok) {
        throw new Error(`Schedule API error: ${response.status}`);
    }

    return await response.json();
}

async function getGameDetails(gameId) {
    const gameUrl = `${ESPN_API_BASE}/events/${gameId}`;
    const response = await fetch(gameUrl);

    if (!response.ok) {
        throw new Error(`Game details API error: ${response.status}`);
    }

    return await response.json();
}
