import styles from "@/styles/Home.module.css";

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

      {/* Inline JavaScript for dynamic updates */}
      <script dangerouslySetInnerHTML={{
        __html: `
          (function() {
            console.log('Inline script starting...');
            
            async function updatePage() {
              try {
                console.log('Fetching data...');
                
                const [statusResponse, scheduleResponse] = await Promise.all([
                  fetch('https://7mnzh94kp5.execute-api.us-east-1.amazonaws.com/api/game-status', {
                    mode: 'cors',
                    headers: { 'Content-Type': 'application/json' }
                  }),
                  fetch('https://7mnzh94kp5.execute-api.us-east-1.amazonaws.com/api/schedule', {
                    mode: 'cors',
                    headers: { 'Content-Type': 'application/json' }
                  })
                ]);
                
                if (!statusResponse.ok || !scheduleResponse.ok) {
                  throw new Error('API Error');
                }
                
                const statusData = await statusResponse.json();
                const scheduleData = await scheduleResponse.json();
                
                console.log('Data received:', { statusData, scheduleData });
                
                // Update main answer
                const mainAnswerEl = document.getElementById('main-answer-text');
                const latestGame = scheduleData.latestGame;
                
                if (latestGame && latestGame.result === 'WIN') {
                  mainAnswerEl.textContent = '✅ YES';
                  mainAnswerEl.style.color = '#00aa00';
                } else if (latestGame && latestGame.result === 'LOSS') {
                  mainAnswerEl.textContent = '❌ NO';
                  mainAnswerEl.style.color = '#cc0000';
                } else if (statusData.season && statusData.season.isByeWeek) {
                  mainAnswerEl.textContent = '😴 BYE WEEK';
                  mainAnswerEl.style.color = '#666666';
                } else {
                  mainAnswerEl.textContent = '❓ ?';
                  mainAnswerEl.style.color = '#666666';
                }
                
                // Update game result
                const gameResultEl = document.getElementById('game-result');
                if (statusData.hasLiveGame) {
                  gameResultEl.textContent = '🔴 LIVE: ' + statusData.currentGame.name;
                } else if (statusData.season && statusData.season.isByeWeek) {
                  gameResultEl.textContent = '😴 BYE WEEK - No game this week';
                } else {
                  gameResultEl.textContent = '🏈 No game today';
                }
                
                // Update scores
                if (latestGame && latestGame.score) {
                  const lionsScoreEl = document.getElementById('lions-score');
                  const opponentScoreEl = document.getElementById('opponent-score');
                  if (lionsScoreEl) lionsScoreEl.textContent = latestGame.score.lions;
                  if (opponentScoreEl) opponentScoreEl.textContent = latestGame.score.opponent;
                }
                
                // Update game list
                if (scheduleData.previousGame) {
                  const prevGameEl = document.getElementById('prev-game');
                  const game = scheduleData.previousGame;
                  const emoji = game.result === 'WIN' ? '✅' : game.result === 'LOSS' ? '❌' : '🏈';
                  const scoreText = game.score ? ' - Lions ' + game.score.lions + ', ' + game.opponent + ' ' + game.score.opponent : '';
                  prevGameEl.textContent = emoji + ' ' + game.name + scoreText;
                }
                
                if (latestGame) {
                  const latestGameEl = document.getElementById('latest-game');
                  const emoji = latestGame.result === 'WIN' ? '✅' : latestGame.result === 'LOSS' ? '❌' : '🏈';
                  const scoreText = latestGame.score ? ' - Lions ' + latestGame.score.lions + ', ' + latestGame.opponent + ' ' + latestGame.score.opponent : '';
                  latestGameEl.textContent = emoji + ' ' + latestGame.name + scoreText;
                }
                
                if (scheduleData.nextGame) {
                  const nextGameEl = document.getElementById('next-game');
                  const game = scheduleData.nextGame;
                  const date = new Date(game.date).toLocaleDateString();
                  nextGameEl.textContent = '🏈 vs ' + (game.opponent || 'Unknown') + ' - ' + date;
                }
                
                // Update images
                const gameImagesEl = document.getElementById('game-images');
                if (latestGame && latestGame.result === 'WIN') {
                  gameImagesEl.innerHTML = '<img src="/images/good/lionswin.jpg" alt="Lions win" style="maxWidth: 300px; height: auto;" /><p style="marginTop: 1rem; fontSize: 1.2rem;">💡 The Detroit Lions are the only NFL team to go 0-16 in a season (2008)</p>';
                } else if (latestGame && latestGame.result === 'LOSS') {
                  gameImagesEl.innerHTML = '<img src="/images/bad/kitty-cat.gif" alt="Lions loss" style="maxWidth: 300px; height: auto;" /><p style="marginTop: 1rem; fontSize: 1.2rem;">💡 The Detroit Lions forced Barry Sanders into early retirement</p>';
                } else {
                  gameImagesEl.innerHTML = '<img src="/images/out.gif" alt="No game" style="maxWidth: 300px; height: auto;" />';
                }
                
                console.log('Page updated successfully');
                
              } catch (error) {
                console.error('Error updating page:', error);
                
                // Fallback to static content
                const mainAnswerEl = document.getElementById('main-answer-text');
                mainAnswerEl.textContent = '✅ YES';
                mainAnswerEl.style.color = '#00aa00';
                
                const gameResultEl = document.getElementById('game-result');
                gameResultEl.textContent = '🏈 Game Over: Chicago Bears at Detroit Lions';
                
                const lionsScoreEl = document.getElementById('lions-score');
                const opponentScoreEl = document.getElementById('opponent-score');
                if (lionsScoreEl) lionsScoreEl.textContent = '52';
                if (opponentScoreEl) opponentScoreEl.textContent = '21';
              }
            }
            
            // Run on page load
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', updatePage);
            } else {
              updatePage();
            }
          })();
        `
      }} />
    </main>
  );
}
