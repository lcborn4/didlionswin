// Live Score API - one or two ESPN site-api requests instead of crawling $ref links
const LIONS_ID = '8';
const SITE_API = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';

let cache = {
    data: null,
    timestamp: 0,
    ttl: 60 * 1000
};

const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Max-Age': '86400'
};

export const handler = async (event) => {
    if (event.httpMethod === 'OPTIONS' || event.requestContext?.http?.method === 'OPTIONS') {
        return { statusCode: 200, headers: corsHeaders, body: '' };
    }

    try {
        const now = Date.now();
        if (cache.data && (now - cache.timestamp) < cache.ttl) {
            return {
                statusCode: 200,
                headers: { ...corsHeaders, 'Cache-Control': 'no-cache' },
                body: JSON.stringify({
                    ...cache.data,
                    cached: true,
                    cacheAge: Math.floor((now - cache.timestamp) / 1000)
                })
            };
        }

        const gameId = event.queryStringParameters?.gameId;
        const liveData = gameId
            ? await getGameById(gameId)
            : await getHeadlineGame();

        cache = {
            data: liveData,
            timestamp: Date.now(),
            ttl: liveData.isLive ? 30 * 1000 : 5 * 60 * 1000
        };

        return {
            statusCode: 200,
            headers: {
                ...corsHeaders,
                'Cache-Control': liveData.isLive ? 'no-cache' : 'public, max-age=300'
            },
            body: JSON.stringify(liveData)
        };
    } catch (error) {
        console.error('Error fetching live score:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                error: 'Failed to fetch live score',
                message: error.message,
                timestamp: new Date().toISOString()
            })
        };
    }
};

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
    return month <= 2 ? year - 1 : year;
}

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`ESPN ${response.status} for ${url}`);
    }
    return response.json();
}

async function fetchSchedule(season, seasontype) {
    try {
        const data = await fetchJson(
            `${SITE_API}/teams/${LIONS_ID}/schedule?season=${season}&seasontype=${seasontype}`
        );
        return data.events || [];
    } catch (error) {
        console.log(`Schedule fetch failed (${season}/${seasontype}):`, error.message);
        return [];
    }
}

async function fetchScoreboard() {
    try {
        const data = await fetchJson(`${SITE_API}/scoreboard`);
        return (data.events || []).filter((event) =>
            (event.competitions?.[0]?.competitors || []).some((c) => String(c.id) === LIONS_ID)
        );
    } catch (error) {
        console.log('Scoreboard fetch failed:', error.message);
        return [];
    }
}

function mergeEvents(...lists) {
    const byId = new Map();
    for (const list of lists) {
        for (const event of list) {
            if (event?.id) byId.set(String(event.id), event);
        }
    }
    return [...byId.values()];
}

function getCompetition(event) {
    return event?.competitions?.[0] || null;
}

function getStatusName(event) {
    const type = getCompetition(event)?.status?.type;
    return type?.name || type?.state || 'UNKNOWN';
}

function isLiveStatus(statusName) {
    return (
        statusName === 'STATUS_IN_PROGRESS' ||
        statusName === 'STATUS_HALFTIME' ||
        statusName === 'STATUS_END_PERIOD' ||
        statusName === 'STATUS_END_OF_PERIOD' ||
        statusName === 'STATUS_DELAYED'
    );
}

function isFinalStatus(statusName, event) {
    const type = getCompetition(event)?.status?.type;
    return (
        statusName === 'STATUS_FINAL' ||
        statusName === 'STATUS_FINAL_OVERTIME' ||
        type?.completed === true ||
        type?.state === 'post'
    );
}

function parseScore(score) {
    if (score == null) return 0;
    if (typeof score === 'number') return score;
    if (typeof score === 'string') return Number(score) || 0;
    return Number(score.value ?? score.displayValue ?? 0) || 0;
}

function seasonTypeLabel(event) {
    const raw = event?.seasonType;
    const type = typeof raw === 'object' ? raw?.type ?? raw?.id : raw;
    if (type === 1 || type === '1') return 'preseason';
    if (type === 3 || type === '3') return 'postseason';
    return 'regular';
}

function toLiveData(event) {
    const competition = getCompetition(event);
    const competitors = competition?.competitors || [];
    const statusName = getStatusName(event);
    const live = isLiveStatus(statusName);

    let lionsScore = 0;
    let opponentScore = 0;
    let opponentName = 'Unknown';
    let lionsWinner;

    for (const competitor of competitors) {
        const team = competitor.team || {};
        const score = parseScore(competitor.score);
        if (String(competitor.id) === LIONS_ID) {
            lionsScore = score;
            lionsWinner = competitor.winner;
        } else {
            opponentScore = score;
            opponentName = team.displayName || team.name || team.abbreviation || 'Opponent';
        }
    }

    let result = '';
    let lead = null;

    if (live) {
        result = 'In Progress';
        if (lionsScore > opponentScore) lead = 'winning';
        else if (lionsScore < opponentScore) lead = 'losing';
        else lead = 'tied';
    } else if (statusName === 'STATUS_SCHEDULED') {
        result = '';
    } else if (lionsWinner === true) {
        result = 'WIN';
    } else if (lionsWinner === false && lionsScore === opponentScore) {
        result = 'TIE';
    } else if (lionsWinner === false) {
        result = 'LOSS';
    } else if (lionsScore > opponentScore) {
        result = 'WIN';
    } else if (lionsScore < opponentScore) {
        result = 'LOSS';
    } else if (isFinalStatus(statusName, event)) {
        result = 'TIE';
    }

    const statusObj = competition?.status || {};

    return {
        gameId: String(event.id),
        name: event.name || 'Unknown Game',
        date: event.date,
        status: statusName,
        result,
        lead,
        score: {
            lions: lionsScore,
            opponent: opponentScore
        },
        opponent: opponentName,
        isLive: live,
        seasonType: seasonTypeLabel(event),
        timestamp: new Date().toISOString(),
        quarter: statusObj.period || 0,
        clock: statusObj.displayClock || '',
        espnUrl: `https://www.espn.com/nfl/game/_/gameId/${event.id}`
    };
}

function pickHeadlineEvent(events) {
    let live = null;
    let latestFinal = null;
    let nextScheduled = null;
    const now = Date.now();

    for (const event of events) {
        const statusName = getStatusName(event);
        const time = Date.parse(event.date);

        if (isLiveStatus(statusName)) {
            live = event;
            continue;
        }

        const completed =
            isFinalStatus(statusName, event) ||
            (statusName !== 'STATUS_SCHEDULED' && Number.isFinite(time) && time < now);

        if (completed && statusName !== 'STATUS_SCHEDULED') {
            if (!latestFinal || time > Date.parse(latestFinal.date)) {
                latestFinal = event;
            }
        } else if (Number.isFinite(time) && time > now) {
            if (!nextScheduled || time < Date.parse(nextScheduled.date)) {
                nextScheduled = event;
            }
        }
    }

    return live || latestFinal || nextScheduled;
}

async function getHeadlineGame() {
    const year = getCurrentSeasonYear();
    const [pre, regular, post, board] = await Promise.all([
        fetchSchedule(year, 1),
        fetchSchedule(year, 2),
        fetchSchedule(year, 3),
        fetchScoreboard()
    ]);

    let events = mergeEvents(pre, regular, post, board);

    const hasFinal = events.some((event) => isFinalStatus(getStatusName(event), event));

    if (!hasFinal) {
        const [prevRegular, prevPost] = await Promise.all([
            fetchSchedule(year - 1, 2),
            fetchSchedule(year - 1, 3)
        ]);
        events = mergeEvents(events, prevRegular, prevPost);
    }

    // Scoreboard is the most current for live games — merge it last so it wins.
    events = mergeEvents(events, board);

    const headline = pickHeadlineEvent(events);
    if (!headline) {
        throw new Error('No Lions games found');
    }

    return toLiveData(headline);
}

async function getGameById(gameId) {
    try {
        const data = await fetchJson(`${SITE_API}/summary?event=${gameId}`);
        const header = data.header || data;
        const event = header.competitions
            ? { id: gameId, name: header.gameNote || header.name, date: header.competitions[0]?.date, competitions: header.competitions, seasonType: header.season?.type }
            : data;
        if (event?.competitions) {
            return toLiveData({ ...event, id: gameId, name: event.name || data.header?.gameNote });
        }
    } catch (error) {
        console.log('Summary fetch failed, falling back to headline:', error.message);
    }
    return getHeadlineGame();
}
