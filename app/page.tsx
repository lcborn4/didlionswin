import styles from "@/styles/Home.module.css";
import Script from "next/script";

// Static version with JavaScript enhancement
export default function Home() {
  return (
    <>
      <Script src="/js/dynamic-updater.js" strategy="afterInteractive" />
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

      {/* Dynamic image and fact */}
      <div id="game-images" style={{ textAlign: 'center', margin: '2rem 0' }}>
        <img src="/images/good/lionswin.jpg" alt="Lions win" style={{ maxWidth: '300px', height: 'auto' }} />
        <p style={{ marginTop: '1rem', fontSize: '1.2rem' }}>
          💡 The Detroit Lions All-time Rushing Leader: Barry Sanders 3,062 att, 15,269 yds, 99 TD
        </p>
      </div>

      </main>
    </>
  );
}
