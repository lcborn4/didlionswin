"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import styles from "@/styles/Home.module.css";
import { getApiBase } from "./lib/api";
import { fetchLionsAnswer, getLead, type LiveData } from "./lib/lions-answer";

const MoreDetails = dynamic(() => import("./MoreDetails"), {
  ssr: false,
  loading: () => <p className={styles.moreHint}>Loading details…</p>,
});

type AnswerView = {
  text: string;
  color: string;
  subhead: string | null;
  scoreLine: string | null;
};

function buildAnswer(data: LiveData): AnswerView {
  const lions = data.score?.lions;
  const opponent = data.score?.opponent;
  const scoreLine =
    data.isLive && lions != null && opponent != null
      ? `${lions} – ${opponent}`
      : null;
  const lead = getLead(data);

  if (data.isLive) {
    if (lead === "winning") {
      return {
        text: "YES",
        color: "#1a7f37",
        subhead: "They're currently winning.",
        scoreLine,
      };
    }
    if (lead === "losing") {
      return {
        text: "NO",
        color: "#c5221f",
        subhead: "They're currently losing.",
        scoreLine,
      };
    }
    return {
      text: "TIE",
      color: "#9a6b12",
      subhead: "They're currently tied.",
      scoreLine,
    };
  }

  if (data.result === "WIN") {
    return { text: "YES", color: "#1a7f37", subhead: null, scoreLine: null };
  }
  if (data.result === "LOSS") {
    return { text: "NO", color: "#c5221f", subhead: null, scoreLine: null };
  }
  if (data.result === "TIE") {
    return { text: "TIE", color: "#9a6b12", subhead: null, scoreLine: null };
  }
  if (data.status === "STATUS_SCHEDULED") {
    return { text: "NOT YET", color: "#444", subhead: null, scoreLine: null };
  }

  return { text: "NO GAME", color: "#666", subhead: null, scoreLine: null };
}

async function loadAnswerFromApi(): Promise<LiveData> {
  const response = await fetch(`${getApiBase()}/live-score`);
  if (!response.ok) throw new Error("live-score failed");
  return response.json();
}

export default function Home() {
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [error, setError] = useState(false);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    let poll: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    async function loadAnswer() {
      try {
        let data: LiveData;
        try {
          data = await fetchLionsAnswer();
        } catch {
          data = await loadAnswerFromApi();
        }
        if (cancelled) return;

        setLiveData(data);
        setError(false);

        if (data.isLive && !poll) {
          poll = setInterval(loadAnswer, 30000);
        }
        if (!data.isLive && poll) {
          clearInterval(poll);
          poll = null;
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }

    loadAnswer();

    return () => {
      cancelled = true;
      if (poll) clearInterval(poll);
    };
  }, []);

  const answer = liveData ? buildAnswer(liveData) : null;

  return (
    <main className={`${styles.splash}${showMore ? ` ${styles.splashExpanded}` : ""}`}>
      <h1 className={styles.question}>Did The Detroit Lions Win?</h1>

      {answer && (
        <div className={styles.answerBlock}>
          <p className={styles.answer} style={{ color: answer.color }}>
            {answer.text}
          </p>
          {answer.subhead && (
            <p className={styles.subhead}>{answer.subhead}</p>
          )}
          {answer.scoreLine && (
            <p className={styles.liveScore}>{answer.scoreLine}</p>
          )}
        </div>
      )}

      {error && !answer && (
        <p className={styles.subhead}>Couldn’t load the result.</p>
      )}

      {(answer || error) && (
        <button
          type="button"
          className={styles.moreButton}
          aria-expanded={showMore}
          onClick={() => setShowMore((open) => !open)}
        >
          {showMore ? "Less" : "More"}
        </button>
      )}

      {showMore && <MoreDetails liveData={liveData} />}
    </main>
  );
}
