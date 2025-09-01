import styles from "@/styles/Home.module.css";
import ClientOnlyLionsData from "./client-only";

// Static version for initial load
export default function Home() {
  return (
    <main className={styles.main}>
      <div>
        <h1>Did The Detroit Lions Win?</h1>
      </div>

      {/* Client-only component to avoid hydration issues */}
      <div id="game-content">
        <ClientOnlyLionsData />
        
        <div className="game-info" id="game-info">
          <p>No game scheduled today</p>
        </div>

        <div className="game-score" id="game-score">
          <div className="score-display">
            <span className="lions-score">--</span>
            <span className="score-separator">-</span>
            <span className="opponent-score">--</span>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        <div>
          <h3>Previous Game</h3>
          <div id="prev-game">Loading...</div>
        </div>
        <div>
          <h3>Latest Game</h3>
          <div id="latest-game">Loading...</div>
        </div>
        <div>
          <h3>Next Game</h3>
          <div id="next-game">Loading...</div>
        </div>
      </div>

      {/* Live score updater will be loaded via script tag in layout */}
    </main>
  );
}
