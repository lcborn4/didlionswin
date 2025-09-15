"use client";

import styles from "@/styles/Home.module.css";
import { useState, useEffect, useMemo } from "react";

// Move imageFacts outside component to prevent recreation on every render
const imageFacts = [
  { image: '/images/good/aslan-roar.gif', fact: 'The Detroit Lions first started in July 12, 1930 as the Portsmouth Spartans' },
  { image: '/images/good/cook_fumble.jpg', fact: 'The Detroit Lions first season was in 1930' },
  { image: '/images/good/GdgB9HaWYAAP_BW.jpeg', fact: 'The Detroit Lions have 4 NFL Championships: 1935, 1952, 1953, 1957' },
  { image: '/images/good/GdgLgm5XcAAKXl0.jpeg', fact: 'The Detroit Lions have 5 NFL Western Division Championships: 1935, 1952, 1953, 1954, 1957' },
  { image: '/images/good/hutchinson_sack.jpg', fact: 'The Detroit Lions have 3 NFC Central Division Championships: 1983, 1991, 1993' },
  { image: '/images/good/IMG_1090.jpeg', fact: 'The Detroit Lions all time record: 579-702-34' },
  { image: '/images/good/IMG_8922.GIF', fact: 'The Detroit Lions winningest coach is Wayne Fontes: 66-67-0' },
  { image: '/images/good/lionswin.jpg', fact: 'The Detroit Lions All-time Passing Leader: Matthew Stafford 3,898/6,224, 45,109 yds, 282 TD' },
  { image: '/images/good/out.gif', fact: 'The Detroit Lions All-time Rushing Leader: Barry Sanders 3,062 att, 15,269 yds, 99 TD' }
];

// Client-side randomization using React hooks
export default function Home() {
  const [selectedContent, setSelectedContent] = useState(imageFacts[0]); // Default to first item

  useEffect(() => {
    // Randomize on component mount (each page load/refresh)
    const randomIndex = Math.floor(Math.random() * imageFacts.length);
    setSelectedContent(imageFacts[randomIndex]);
  }, []); // Empty dependency array - runs only once on mount

  return (
    <>
      <main className={styles.main}>
      <div>
        <h1>Did The Detroit Lions Win?</h1>
        <div id="main-answer">
          <h2 id="main-answer-text" style={{ color: '#00aa00', fontSize: '2.5rem', margin: '1rem 0' }}>
            ✅ YES
          </h2>
        </div>
      </div>

      {/* Game content */}
      <div id="game-content">
        <div className="game-result" id="game-result">
          🏈 Game Over: Chicago Bears at Detroit Lions
        </div>
        
        <div className="game-score" id="game-score">
          <div className="score-display">
            <span className="lions-score" id="lions-score">52</span>
            <span className="score-separator">-</span>
            <span className="opponent-score" id="opponent-score">21</span>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        <div>
          <h3>Previous Game</h3>
          <div id="prev-game">❌ Detroit Lions at Green Bay Packers - Lions 13, Packers 27</div>
        </div>
        <div>
          <h3>Latest Game</h3>
          <div id="latest-game">✅ Chicago Bears at Detroit Lions - Lions 52, Bears 21</div>
        </div>
        <div>
          <h3>Next Game</h3>
          <div id="next-game">🏈 at Baltimore Ravens - 9/22/2025</div>
        </div>
      </div>

      {/* Randomized image and fact */}
      <div style={{ textAlign: 'center', margin: '2rem 0' }}>
        <img src={selectedContent.image} alt="Lions win" style={{ maxWidth: '300px', height: 'auto' }} />
        <p style={{ marginTop: '1rem', fontSize: '1.2rem' }}>
          💡 {selectedContent.fact}
        </p>
      </div>

      </main>
    </>
  );
}
