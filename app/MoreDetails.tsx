"use client";

import { useEffect, useState } from "react";
import styles from "@/styles/Home.module.css";
import { getApiBase } from "./lib/api";

import type { LiveData } from "./lib/lions-answer";

type GameRow = {
  name?: string;
  date?: string;
  opponent?: string;
  result?: string;
  seasonType?: string;
  score?: { lions?: number; opponent?: number };
};

const imageFacts = [
  {
    image: "/images/good/aslan-roar.gif",
    fact: "The Detroit Lions first started in July 12, 1930 as the Portsmouth Spartans",
  },
  {
    image: "/images/good/cook_fumble.jpg",
    fact: "The Detroit Lions first season was in 1930",
  },
  {
    image: "/images/good/GdgB9HaWYAAP_BW.jpeg",
    fact: "The Detroit Lions have 4 NFL Championships: 1935, 1952, 1953, 1957",
  },
  {
    image: "/images/good/GdgLgm5XcAAKXl0.jpeg",
    fact: "The Detroit Lions have 5 NFL Western Division Championships: 1935, 1952, 1953, 1954, 1957",
  },
  {
    image: "/images/good/hutchinson_sack.jpg",
    fact: "The Detroit Lions have 3 NFC Central Division Championships: 1983, 1991, 1993",
  },
  {
    image: "/images/good/IMG_1090.jpeg",
    fact: "The Detroit Lions all time record: 579-702-34",
  },
  {
    image: "/images/good/IMG_8922.GIF",
    fact: "The Detroit Lions winningest coach is Wayne Fontes: 66-67-0",
  },
  {
    image: "/images/good/lionswin.jpg",
    fact: "The Detroit Lions All-time Passing Leader: Matthew Stafford 3,898/6,224, 45,109 yds, 282 TD",
  },
  {
    image: "/images/good/out.gif",
    fact: "The Detroit Lions All-time Rushing Leader: Barry Sanders 3,062 att, 15,269 yds, 99 TD",
  },
  {
    image: "/images/good/IMG_7310.JPG",
    fact: "The Detroit Lions All-time Receiving Leader: Calvin Johnson 11,619 yds, 83 TD",
  },
];

function seasonLabel(game?: GameRow) {
  if (game?.seasonType === "preseason") return " (Preseason)";
  if (game?.seasonType === "postseason") return " (Playoffs)";
  return "";
}

function formatGameLine(game: GameRow, emoji: string) {
  const date = game.date
    ? new Date(game.date).toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      })
    : "";
  const score =
    game.score?.lions != null && game.score?.opponent != null
      ? ` - Lions ${game.score.lions}, ${game.opponent} ${game.score.opponent}`
      : "";
  return `${emoji} ${game.name}${seasonLabel(game)}${date ? ` - ${date}` : ""}${score}`;
}

export default function MoreDetails({ liveData }: { liveData: LiveData | null }) {
  const [selectedContent] = useState(
    () => imageFacts[Math.floor(Math.random() * imageFacts.length)]
  );
  const [prevGame, setPrevGame] = useState("Loading previous game…");
  const [latestGame, setLatestGame] = useState("Loading latest game…");
  const [nextGame, setNextGame] = useState("Loading next game…");

  const lionsScore = liveData?.score?.lions ?? "--";
  const opponentScore = liveData?.score?.opponent ?? "--";
  const preseasonNote = liveData?.seasonType === "preseason" ? " (Preseason)" : "";
  const gameResult = liveData?.isLive
    ? `LIVE: ${liveData.name || ""}`
    : liveData?.name
      ? `Game Over${preseasonNote}: ${liveData.name}`
      : "Game details";

  useEffect(() => {
    let cancelled = false;

    async function loadSchedule() {
      try {
        const response = await fetch(`${getApiBase()}/schedule`);
        if (!response.ok) return;
        const scheduleData = await response.json();
        if (cancelled) return;

        if (scheduleData.previousGame) {
          const prev = scheduleData.previousGame;
          const resultEmoji =
            prev.result === "WIN" ? "✅" : prev.result === "LOSS" ? "❌" : "🤝";
          setPrevGame(formatGameLine(prev, resultEmoji));
        } else {
          setPrevGame("No previous game");
        }

        if (scheduleData.latestGame) {
          const latest = scheduleData.latestGame;
          const resultEmoji =
            latest.result === "WIN" ? "✅" : latest.result === "LOSS" ? "❌" : "🤝";
          setLatestGame(formatGameLine(latest, resultEmoji));
        } else {
          setLatestGame("No recent game");
        }

        if (scheduleData.nextGame) {
          const next = scheduleData.nextGame;
          const nextDate = new Date(next.date);
          const isPlaceholder =
            !next.opponent ||
            next.opponent === "TBD" ||
            next.name?.includes("Regular Season") ||
            !next.name?.includes("Detroit Lions");

          if (nextDate.getTime() > Date.now() + 60 * 60 * 1000 && !isPlaceholder) {
            const gameDate = nextDate.toLocaleDateString("en-US", {
              month: "numeric",
              day: "numeric",
              year: "numeric",
            });
            setNextGame(`🏈 ${next.name}${seasonLabel(next)} - ${gameDate}`);
          } else {
            setNextGame("Next game TBD");
          }
        } else {
          setNextGame("No upcoming games");
        }
      } catch {
        setPrevGame("Unable to load previous game");
        setLatestGame("Unable to load latest game");
        setNextGame("Unable to load next game");
      }
    }

    loadSchedule();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={styles.morePanel}>
      <div className="game-result" id="game-result">
        {gameResult}
      </div>

      <div className="game-score" id="game-score">
        <div className="score-display">
          <span className="lions-score" id="lions-score">
            {lionsScore}
          </span>
          <span className="score-separator">-</span>
          <span className="opponent-score" id="opponent-score">
            {opponentScore}
          </span>
        </div>
      </div>

      <div className={styles.grid}>
        <div>
          <h3>Previous Game</h3>
          <div id="prev-game">{prevGame}</div>
        </div>
        <div>
          <h3>Latest Game</h3>
          <div id="latest-game">{latestGame}</div>
        </div>
        <div>
          <h3>Next Game</h3>
          <div id="next-game">{nextGame}</div>
        </div>
      </div>

      <div style={{ textAlign: "center", margin: "2rem 0" }}>
        <img
          src={selectedContent.image}
          alt="Lions"
          style={{ maxWidth: "300px", height: "auto" }}
          loading="lazy"
        />
        <p style={{ marginTop: "1rem", fontSize: "1.2rem" }}>
          💡 {selectedContent.fact}
        </p>
      </div>
    </div>
  );
}
