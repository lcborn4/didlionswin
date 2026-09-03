export type LiveLead = "winning" | "losing" | "tied";

export type LiveData = {
  gameId?: string;
  name?: string;
  date?: string;
  opponent?: string;
  result?: string;
  lead?: LiveLead | null;
  isLive?: boolean;
  status?: string;
  seasonType?: string;
  timestamp?: string;
  score?: { lions?: number; opponent?: number };
};

const LIONS_ID = "8";
const SITE_API =
  "https://site.api.espn.com/apis/site/v2/sports/football/nfl";

function getCurrentSeasonYear() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());
  const year = parseInt(parts.find((p) => p.type === "year")?.value || "0", 10);
  const month = parseInt(parts.find((p) => p.type === "month")?.value || "0", 10);
  return month <= 2 ? year - 1 : year;
}

async function fetchJson(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`ESPN ${response.status}`);
  return response.json();
}

async function fetchSchedule(season: number, seasontype: number) {
  try {
    const data = await fetchJson(
      `${SITE_API}/teams/${LIONS_ID}/schedule?season=${season}&seasontype=${seasontype}`
    );
    return data.events || [];
  } catch {
    return [];
  }
}

async function fetchScoreboard() {
  try {
    const data = await fetchJson(`${SITE_API}/scoreboard`);
    return (data.events || []).filter((event: any) =>
      (event.competitions?.[0]?.competitors || []).some(
        (c: any) => String(c.id) === LIONS_ID
      )
    );
  } catch {
    return [];
  }
}

function mergeEvents(...lists: any[][]) {
  const byId = new Map<string, any>();
  for (const list of lists) {
    for (const event of list) {
      if (event?.id) byId.set(String(event.id), event);
    }
  }
  return Array.from(byId.values());
}

function getCompetition(event: any) {
  return event?.competitions?.[0] || null;
}

function getStatusName(event: any) {
  const type = getCompetition(event)?.status?.type;
  return type?.name || type?.state || "UNKNOWN";
}

function isLiveStatus(statusName: string) {
  return (
    statusName === "STATUS_IN_PROGRESS" ||
    statusName === "STATUS_HALFTIME" ||
    statusName === "STATUS_END_PERIOD" ||
    statusName === "STATUS_END_OF_PERIOD" ||
    statusName === "STATUS_DELAYED"
  );
}

function isFinalStatus(statusName: string, event: any) {
  const type = getCompetition(event)?.status?.type;
  return (
    statusName === "STATUS_FINAL" ||
    statusName === "STATUS_FINAL_OVERTIME" ||
    type?.completed === true ||
    type?.state === "post"
  );
}

function parseScore(score: any) {
  if (score == null) return 0;
  if (typeof score === "number") return score;
  if (typeof score === "string") return Number(score) || 0;
  return Number(score.value ?? score.displayValue ?? 0) || 0;
}

function seasonTypeLabel(event: any) {
  const raw = event?.seasonType;
  const type = typeof raw === "object" ? raw?.type ?? raw?.id : raw;
  if (type === 1 || type === "1") return "preseason";
  if (type === 3 || type === "3") return "postseason";
  return "regular";
}

function toLiveData(event: any): LiveData {
  const competition = getCompetition(event);
  const competitors = competition?.competitors || [];
  const statusName = getStatusName(event);
  const live = isLiveStatus(statusName);

  let lionsScore = 0;
  let opponentScore = 0;
  let opponentName = "Unknown";
  let lionsWinner: boolean | undefined;

  for (const competitor of competitors) {
    const team = competitor.team || {};
    const score = parseScore(competitor.score);
    if (String(competitor.id) === LIONS_ID) {
      lionsScore = score;
      lionsWinner = competitor.winner;
    } else {
      opponentScore = score;
      opponentName =
        team.displayName || team.name || team.abbreviation || "Opponent";
    }
  }

  let result = "";
  let lead: LiveLead | null = null;

  if (live) {
    result = "In Progress";
    if (lionsScore > opponentScore) lead = "winning";
    else if (lionsScore < opponentScore) lead = "losing";
    else lead = "tied";
  } else if (statusName === "STATUS_SCHEDULED") {
    result = "";
  } else if (lionsWinner === true) {
    result = "WIN";
  } else if (lionsWinner === false && lionsScore === opponentScore) {
    result = "TIE";
  } else if (lionsWinner === false) {
    result = "LOSS";
  } else if (lionsScore > opponentScore) {
    result = "WIN";
  } else if (lionsScore < opponentScore) {
    result = "LOSS";
  } else if (isFinalStatus(statusName, event)) {
    result = "TIE";
  }

  return {
    gameId: String(event.id),
    name: event.name || "Unknown Game",
    date: event.date,
    status: statusName,
    result,
    lead,
    score: { lions: lionsScore, opponent: opponentScore },
    opponent: opponentName,
    isLive: live,
    seasonType: seasonTypeLabel(event),
    timestamp: new Date().toISOString(),
  };
}

function pickHeadlineEvent(events: any[]) {
  let live: any = null;
  let latestFinal: any = null;
  let nextScheduled: any = null;
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
      (statusName !== "STATUS_SCHEDULED" && Number.isFinite(time) && time < now);

    if (completed && statusName !== "STATUS_SCHEDULED") {
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

export async function fetchLionsAnswer(): Promise<LiveData> {
  const year = getCurrentSeasonYear();
  const [pre, regular, post, board] = await Promise.all([
    fetchSchedule(year, 1),
    fetchSchedule(year, 2),
    fetchSchedule(year, 3),
    fetchScoreboard(),
  ]);

  let events = mergeEvents(pre, regular, post, board);
  const hasFinal = events.some((event) =>
    isFinalStatus(getStatusName(event), event)
  );

  if (!hasFinal) {
    const [prevRegular, prevPost] = await Promise.all([
      fetchSchedule(year - 1, 2),
      fetchSchedule(year - 1, 3),
    ]);
    events = mergeEvents(events, prevRegular, prevPost);
  }

  events = mergeEvents(events, board);

  const headline = pickHeadlineEvent(events);
  if (!headline) throw new Error("No Lions games found");
  return toLiveData(headline);
}

export function getLead(data: LiveData): LiveLead {
  if (data.lead === "winning" || data.lead === "losing" || data.lead === "tied") {
    return data.lead;
  }
  const lions = data.score?.lions ?? 0;
  const opponent = data.score?.opponent ?? 0;
  if (lions > opponent) return "winning";
  if (lions < opponent) return "losing";
  return "tied";
}
