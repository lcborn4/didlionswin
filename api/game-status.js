// Game Status API - Check if Lions game is currently live
// Using built-in fetch (Node.js 18+)

const LIONS_ID = '8';
const ESPN_API_BASE = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl';

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
        console.log('Game status check requested');

        // Get Lions schedule
        const schedule = await getSchedule();
        const today = new Date();

        // Find today's game or the most recent game
        let currentGame = null;
        let nextGame = null;

        // Check if schedule has items
        if (!schedule.items || schedule.items.length === 0) {
            throw new Error('No games found in schedule');
        }

        // Get the actual event data for all schedule items, then pick by date
        const recentGames = await Promise.all(
            schedule.items.map(async (item) => {
                const response = await fetch(item.$ref);
                return await response.json();
            })
        );

        recentGames
            .filter(Boolean)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .forEach((event) => {
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

        // Check if it's off-season or bye week
        if (!currentGame && nextGame) {
            const nextGameDate = new Date(nextGame.date);
            const daysUntilNext = (nextGameDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

            if (daysUntilNext > 30) {
                gameStatus.season.isOffSeason = true;
            } else if (daysUntilNext > 14) {
                // Likely a bye week - more than 14 days until next game (preseason→Week 1 is usually ~12)
                gameStatus.season.isByeWeek = true;
            }
        }

        // Check if we're in a bye week by looking at the schedule pattern
        if (!currentGame && !gameStatus.season.isOffSeason) {
            const sortedGames = [...recentGames].filter(Boolean).sort((a, b) => new Date(a.date) - new Date(b.date));

            for (let i = 0; i < sortedGames.length - 1; i++) {
                const currentGameDate = new Date(sortedGames[i].date);
                const nextGameDate = new Date(sortedGames[i + 1].date);
                const daysBetween = (nextGameDate.getTime() - currentGameDate.getTime()) / (1000 * 60 * 60 * 24);

                // Regular-season bye gaps are typically 8-14 days; skip preseason→Week 1 gaps
                const isPreToRegularGap =
                    (sortedGames[i].seasonType?.$ref || '').includes('/types/1') &&
                    (sortedGames[i + 1].seasonType?.$ref || '').includes('/types/2');

                if (!isPreToRegularGap && daysBetween >= 8 && daysBetween <= 14) {
                    const todayCheck = new Date();
                    if (todayCheck >= currentGameDate && todayCheck <= nextGameDate) {
                        gameStatus.season.isByeWeek = true;
                        break;
                    }
                }
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
                    console.log(`Adding game-status schedule from: ${url} (${data.items.length} games)`);
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

async function getGameDetails(gameId) {
    const gameUrl = `${ESPN_API_BASE}/events/${gameId}`;
    const response = await fetch(gameUrl);

    if (!response.ok) {
        throw new Error(`Game details API error: ${response.status}`);
    }

    return await response.json();
}
