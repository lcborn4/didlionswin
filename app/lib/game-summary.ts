export type LinescoreRow = {
  abbrev: string;
  name: string;
  isLions: boolean;
  quarters: string[];
  total: string;
};

export type TeamStatRow = {
  label: string;
  lions: string;
  opponent: string;
};

export type PlayerRow = {
  name: string;
  stats: string[];
};

export type PlayerGroup = {
  title: string;
  labels: string[];
  teams: {
    name: string;
    isLions: boolean;
    rows: PlayerRow[];
  }[];
};

export type ScoringPlay = {
  id: string;
  when: string;
  teamAbbrev: string;
  isLions: boolean;
  kind: string;
  text: string;
  score: string;
};

export type FlowPoint = {
  t: number;
  lions: number;
  opponent: number;
};

export type FlowQuarter = {
  label: string;
  start: number;
  end: number;
};

export type ScoreFlow = {
  points: FlowPoint[];
  quarters: FlowQuarter[];
  maxT: number;
};

export type GameSummary = {
  gameId: string;
  available: boolean;
  message?: string;
  title: string;
  detail: string;
  week: number | null;
  venue: string;
  lionsAbbrev: string;
  opponentAbbrev: string;
  periodLabels: string[];
  linescore: LinescoreRow[];
  teamStats: TeamStatRow[];
  playerGroups: PlayerGroup[];
  scoringPlays: ScoringPlay[];
  flow: ScoreFlow | null;
};

const LIONS_ID = "8";
const SUMMARY_URL =
  "https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=";

const TEAM_STATS: { key: string; label: string; optional?: boolean }[] = [
  { key: "totalYards", label: "Total yards" },
  { key: "netPassingYards", label: "Net passing" },
  { key: "rushingYards", label: "Rushing" },
  { key: "firstDowns", label: "First downs" },
  { key: "thirdDownEff", label: "Third down" },
  { key: "fourthDownEff", label: "Fourth down" },
  { key: "redZoneAttempts", label: "Red zone" },
  { key: "turnovers", label: "Turnovers" },
  { key: "sacksYardsLost", label: "Sacks allowed" },
  { key: "totalPenaltiesYards", label: "Penalties" },
  { key: "possessionTime", label: "Possession" },
  { key: "defensiveTouchdowns", label: "Defensive TDs", optional: true },
];

const PLAYER_GROUPS: { name: string; title: string; drop: string[] }[] = [
  { name: "passing", title: "Passing", drop: ["QBR"] },
  { name: "rushing", title: "Rushing", drop: [] },
  { name: "receiving", title: "Receiving", drop: [] },
  { name: "kicking", title: "Kicking", drop: ["PCT"] },
];

export async function fetchGameSummary(gameId: string): Promise<GameSummary> {
  const response = await fetch(`${SUMMARY_URL}${encodeURIComponent(gameId)}`);
  if (!response.ok) throw new Error(`ESPN summary ${response.status}`);
  return parseGameSummary(await response.json(), gameId);
}

export function parseGameSummary(data: any, gameId: string): GameSummary {
  const competition = data?.header?.competitions?.[0] || {};
  const statusType = competition?.status?.type || {};
  const sides = (competition?.competitors || []).map(readSide);
  const lions = sides.find((side: Side) => side.isLions) || null;
  const opponent = sides.find((side: Side) => !side.isLions) || null;
  const title = buildTitle(lions, opponent, data);
  const detail = statusType.shortDetail || statusType.description || "";
  const week = weekNumber(data?.header?.week);
  const venue = data?.gameInfo?.venue?.fullName || "";
  const base = {
    gameId,
    title,
    detail,
    week,
    venue,
    lionsAbbrev: lions?.abbrev || "DET",
    opponentAbbrev: opponent?.abbrev || "OPP",
    periodLabels: [] as string[],
    linescore: [] as LinescoreRow[],
    teamStats: [] as TeamStatRow[],
    playerGroups: [] as PlayerGroup[],
    scoringPlays: [] as ScoringPlay[],
    flow: null as ScoreFlow | null,
  };

  const notStarted =
    statusType.state === "pre" || statusType.name === "STATUS_SCHEDULED";
  if (notStarted || !lions || !opponent) {
    return {
      ...base,
      available: false,
      message: "The box score will show up after kickoff.",
    };
  }

  const periodCount = Math.max(
    lions.quarters.length,
    opponent.quarters.length,
    0
  );
  const periodLabels = Array.from({ length: periodCount }, (_, index) =>
    periodLabel(index + 1)
  );
  const linescore = [lions, opponent].map((side) => ({
    abbrev: side.abbrev,
    name: side.name,
    isLions: side.isLions,
    quarters: Array.from({ length: periodCount }, (_, index) => side.quarters[index] || "–"),
    total: side.total,
  }));

  const lionsHome = lions.homeAway === "home";
  const teamStats = readTeamStats(data?.boxscore?.teams);
  const playerGroups = readPlayerGroups(data?.boxscore?.players);
  const scoringPlays = readScoringPlays(data?.scoringPlays, lionsHome);
  const regClock = Number(data?.format?.regulation?.clock) || 900;
  const otClock = Number(data?.format?.overtime?.clock) || 600;
  const flow = buildFlow(collectPlays(data), lionsHome, regClock, otClock);

  return {
    ...base,
    available: true,
    periodLabels,
    linescore,
    teamStats,
    playerGroups,
    scoringPlays,
    flow,
  };
}

type Side = {
  isLions: boolean;
  abbrev: string;
  name: string;
  homeAway: "home" | "away";
  quarters: string[];
  total: string;
};

function readSide(competitor: any): Side {
  const id = String(competitor?.id ?? competitor?.team?.id ?? "");
  const isLions = id === LIONS_ID;
  return {
    isLions,
    abbrev: competitor?.team?.abbreviation || (isLions ? "DET" : "OPP"),
    name:
      competitor?.team?.shortDisplayName ||
      competitor?.team?.displayName ||
      competitor?.team?.name ||
      "Team",
    homeAway: competitor?.homeAway === "home" ? "home" : "away",
    quarters: (competitor?.linescores || []).map((line: any) =>
      String(line?.displayValue ?? "")
    ),
    total: displayScore(competitor?.score),
  };
}

function buildTitle(lions: Side | null, opponent: Side | null, data: any) {
  if (lions && opponent) {
    const place = lions.homeAway === "home" ? "vs" : "at";
    return `${lions.name} ${place} ${opponent.name}`;
  }
  return data?.header?.gameNote || "Lions game";
}

function weekNumber(week: any): number | null {
  if (typeof week === "number") return week;
  if (typeof week?.number === "number") return week.number;
  return null;
}

function displayScore(score: any): string {
  if (score == null) return "0";
  if (typeof score === "object") return String(score.displayValue ?? score.value ?? "0");
  return String(score);
}

function periodLabel(period: number) {
  if (period <= 4) return `Q${period}`;
  if (period === 5) return "OT";
  return `OT${period - 4}`;
}

function readTeamStats(teams: any[] | undefined): TeamStatRow[] {
  let lionsStats: Map<string, string> | undefined;
  let opponentStats: Map<string, string> | undefined;
  for (const team of teams || []) {
    const stats = new Map<string, string>();
    for (const stat of team?.statistics || []) {
      if (stat?.name) stats.set(stat.name, String(stat.displayValue ?? ""));
    }
    if (String(team?.team?.id ?? "") === LIONS_ID) lionsStats = stats;
    else opponentStats = stats;
  }
  if (!lionsStats || !opponentStats) return [];

  return TEAM_STATS.flatMap((stat) => {
    const lions = lionsStats!.get(stat.key);
    const opponent = opponentStats!.get(stat.key);
    if (lions == null || opponent == null) return [];
    if (stat.optional && isZero(lions) && isZero(opponent)) return [];
    return [{ label: stat.label, lions, opponent }];
  });
}

function isZero(value: string) {
  return value === "0" || value === "0-0" || value === "0.0";
}

function readPlayerGroups(players: any[] | undefined): PlayerGroup[] {
  const sides = [...(players || [])].sort((a, b) => {
    const aLions = String(a?.team?.id) === LIONS_ID ? 0 : 1;
    const bLions = String(b?.team?.id) === LIONS_ID ? 0 : 1;
    return aLions - bLions;
  });

  return PLAYER_GROUPS.flatMap((group) => {
    let labels: string[] | null = null;
    const teams = sides.flatMap((side) => {
      const table = (side?.statistics || []).find((item: any) => item?.name === group.name);
      if (!table) return [];
      const sourceLabels: string[] = table.labels || [];
      const keep = sourceLabels
        .map((label, index) => ({ label, index }))
        .filter((column) => !group.drop.includes(column.label));
      if (!labels) labels = keep.map((column) => column.label);
      const rows = (table.athletes || []).map((athlete: any) => ({
        name: athlete?.athlete?.displayName || "Unknown",
        stats: keep.map((column) => String(athlete?.stats?.[column.index] ?? "")),
      }));
      if (!rows.length) return [];
      return [
        {
          name:
            side?.team?.shortDisplayName ||
            side?.team?.name ||
            side?.team?.abbreviation ||
            "Team",
          isLions: String(side?.team?.id) === LIONS_ID,
          rows,
        },
      ];
    });
    if (!labels || !teams.length) return [];
    return [{ title: group.title, labels, teams }];
  });
}

function readScoringPlays(plays: any[] | undefined, lionsHome: boolean): ScoringPlay[] {
  return (plays || []).map((play, index) => {
    const home = numberValue(play?.homeScore);
    const away = numberValue(play?.awayScore);
    const lions = lionsHome ? home : away;
    const opponent = lionsHome ? away : home;
    const period = Number(play?.period?.number ?? play?.period ?? 0);
    const clock = play?.clock?.displayValue || "";
    const teamId = String(play?.team?.id ?? "");
    const kind = String(play?.scoringType?.abbreviation || "")
      .toUpperCase()
      .slice(0, 4);
    return {
      id: String(play?.id ?? index),
      when: `${period ? periodLabel(period) : ""}${clock ? ` ${clock}` : ""}`.trim(),
      teamAbbrev: play?.team?.abbreviation || (teamId === LIONS_ID ? "DET" : ""),
      isLions: teamId === LIONS_ID,
      kind,
      text: cleanPlayText(play?.text || ""),
      score: `${lions} – ${opponent}`,
    };
  });
}

function cleanPlayText(text: string) {
  return text.replace(/^\([^)]*\)\s*/, "").replace(/\s+/g, " ").trim();
}

function collectPlays(data: any): any[] {
  const drives = data?.drives;
  const buckets: any[] = [];
  if (Array.isArray(drives)) buckets.push(...drives);
  else if (drives && typeof drives === "object") {
    if (Array.isArray(drives.previous)) buckets.push(...drives.previous);
    if (drives.current) buckets.push(drives.current);
  }
  const plays: any[] = [];
  for (const drive of buckets) {
    if (Array.isArray(drive?.plays)) plays.push(...drive.plays);
  }
  plays.sort(
    (a, b) => numberValue(a?.sequenceNumber) - numberValue(b?.sequenceNumber)
  );
  return plays;
}

function buildFlow(
  plays: any[],
  lionsHome: boolean,
  regClock: number,
  otClock: number
): ScoreFlow | null {
  const raw: FlowPoint[] = [];
  let maxPeriod = 0;
  for (const play of plays) {
    const period = Number(play?.period?.number ?? 0);
    if (!period) continue;
    const remaining = clockRemaining(play?.clock);
    if (remaining == null) continue;
    maxPeriod = Math.max(maxPeriod, period);
    const length = period <= 4 ? regClock : otClock;
    const elapsed = Math.min(length, Math.max(0, length - remaining));
    const home = numberValue(play?.homeScore);
    const away = numberValue(play?.awayScore);
    raw.push({
      t: periodStart(period, regClock, otClock) + elapsed,
      lions: lionsHome ? home : away,
      opponent: lionsHome ? away : home,
    });
  }
  if (raw.length < 2 || maxPeriod < 1) return null;

  raw.sort((a, b) => a.t - b.t);
  const points: FlowPoint[] = [{ t: 0, lions: 0, opponent: 0 }];
  for (const point of raw) {
    const last = points[points.length - 1];
    if (point.t === last.t) {
      points[points.length - 1] = point;
      continue;
    }
    if (point.lions !== last.lions || point.opponent !== last.opponent) {
      points.push(point);
    }
  }
  const end = raw[raw.length - 1];
  const last = points[points.length - 1];
  if (end.t > last.t) {
    points.push({ t: end.t, lions: last.lions, opponent: last.opponent });
  }

  const maxT = Math.max(end.t, 1);
  const quarters: FlowQuarter[] = [];
  for (let period = 1; period <= maxPeriod; period++) {
    const start = periodStart(period, regClock, otClock);
    if (start > maxT) break;
    const length = period <= 4 ? regClock : otClock;
    quarters.push({
      label: periodLabel(period),
      start,
      end: Math.min(start + length, maxT),
    });
  }
  if (quarters.length) {
    quarters[quarters.length - 1].end = Math.max(quarters[quarters.length - 1].end, maxT);
  }

  return { points, quarters, maxT };
}

function periodStart(period: number, regClock: number, otClock: number) {
  let t = 0;
  for (let current = 1; current < period; current++) {
    t += current <= 4 ? regClock : otClock;
  }
  return t;
}

function clockRemaining(clock: any): number | null {
  if (typeof clock?.value === "number") return clock.value;
  const display = typeof clock === "string" ? clock : clock?.displayValue;
  if (typeof display === "string" && display.includes(":")) {
    const [minutes, seconds] = display.split(":").map(Number);
    if (Number.isFinite(minutes) && Number.isFinite(seconds)) {
      return minutes * 60 + seconds;
    }
  }
  return null;
}

function numberValue(value: any) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
