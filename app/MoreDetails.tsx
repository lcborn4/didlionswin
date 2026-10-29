"use client";

import { useEffect, useState } from "react";
import styles from "@/styles/Home.module.css";
import type { LiveData } from "./lib/lions-answer";
import {
  fetchGameSummary,
  type FlowPoint,
  type FlowQuarter,
  type GameSummary,
  type PlayerGroup,
} from "./lib/game-summary";
import {
  fetchSeasonSchedule,
  type ScheduleGame,
  type SeasonSchedule,
} from "./lib/schedule-list";

export default function MoreDetails({
  liveData,
  onGameChange,
}: {
  liveData: LiveData | null;
  onGameChange: (game: ScheduleGame | null) => void;
}) {
  const [schedule, setSchedule] = useState<SeasonSchedule | null>(null);
  const [scheduleError, setScheduleError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [summary, setSummary] = useState<GameSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const onCurrent = !selectedId || selectedId === liveData?.gameId;
  const activeId = selectedId ?? liveData?.gameId ?? null;
  const activeGame = schedule?.games.find((game) => game.id === activeId) ?? null;
  const scheduled = activeGame
    ? activeGame.status === "scheduled"
    : liveData?.status === "STATUS_SCHEDULED";
  const activeIsLive = activeGame ? activeGame.status === "live" : Boolean(liveData?.isLive);
  const headlineScore =
    !selectedId || selectedId === liveData?.gameId
      ? `${liveData?.score?.lions ?? ""}-${liveData?.score?.opponent ?? ""}`
      : "";

  useEffect(() => {
    let cancelled = false;
    fetchSeasonSchedule()
      .then((next) => {
        if (!cancelled) setSchedule(next);
      })
      .catch(() => {
        if (!cancelled) setScheduleError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeId || scheduled) {
      setSummary(null);
      setLoading(false);
      setError(false);
      return;
    }

    let cancelled = false;
    setSummary((current) => (current?.gameId === activeId ? current : null));
    setLoading(true);
    setError(false);

    async function load(id: string) {
      try {
        const next = await fetchGameSummary(id);
        if (cancelled) return;
        setSummary(next);
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load(activeId);
    const timer = activeIsLive ? setInterval(() => load(activeId), 30000) : null;

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [activeId, scheduled, activeIsLive, headlineScore]);

  function showGame(game: ScheduleGame | null) {
    if (!game || game.id === liveData?.gameId) {
      setSelectedId(null);
      onGameChange(null);
    } else {
      setSelectedId(game.id);
      onGameChange(game);
    }
    setScheduleOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function chooseGame(id: string) {
    showGame(schedule?.games.find((game) => game.id === id) ?? null);
  }

  useEffect(() => {
    if (!scheduleOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setScheduleOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [scheduleOpen]);

  return (
    <div className={styles.morePanel} id="game-details">
      <div className={styles.scheduleMenu}>
        {!onCurrent && (
          <button type="button" className={styles.scheduleToggle} onClick={() => showGame(null)}>
            Current
          </button>
        )}
        <div className={styles.scheduleLink}>
          {schedule && (
            <span className={styles.scheduleSeason}>
              {schedule.year}
              {schedule.record ? ` (${schedule.record})` : ""}
            </span>
          )}
          <button
            type="button"
            className={styles.scheduleToggle}
            aria-expanded={scheduleOpen}
            aria-controls="season-schedule"
            onClick={() => setScheduleOpen((open) => !open)}
          >
            Schedule
          </button>
        </div>
        {scheduleOpen && (
          <div className={styles.schedulePanel} id="season-schedule">
            <SeasonList
              schedule={schedule}
              error={scheduleError}
              activeId={activeId}
              onSelect={chooseGame}
            />
          </div>
        )}
      </div>
      {scheduleOpen && (
        <button
          type="button"
          className={styles.scheduleBackdrop}
          aria-label="Close schedule"
          onClick={() => setScheduleOpen(false)}
        />
      )}
      <div className={styles.boxScore}>
        <div>
          <GameHeading liveData={liveData} summary={summary} game={activeGame} />
          {scheduled && (
            <p className={styles.boxNote}>The box score will show up after kickoff.</p>
          )}
          {!scheduled && loading && !summary && (
            <p className={styles.boxNote}>Loading box score…</p>
          )}
          {!scheduled && !loading && (error || !activeId) && !summary && (
            <p className={styles.boxNote}>Couldn’t load the box score.</p>
          )}
          {summary && !summary.available && summary.gameId === activeId && (
            <p className={styles.boxNote}>{summary.message}</p>
          )}
          {summary?.available && summary.gameId === activeId && <BoxScore summary={summary} />}
        </div>
      </div>
    </div>
  );
}

function GameHeading({
  liveData,
  summary,
  game,
}: {
  liveData: LiveData | null;
  summary: GameSummary | null;
  game: ScheduleGame | null;
}) {
  const title = summary?.title || game?.title || liveData?.name || "Game details";
  const seasonType = game?.seasonType || liveData?.seasonType;
  const bits: string[] = [];
  if (seasonType === "preseason") bits.push("Preseason");
  if (seasonType === "postseason") bits.push("Playoffs");
  if (summary?.week) bits.push(`Week ${summary.week}`);
  else if (game?.seasonType === "regular" && game.weekLabel) bits.push(`Week ${game.weekLabel}`);
  if (summary?.detail) bits.push(summary.detail);
  else if (game?.status === "scheduled" && game.timeLabel) bits.push(game.timeLabel);
  else if (liveData?.date) bits.push(formatDate(liveData.date));

  return (
    <header className={styles.boxHeader}>
      {bits.length > 0 && <p className={styles.boxKicker}>{bits.join(" · ")}</p>}
      <h2 className={styles.boxTitle}>{title}</h2>
      {summary?.venue && <p className={styles.boxVenue}>{summary.venue}</p>}
    </header>
  );
}

function SeasonList({
  schedule,
  error,
  activeId,
  onSelect,
}: {
  schedule: SeasonSchedule | null;
  error: boolean;
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <section className={styles.schedule} aria-label="Lions schedule">
      {!schedule && !error && <p className={styles.boxNote}>Loading schedule…</p>}
      {error && <p className={styles.boxNote}>Couldn’t load the schedule.</p>}
      {schedule?.groups.map((group) => (
        <div key={group.label}>
          <div className={styles.scheduleGroup}>
            <h4 className={styles.scheduleGroupLabel}>{group.label}</h4>
          </div>
          <div className={styles.scheduleList}>
            {group.rows.map((row) =>
              row.kind === "bye" ? (
                <div key={`${group.label}-bye`} className={styles.scheduleBye}>
                  Bye
                </div>
              ) : (
                <button
                  key={row.game.id}
                  type="button"
                  className={styles.scheduleRow}
                  aria-current={row.game.id === activeId ? "true" : undefined}
                  onClick={() => onSelect(row.game.id)}
                >
                  <span className={styles.scheduleWeek}>{row.game.weekLabel}</span>
                  <span className={styles.scheduleDate}>{row.game.dateLabel}</span>
                  <span className={styles.scheduleOpp}>
                    {row.game.place} {row.game.opponent}
                  </span>
                  <ScheduleResult game={row.game} />
                </button>
              )
            )}
          </div>
        </div>
      ))}
    </section>
  );
}

function ScheduleResult({ game }: { game: ScheduleGame }) {
  const score =
    game.lionsScore != null && game.opponentScore != null
      ? `${game.lionsScore}–${game.opponentScore}`
      : "";
  if (game.status === "live") {
    return <span className={styles.scheduleLive}>Live {score}</span>;
  }
  if (game.status === "scheduled") {
    return <span className={styles.scheduleTime}>{game.timeLabel}</span>;
  }
  const mark = game.result === "WIN" ? "W" : game.result === "LOSS" ? "L" : "T";
  const tone =
    game.result === "WIN"
      ? styles.scheduleWin
      : game.result === "LOSS"
        ? styles.scheduleLoss
        : styles.scheduleTime;
  return (
    <span className={tone}>
      {mark} {score}
    </span>
  );
}

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function BoxScore({ summary }: { summary: GameSummary }) {
  return (
    <>
      {summary.linescore.length > 0 && (
        <table className={styles.linescore}>
          <caption className={styles.srOnly}>Score by quarter</caption>
          <thead>
            <tr>
              <th scope="col" />
              {summary.periodLabels.map((label) => (
                <th key={label} scope="col">
                  {label.replace("Q", "")}
                </th>
              ))}
              <th scope="col">T</th>
            </tr>
          </thead>
          <tbody>
            {summary.linescore.map((row) => (
              <tr key={row.abbrev}>
                <th scope="row" className={row.isLions ? styles.lionsName : undefined}>
                  {row.abbrev}
                </th>
                {row.quarters.map((quarter, index) => (
                  <td key={`${row.abbrev}-${index}`}>{quarter}</td>
                ))}
                <td className={row.isLions ? styles.lionsTotal : styles.totalCell}>
                  {row.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {(summary.flow || summary.scoringPlays.length > 0) && (
        <>
          <h3 className={styles.sectionLabel}>Game flow</h3>
          {summary.flow && (
            <ScoreFlowChart
              points={summary.flow.points}
              quarters={summary.flow.quarters}
              maxT={summary.flow.maxT}
              lionsAbbrev={summary.lionsAbbrev}
              opponentAbbrev={summary.opponentAbbrev}
            />
          )}
          {summary.scoringPlays.length > 0 && (
            <ol className={styles.scoringList}>
              {summary.scoringPlays.map((play) => (
                <li key={play.id} className={styles.scorePlay}>
                  <span className={styles.scoreWhen}>{play.when}</span>
                  <span className={play.isLions ? styles.lionsName : styles.scoreTeam}>
                    {play.teamAbbrev}
                    {play.kind ? ` ${play.kind}` : ""}
                  </span>
                  <span className={styles.scoreText}>{play.text}</span>
                  <span className={styles.scoreNow}>{play.score}</span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}

      {summary.teamStats.length > 0 && (
        <>
          <h3 className={styles.sectionLabel}>Team stats</h3>
          <div className={styles.statTable}>
            <div className={styles.statHead}>
              <span className={styles.lionsName}>{summary.lionsAbbrev}</span>
              <span />
              <span>{summary.opponentAbbrev}</span>
            </div>
            {summary.teamStats.map((stat) => (
              <div key={stat.label} className={styles.statRow}>
                <span>{stat.lions}</span>
                <span className={styles.statLabel}>{stat.label}</span>
                <span>{stat.opponent}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {summary.playerGroups.map((group) => (
        <PlayerTable key={group.title} group={group} />
      ))}
    </>
  );
}

function PlayerTable({ group }: { group: PlayerGroup }) {
  return (
    <>
      <h3 className={styles.sectionLabel}>{group.title}</h3>
      <div className={styles.tableScroll}>
        <table className={styles.playerTable}>
          <thead>
            <tr>
              <th scope="col">Player</th>
              {group.labels.map((label) => (
                <th key={label} scope="col">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          {group.teams.map((team) => (
            <tbody key={`${group.title}-${team.name}`}>
              <tr className={styles.playerTeam}>
                <th colSpan={group.labels.length + 1}>{team.name}</th>
              </tr>
              {team.rows.map((row) => (
                <tr key={`${team.name}-${row.name}`}>
                  <th scope="row">{row.name}</th>
                  {row.stats.map((stat, index) => (
                    <td key={`${row.name}-${group.labels[index]}`}>{stat}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </>
  );
}

function ScoreFlowChart({
  points,
  quarters,
  maxT,
  lionsAbbrev,
  opponentAbbrev,
}: {
  points: FlowPoint[];
  quarters: FlowQuarter[];
  maxT: number;
  lionsAbbrev: string;
  opponentAbbrev: string;
}) {
  if (points.length < 2 || maxT <= 0) return null;

  const width = 640;
  const height = 220;
  const pad = { l: 46, r: 16, t: 32, b: 46 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const yMax = axisMax(Math.max(...points.map((point) => Math.max(point.lions, point.opponent))));
  const xOf = (t: number) => pad.l + (t / maxT) * innerW;
  const yOf = (score: number) => pad.t + (1 - score / yMax) * innerH;
  const last = points[points.length - 1];
  const ticks = [0, yMax];

  return (
    <figure className={styles.flowFigure}>
      <svg
        className={styles.flowChart}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Game flow. ${lionsAbbrev} ${last.lions}, ${opponentAbbrev} ${last.opponent}.`}
      >
        {quarters.map((quarter, index) => {
          const x = xOf(quarter.start);
          const w = Math.max(0, xOf(quarter.end) - x);
          return (
            <g key={quarter.label}>
              {index % 2 === 1 && (
                <rect x={x} y={pad.t} width={w} height={innerH} fill="#f4f4f4" />
              )}
              <text x={x + w / 2} y={height - 16} textAnchor="middle" fill="#999">
                {quarter.label}
              </text>
            </g>
          );
        })}
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              className={styles.flowGrid}
              x1={pad.l}
              x2={width - pad.r}
              y1={yOf(tick)}
              y2={yOf(tick)}
            />
            <text x={pad.l - 8} y={yOf(tick) + 4} textAnchor="end" fill="#999">
              {tick}
            </text>
          </g>
        ))}
        <path className={styles.flowOpp} d={stepPath(points, "opponent", xOf, yOf)} />
        <path className={styles.flowLions} d={stepPath(points, "lions", xOf, yOf)} />
      </svg>
      <figcaption className={styles.flowLegend}>
        <span>
          <i className={styles.swatch} />
          {lionsAbbrev} {last.lions}
        </span>
        <span>
          <i className={styles.swatchOpp} />
          {opponentAbbrev} {last.opponent}
        </span>
      </figcaption>
    </figure>
  );
}

function stepPath(
  points: FlowPoint[],
  key: "lions" | "opponent",
  xOf: (t: number) => number,
  yOf: (score: number) => number
) {
  let path = `M${xOf(points[0].t).toFixed(1)} ${yOf(points[0][key]).toFixed(1)}`;
  for (let index = 1; index < points.length; index++) {
    path += ` H${xOf(points[index].t).toFixed(1)} V${yOf(points[index][key]).toFixed(1)}`;
  }
  return path;
}

function axisMax(score: number) {
  if (score <= 0) return 10;
  return Math.ceil((score + 1) / 10) * 10;
}
