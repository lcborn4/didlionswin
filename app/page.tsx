import styles from "@/styles/Home.module.css";
import DynamicLionsData from "./dynamic-lions-data";

export default function Home() {
  return (
    <main className={styles.main}>
      <div>
        <h1>Did The Detroit Lions Win?</h1>
        <div id="main-answer">
          <DynamicLionsData />
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

      {/* Dynamic image and fact will be loaded by DynamicLionsData */}
      <div id="game-images" style={{ textAlign: 'center', margin: '2rem 0' }}>
        Loading...
      </div>
    </main>
  );
}
