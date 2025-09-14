// Dynamic Lions Data Updater
// This script runs on page load to update the site with live data

console.log('Dynamic updater script loaded');

async function updateLionsData() {
    try {
        console.log('Starting data fetch...');
        
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
        
        console.log('API responses:', { 
            status: statusResponse.status, 
            schedule: scheduleResponse.status 
        });
        
        if (!statusResponse.ok || !scheduleResponse.ok) {
            throw new Error(`API Error: Status ${statusResponse.status}, Schedule ${scheduleResponse.status}`);
        }
        
        const statusData = await statusResponse.json();
        const scheduleData = await scheduleResponse.json();
        
        console.log('Data received:', { statusData, scheduleData });
        
        // Update main answer
        const mainAnswerEl = document.getElementById('main-answer-text');
        if (mainAnswerEl) {
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
            } else if (statusData.season && statusData.season.isOffSeason) {
                mainAnswerEl.textContent = '😴 OFF-SEASON';
                mainAnswerEl.style.color = '#666666';
            } else {
                mainAnswerEl.textContent = '❓ ?';
                mainAnswerEl.style.color = '#666666';
            }
        }
        
        // Update game result
        const gameResultEl = document.getElementById('game-result');
        if (gameResultEl) {
            if (statusData.hasLiveGame && statusData.currentGame) {
                gameResultEl.textContent = '🔴 LIVE: ' + statusData.currentGame.name;
            } else if (statusData.isGameDay && statusData.currentGame) {
                if (statusData.currentGame.isPostGame) {
                    gameResultEl.textContent = '🏈 Game Over: ' + statusData.currentGame.name;
                } else {
                    gameResultEl.textContent = '⏰ Upcoming: ' + statusData.currentGame.name;
                }
            } else if (statusData.season && statusData.season.isByeWeek) {
                gameResultEl.textContent = '😴 BYE WEEK - No game this week';
            } else if (statusData.season && statusData.season.isOffSeason) {
                gameResultEl.textContent = '🏈 Off-season - No games scheduled';
            } else {
                gameResultEl.textContent = '🏈 No game today';
            }
        }
        
        // Update scores
        const lionsScoreEl = document.getElementById('lions-score');
        const opponentScoreEl = document.getElementById('opponent-score');
        const latestGame = scheduleData.latestGame;
        
        if (latestGame && latestGame.score && lionsScoreEl && opponentScoreEl) {
            lionsScoreEl.textContent = latestGame.score.lions;
            opponentScoreEl.textContent = latestGame.score.opponent;
        }
        
        // Update game list
        if (scheduleData.previousGame) {
            const prevGameEl = document.getElementById('prev-game');
            if (prevGameEl) {
                const game = scheduleData.previousGame;
                const emoji = game.result === 'WIN' ? '✅' : game.result === 'LOSS' ? '❌' : '🏈';
                const scoreText = game.score && (game.score.lions > 0 || game.score.opponent > 0) 
                    ? ' - Lions ' + game.score.lions + ', ' + game.opponent + ' ' + game.score.opponent 
                    : '';
                prevGameEl.textContent = emoji + ' ' + game.name + scoreText;
            }
        }
        
        if (latestGame) {
            const latestGameEl = document.getElementById('latest-game');
            if (latestGameEl) {
                const emoji = latestGame.result === 'WIN' ? '✅' : latestGame.result === 'LOSS' ? '❌' : '🏈';
                const scoreText = latestGame.score && (latestGame.score.lions > 0 || latestGame.score.opponent > 0) 
                    ? ' - Lions ' + latestGame.score.lions + ', ' + latestGame.opponent + ' ' + latestGame.score.opponent 
                    : '';
                latestGameEl.textContent = emoji + ' ' + latestGame.name + scoreText;
            }
        }
        
        if (scheduleData.nextGame) {
            const nextGameEl = document.getElementById('next-game');
            if (nextGameEl) {
                const game = scheduleData.nextGame;
                const date = new Date(game.date).toLocaleDateString();
                nextGameEl.textContent = '🏈 vs ' + (game.opponent || 'Unknown') + ' - ' + date;
            }
        }
        
        // Update images
        const gameImagesEl = document.getElementById('game-images');
        if (gameImagesEl && latestGame) {
            if (latestGame.result === 'WIN') {
                gameImagesEl.innerHTML = '<img src="/images/good/lionswin.jpg" alt="Lions win" style="max-width: 300px; height: auto;" /><p style="margin-top: 1rem; font-size: 1.2rem;">💡 The Detroit Lions are the only NFL team to go 0-16 in a season (2008)</p>';
            } else if (latestGame.result === 'LOSS') {
                gameImagesEl.innerHTML = '<img src="/images/bad/kitty-cat.gif" alt="Lions loss" style="max-width: 300px; height: auto;" /><p style="margin-top: 1rem; font-size: 1.2rem;">💡 The Detroit Lions forced Barry Sanders into early retirement</p>';
            } else {
                gameImagesEl.innerHTML = '<img src="/images/out.gif" alt="No game" style="max-width: 300px; height: auto;" />';
            }
        }
        
        console.log('Page updated successfully');
        
        // Set up polling for live games
        if (statusData.shouldPoll && statusData.pollInterval) {
            console.log('Setting up polling every', statusData.pollInterval, 'ms');
            setTimeout(updateLionsData, statusData.pollInterval);
        }
        
    } catch (error) {
        console.error('Error updating page:', error);
        
        // Fallback to static content
        const mainAnswerEl = document.getElementById('main-answer-text');
        if (mainAnswerEl) {
            mainAnswerEl.textContent = '✅ YES';
            mainAnswerEl.style.color = '#00aa00';
        }
        
        const gameResultEl = document.getElementById('game-result');
        if (gameResultEl) {
            gameResultEl.textContent = '🏈 Game Over: Chicago Bears at Detroit Lions';
        }
        
        const lionsScoreEl = document.getElementById('lions-score');
        const opponentScoreEl = document.getElementById('opponent-score');
        if (lionsScoreEl) lionsScoreEl.textContent = '52';
        if (opponentScoreEl) opponentScoreEl.textContent = '21';
        
        const prevGameEl = document.getElementById('prev-game');
        if (prevGameEl) {
            prevGameEl.textContent = '❌ Detroit Lions at Green Bay Packers - Lions 13, Packers 27';
        }
        
        const latestGameEl = document.getElementById('latest-game');
        if (latestGameEl) {
            latestGameEl.textContent = '✅ Chicago Bears at Detroit Lions - Lions 52, Bears 21';
        }
        
        const nextGameEl = document.getElementById('next-game');
        if (nextGameEl) {
            nextGameEl.textContent = '🏈 at Baltimore Ravens - 9/22/2025';
        }
        
        const gameImagesEl = document.getElementById('game-images');
        if (gameImagesEl) {
            gameImagesEl.innerHTML = '<img src="/images/good/lionswin.jpg" alt="Lions win" style="max-width: 300px; height: auto;" /><p style="margin-top: 1rem; font-size: 1.2rem;">💡 The Detroit Lions are the only NFL team to go 0-16 in a season (2008)</p>';
        }
    }
}

// Run on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateLionsData);
} else {
    updateLionsData();
}
