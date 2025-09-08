import styles from "@/styles/Home.module.css";

// Static version for initial load
export default function Home() {
  return (
    <main className={styles.main}>
      <div>
        <h1>Did The Detroit Lions Win?</h1>
        <h2 style={{ color: '#cc0000', fontSize: '2.5rem', margin: '1rem 0' }}>❌ NO</h2>
      </div>

      {/* Game content */}
      <div id="game-content">
        <div className="game-result" id="game-result">
          🏈 Game Over: Detroit Lions at Green Bay Packers
        </div>
        

        <div className="game-score" id="game-score">
          <div className="score-display">
            <span className="lions-score">13</span>
            <span className="score-separator">-</span>
            <span className="opponent-score">27</span>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        <div>
          <h3>Previous Game</h3>
          <div id="prev-game">❌ Detroit Lions vs Houston Texans - Lions 7, Houston Texans 26</div>
        </div>
        <div>
          <h3>Latest Game</h3>
          <div id="latest-game">❌ Detroit Lions at Green Bay Packers - Lions 13, Packers 27</div>
        </div>
        <div>
          <h3>Next Game</h3>
          <div id="next-game">🏈 vs Chicago Bears - 9/14/2025</div>
        </div>
      </div>

      {/* Add a bad image and fact for the loss */}
      <div style={{ textAlign: 'center', margin: '2rem 0' }}>
        <img 
          src="/images/bad/kitty-cat.gif" 
          alt="Lions loss" 
          style={{ maxWidth: '300px', height: 'auto' }}
        />
        <p style={{ marginTop: '1rem', fontSize: '1.2rem' }}>
          💡 The Detroit Lions forced Barry Sanders into early retirement
        </p>
      </div>
    </main>
  );
}
