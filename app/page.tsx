import styles from "@/styles/Home.module.css";
import Script from "next/script";

// Static version with JavaScript enhancement
export default function Home() {
  return (
    <main className={styles.main}>
      <div>
        <h1>Did The Detroit Lions Win?</h1>
        <div id="main-answer">
          <h2 id="main-answer-text" style={{ color: '#666666', fontSize: '2.5rem', margin: '1rem 0' }}>
            ⏳ Loading...
          </h2>
        </div>
      </div>

      {/* Game content */}
      <div id="game-content">
        <div className="game-result" id="game-result">
          Loading game status...
        </div>
        
        <div className="game-score" id="game-score">
          <div className="score-display">
            <span className="lions-score" id="lions-score">-</span>
            <span className="score-separator">-</span>
            <span className="opponent-score" id="opponent-score">-</span>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        <div>
          <h3>Previous Game</h3>
          <div id="prev-game">Loading previous game...</div>
        </div>
        <div>
          <h3>Latest Game</h3>
          <div id="latest-game">Loading latest game...</div>
        </div>
        <div>
          <h3>Next Game</h3>
          <div id="next-game">Loading next game...</div>
        </div>
      </div>

      {/* Dynamic image and fact */}
      <div id="game-images" style={{ textAlign: 'center', margin: '2rem 0' }}>
        Loading...
      </div>

      {/* External JavaScript for dynamic updates */}
      <Script src="/js/dynamic-updater.js" strategy="afterInteractive" />
    </main>
  );
}
