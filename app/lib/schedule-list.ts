export type ScheduleGame = {
  id: string;
  seasonType: "preseason" | "regular" | "postseason";
  weekLabel: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  opponent: string;
  place: "vs" | "at";
  status: "final" | "live" | "scheduled";
  result: "WIN" | "LOSS" | "TIE" | "";
  lionsScore: number | null;
  opponentScore: number | null;
};

export type ScheduleRow =
  | { kind: "game"; game: ScheduleGame }
  | { kind: "bye" };

export type ScheduleGroup = {
  label: string;
  record: string | null;
  rows: ScheduleRow[];
};

export type SeasonSchedule = {
  games: ScheduleGame[];
  groups: ScheduleGroup[];
};

const LIONS_ID = "8";
const SITE_API = "https://site.api.espn.com/apis/site/v2/sports/football/nfl";

export async function fetchSeasonSchedule(): Promise<SeasonSchedule> {
  const year = getCurrentSeasonYear();
  const [pre, regular, post, board] = await Promise.all([
    fetchSchedule(year, 1),
    fetchSchedule(year, 2),
    fetchSchedule(year, 3),
    fetchScoreboard(),
  ]);

  const byId = new Map<string, any>();
  for (const event of [...pre.events, ...regular.events, ...post.events]) {
    if (event?.id) byId.set(String(event.id), event);
  }
  for (const event of board) {
    if (!event?.id) continue;
    const id = String(event.id);
    const existing = byId.get(id);
    byId.set(id, existing ? overlayScoreboard(existing, event) : event);
  }

  const games = Array.from(byId.values())
    .map(toScheduleGame)
    .filter((game): game is ScheduleGame => game != null);

  return {
    games,
    groups: groupSchedule(games, regular.byeWeek),
  };
}

function getCurrentSeasonYear() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());
  const year = parseInt(parts.find((part) => part.type === "year")?.value || "0", 10);
  const month = parseInt(parts.find((part) => part.type === "month")?.value || "0", 10);
  return month <= 2 ? year - 1 : year;
}

async function fetchSchedule(season: number, seasontype: number) {
  try {
    const response = await fetch(
      `${SITE_API}/teams/${LIONS_ID}/schedule?season=${season}&seasontype=${seasontype}`
    );
    if (!response.ok) return { events: [] as any[], byeWeek: null as number | null };
    const data = await response.json();
    const bye = Number(data?.byeWeek);
    return {
      events: data?.events || [],
      byeWeek: Number.isFinite(bye) && bye > 0 ? bye : null,
    };
  } catch {
    return { events: [] as any[], byeWeek: null as number | null };
  }
}

function overlayScoreboard(scheduleEvent: any, boardEvent: any) {
  const competition = boardEvent?.competitions?.[0];
  if (!competition) return scheduleEvent;
  const existing = scheduleEvent?.competitions?.[0] || {};
  return {
    ...scheduleEvent,
    name: scheduleEvent.name || boardEvent.name,
    date: scheduleEvent.date || boardEvent.date,
    competitions: [
      {
        ...existing,
        status: competition.status || existing.status,
        competitors: competition.competitors?.length
          ? competition.competitors
          : existing.competitors,
      },
    ],
  };
}

async function fetchScoreboard() {
  try {
    const response = await fetch(`${SITE_API}/scoreboard`);
    if (!response.ok) return [];
    const data = await response.json();
    return (data?.events || []).filter((event: any) =>
      (event?.competitions?.[0]?.competitors || []).some(
        (competitor: any) => String(competitor?.id) === LIONS_ID
      )
    );
  } catch {
    return [];
  }
}

function toScheduleGame(event: any): ScheduleGame | null {
  const competition = event?.competitions?.[0];
  const competitors = competition?.competitors || [];
  const lions = competitors.find((competitor: any) => String(competitor?.id) === LIONS_ID);
  const opponent = competitors.find((competitor: any) => String(competitor?.id) !== LIONS_ID);
  if (!lions || !opponent || !event?.id) return null;

  const seasonType = seasonTypeLabel(event);
  const statusName = competition?.status?.type?.name || competition?.status?.type?.state || "";
  const status = gameStatus(statusName, competition?.status?.type);
  const lionsScore = status === "scheduled" ? null : scoreNumber(lions.score);
  const opponentScore = status === "scheduled" ? null : scoreNumber(opponent.score);
  const kickoffKnown = event.timeValid !== false && competition?.status?.type?.shortDetail !== "TBD";

  return {
    id: String(event.id),
    seasonType,
    weekLabel: weekLabel(event, seasonType),
    title: `Lions ${lions.homeAway === "away" ? "at" : "vs"} ${teamName(opponent)}`,
    dateLabel: formatDateLabel(event.date),
    timeLabel: status === "scheduled" ? (kickoffKnown ? formatTimeLabel(event.date) : "TBD") : "",
    opponent: teamName(opponent),
    place: lions.homeAway === "away" ? "at" : "vs",
    status,
    result: resultFor(status, lions, lionsScore, opponentScore),
    lionsScore,
    opponentScore,
  };
}

function seasonTypeLabel(event: any): ScheduleGame["seasonType"] {
  const raw = event?.seasonType?.type ?? event?.seasonType;
  if (raw === 1 || raw === "1") return "preseason";
  if (raw === 3 || raw === "3") return "postseason";
  return "regular";
}

function gameStatus(statusName: string, type: any): ScheduleGame["status"] {
  if (
    statusName === "STATUS_IN_PROGRESS" ||
    statusName === "STATUS_HALFTIME" ||
    statusName === "STATUS_END_PERIOD" ||
    statusName === "STATUS_END_OF_PERIOD" ||
    statusName === "STATUS_DELAYED" ||
    type?.state === "in"
  ) {
    return "live";
  }
  if (statusName === "STATUS_SCHEDULED" || type?.state === "pre") return "scheduled";
  return "final";
}

function resultFor(
  status: ScheduleGame["status"],
  lions: any,
  lionsScore: number | null,
  opponentScore: number | null
): ScheduleGame["result"] {
  if (status !== "final") return "";
  if (lions?.winner === true) return "WIN";
  if (lions?.winner === false && lionsScore != null && lionsScore === opponentScore) return "TIE";
  if (lions?.winner === false) return "LOSS";
  if (lionsScore == null || opponentScore == null) return "";
  if (lionsScore > opponentScore) return "WIN";
  if (lionsScore < opponentScore) return "LOSS";
  return "TIE";
}

function weekLabel(event: any, seasonType: ScheduleGame["seasonType"]) {
  const week = event?.week;
  const number = typeof week === "number" ? week : week?.number;
  const text = typeof week?.text === "string" ? week.text : "";
  const fromText = text.match(/(\d+)/)?.[1];
  if (seasonType === "preseason") return `P${fromText || number || ""}`;
  if (seasonType === "postseason") {
    return text && !/^week/i.test(text) ? text : `R${number || ""}`;
  }
  return String(number || "");
}

function teamName(competitor: any) {
  const team = competitor?.team || {};
  return team.shortDisplayName || team.name || team.abbreviation || "Opponent";
}

function scoreNumber(score: any): number | null {
  if (score == null) return null;
  const value =
    typeof score === "object" ? score.displayValue ?? score.value : score;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDateLabel(iso?: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  });
}

function formatTimeLabel(iso?: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
}

function groupSchedule(games: ScheduleGame[], byeWeek: number | null): ScheduleGroup[] {
  const order = { preseason: 0, regular: 1, postseason: 2 };
  const sorted = [...games].sort((a, b) => {
    if (order[a.seasonType] !== order[b.seasonType]) {
      return order[a.seasonType] - order[b.seasonType];
    }
    return weekSort(a.weekLabel) - weekSort(b.weekLabel);
  });

  const labels = {
    preseason: "Preseason",
    regular: "Regular season",
    postseason: "Playoffs",
  } as const;

  const groups: ScheduleGroup[] = [];
  for (const seasonType of ["regular", "postseason", "preseason"] as const) {
    const seasonGames = sorted.filter((game) => game.seasonType === seasonType);
    if (!seasonGames.length && !(seasonType === "regular" && byeWeek)) continue;
    const rows: ScheduleRow[] = seasonGames.map((game) => ({ kind: "game", game }));
    if (seasonType === "regular" && byeWeek) {
      const insertAt = rows.findIndex(
        (row) => row.kind === "game" && weekSort(row.game.weekLabel) > byeWeek
      );
      rows.splice(insertAt === -1 ? rows.length : insertAt, 0, { kind: "bye" });
    }
    groups.push({
      label: labels[seasonType],
      record: seasonType === "regular" ? regularRecord(seasonGames) : null,
      rows,
    });
  }
  return groups;
}

function weekSort(label: string) {
  const match = label.match(/(\d+)/);
  return match ? Number(match[1]) : 99;
}

function regularRecord(games: ScheduleGame[]) {
  let wins = 0;
  let losses = 0;
  let ties = 0;
  for (const game of games) {
    if (game.result === "WIN") wins += 1;
    else if (game.result === "LOSS") losses += 1;
    else if (game.result === "TIE") ties += 1;
  }
  if (!wins && !losses && !ties) return null;
  return ties ? `${wins}–${losses}–${ties}` : `${wins}–${losses}`;
}
