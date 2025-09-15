import styles from "@/styles/Home.module.css";

// Static version with client-side randomization
export default function Home() {
  return (
    <>
      <script dangerouslySetInnerHTML={{
        __html: `
          // Inline randomization script
          (function() {
            console.log('=== RANDOMIZATION SCRIPT STARTED ===');
            const goodImages = [
              '/images/good/aslan-roar.gif',
              '/images/good/cook_fumble.jpg',
              '/images/good/GdgB9HaWYAAP_BW.jpeg',
              '/images/good/GdgLgm5XcAAKXl0.jpeg',
              '/images/good/hutchinson_sack.jpg',
              '/images/good/IMG_1090.jpeg',
              '/images/good/IMG_8922.GIF',
              '/images/good/lionswin.jpg',
              '/images/good/out.gif'
            ];
            
            const goodFacts = [
              'The Detroit Lions first started in July 12, 1930 as the Portsmouth Spartans',
              'The Detroit Lions\' first season was in 1930',
              'The Detroit Lions have 4 NFL Championships: 1935, 1952, 1953, 1957',
              'The Detroit Lions have 5 NFL Western Division Championships: 1935, 1952, 1953, 1954, 1957',
              'The Detroit Lions have 3 NFC Central Division Championships: 1983, 1991, 1993',
              'The Detroit Lions\' all time record: 579-702-34',
              'The Detroit Lions\' winningest coach is Wayne Fontes: 66-67-0',
              'The Detroit Lions All-time Passing Leader: Matthew Stafford 3,898/6,224, 45,109 yds, 282 TD',
              'The Detroit Lions All-time Rushing Leader: Barry Sanders 3,062 att, 15,269 yds, 99 TD',
              'The Detroit Lions All-time Receiving Leader: Calvin Johnson 731 rec, 11,619 yds, 83 TD'
            ];
            
            function randomizeContent() {
              console.log('randomizeContent function called!');
              const gameImagesEl = document.getElementById('game-images');
              console.log('gameImagesEl:', gameImagesEl);
              if (gameImagesEl) {
                const randomImage = goodImages[Math.floor(Math.random() * goodImages.length)];
                const randomFact = goodFacts[Math.floor(Math.random() * goodFacts.length)];
                console.log('Selected random image:', randomImage);
                console.log('Selected random fact:', randomFact);
                gameImagesEl.innerHTML = '<img src="' + randomImage + '" alt="Lions win" style="max-width: 300px; height: auto;" /><p style="margin-top: 1rem; font-size: 1.2rem;">💡 ' + randomFact + '</p>';
                console.log('Content updated!');
              } else {
                console.log('Could not find game-images element');
              }
            }
            
            // Run immediately
            randomizeContent();
          })();
        `
      }} />
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
      <div id="game-images" style={{ textAlign: 'center', margin: '2rem 0' }}>
        <img src="/images/good/lionswin.jpg" alt="Lions win" style={{ maxWidth: '300px', height: 'auto' }} />
        <p style={{ marginTop: '1rem', fontSize: '1.2rem' }}>
          💡 The Detroit Lions have 4 NFL Championships: 1935, 1952, 1953, 1957
        </p>
      </div>

      </main>
    </>
  );
}
