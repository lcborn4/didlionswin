// Live Score Updater - Client-side polling for real-time updates
class LiveScoreUpdater {
    constructor(apiBaseUrl) {
        this.apiBaseUrl = apiBaseUrl || 'https://api.didlionswin.com';
        this.pollInterval = null;
        this.isPolling = false;
        this.currentGameId = null;
        this.retryCount = 0;
        this.maxRetries = 3;

        console.log('🦁 Live Score Updater initialized');
        this.init();
    }

    async init() {
        try {
            // Check if there's a live game
            const gameStatus = await this.checkGameStatus();

            if (gameStatus.shouldPoll) {
                console.log('🏈 Starting live score polling...');
                this.startPolling(gameStatus.pollInterval);
            } else {
                console.log('📺 No live game - polling disabled');
                this.showStaticContent();
            }

        } catch (error) {
            console.error('❌ Failed to initialize live updater:', error);
            this.showStaticContent();
        }
    }

    async checkGameStatus() {
        const response = await fetch(`${this.apiBaseUrl}/api/game-status`);
        if (!response.ok) {
            throw new Error(`Game status check failed: ${response.status}`);
        }
        return await response.json();
    }

    async fetchLiveScore(gameId) {
        const url = gameId ?
            `${this.apiBaseUrl}/api/live-score?gameId=${gameId}` :
            `${this.apiBaseUrl}/api/live-score`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Live score fetch failed: ${response.status}`);
        }
        return await response.json();
    }

    startPolling(interval = 60000) {
        if (this.isPolling) {
            this.stopPolling();
        }

        this.isPolling = true;
        console.log(`🔄 Starting polling every ${interval / 1000} seconds`);

        // Initial fetch
        this.updateLiveScore();

        // Set up interval
        this.pollInterval = setInterval(() => {
            this.updateLiveScore();
        }, interval);

        // Show live indicator
        this.showLiveIndicator(true);
    }

    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }

        this.isPolling = false;
        this.showLiveIndicator(false);
        console.log('⏹️ Stopped live score polling');
    }

    async updateLiveScore() {
        try {
            console.log('🔄 Fetching live score...');
            const liveData = await this.fetchLiveScore(this.currentGameId);

            // Update the DOM
            this.updateScoreDisplay(liveData);

            // If game is no longer live, stop polling
            if (!liveData.isLive) {
                console.log('🏁 Game finished - stopping polling');
                this.stopPolling();
            }

            // Reset retry count on success
            this.retryCount = 0;

        } catch (error) {
            console.error('❌ Live score update failed:', error);
            this.handleError(error);
        }
    }

    updateScoreDisplay(liveData) {
        console.log('📊 Updating score display:', liveData);

        // Update main result
        const resultElement = document.querySelector('.game-result');
        if (resultElement) {
            resultElement.textContent = liveData.result;
            resultElement.className = `game-result ${liveData.result.toLowerCase().replace(' ', '-')}`;
        }

        // Update score
        const scoreElement = document.querySelector('.game-score');
        if (scoreElement) {
            scoreElement.innerHTML = `
        <div class="score-display">
          <span class="lions-score">${liveData.score.lions}</span>
          <span class="score-separator">-</span>
          <span class="opponent-score">${liveData.score.opponent}</span>
        </div>
      `;
        }

        // Update game info
        const infoElement = document.querySelector('.game-info');
        if (infoElement) {
            infoElement.innerHTML = `
        <div class="game-details">
          <div class="opponent">${liveData.opponent}</div>
          ${liveData.isLive ? `
            <div class="live-info">
              <span class="quarter">Q${liveData.quarter}</span>
              <span class="clock">${liveData.clock}</span>
            </div>
          ` : ''}
          <div class="last-updated">
            Updated: ${new Date(liveData.timestamp).toLocaleTimeString()}
          </div>
        </div>
      `;
        }

        // Update page title for live games
        if (liveData.isLive) {
            document.title = `LIVE: Lions ${liveData.score.lions}-${liveData.score.opponent} | Did The Lions Win?`;
        }
    }

    showLiveIndicator(show) {
        let indicator = document.querySelector('.live-indicator');

        if (show && !indicator) {
            indicator = document.createElement('div');
            indicator.className = 'live-indicator';
            indicator.innerHTML = `
        <div class="live-badge">
          <span class="live-dot"></span>
          LIVE
        </div>
      `;

            const header = document.querySelector('h1') || document.body.firstChild;
            if (header) {
                header.parentNode.insertBefore(indicator, header);
            }
        } else if (!show && indicator) {
            indicator.remove();
        }
    }

    showStaticContent() {
        console.log('📺 Showing static content');
        // Remove any live indicators
        this.showLiveIndicator(false);

        // Ensure static data is displayed
        const elements = document.querySelectorAll('[data-static-fallback]');
        elements.forEach(el => {
            el.style.display = 'block';
        });
    }

    handleError(error) {
        this.retryCount++;

        if (this.retryCount >= this.maxRetries) {
            console.log('❌ Max retries reached - stopping polling');
            this.stopPolling();
            this.showErrorMessage();
        } else {
            console.log(`🔄 Retrying... (${this.retryCount}/${this.maxRetries})`);
        }
    }

    showErrorMessage() {
        const errorElement = document.createElement('div');
        errorElement.className = 'live-error';
        errorElement.innerHTML = `
      <div class="error-message">
        ⚠️ Live updates temporarily unavailable
        <button onclick="window.liveUpdater.init()" class="retry-btn">
          Try Again
        </button>
      </div>
    `;

        const main = document.querySelector('main');
        if (main) {
            main.insertBefore(errorElement, main.firstChild);
        }
    }
}

// CSS for live score updates
const liveScoreCSS = `
  .live-indicator {
    text-align: center;
    margin: 1rem 0;
  }
  
  .live-badge {
    display: inline-flex;
    align-items: center;
    background: #ff0000;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-weight: bold;
    font-size: 0.9rem;
    animation: pulse 2s infinite;
  }
  
  .live-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: white;
    margin-right: 0.5rem;
    animation: blink 1s infinite;
  }
  
  .score-display {
    font-size: 2rem;
    font-weight: bold;
    text-align: center;
    margin: 1rem 0;
  }
  
  .lions-score {
    color: #0066cc;
  }
  
  .opponent-score {
    color: #666;
  }
  
  .score-separator {
    margin: 0 1rem;
    color: #999;
  }
  
  .game-details {
    text-align: center;
    margin: 1rem 0;
  }
  
  .live-info {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin: 0.5rem 0;
    font-weight: bold;
  }
  
  .quarter {
    background: #0066cc;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
  }
  
  .clock {
    font-family: monospace;
    font-size: 1.1rem;
  }
  
  .last-updated {
    font-size: 0.8rem;
    color: #666;
    margin-top: 0.5rem;
  }
  
  .live-error {
    background: #ffe6e6;
    border: 1px solid #ffcccc;
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem 0;
    text-align: center;
  }
  
  .retry-btn {
    background: #0066cc;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    margin-left: 1rem;
    cursor: pointer;
  }
  
  .retry-btn:hover {
    background: #0052a3;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  
  .game-result.in-progress {
    color: #ff6600;
    animation: pulse 2s infinite;
  }
  
  .game-result.win {
    color: #00cc00;
  }
  
  .game-result.loss {
    color: #cc0000;
  }
`;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Add CSS
    const style = document.createElement('style');
    style.textContent = liveScoreCSS;
    document.head.appendChild(style);

    // Initialize live updater
    window.liveUpdater = new LiveScoreUpdater();
});
