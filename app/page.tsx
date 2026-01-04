"use client";

import styles from "@/styles/Home.module.css";
import { useState, useEffect } from "react";

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
  { image: '/images/good/out.gif', fact: 'The Detroit Lions All-time Rushing Leader: Barry Sanders 3,062 att, 15,269 yds, 99 TD' },
  { image: '/images/good/IMG_7310.JPG', fact: 'The Detroit Lions All-time Receiving Leader: Calvin Johnson 11,619 yds, 83 TD' }
];

// API endpoints - use local API routes in development, App Runner in production
// In development (localhost), use local API routes to avoid cold starts
// In production, use AWS App Runner (always warm, no cold starts)
// App Runner URL is set via NEXT_PUBLIC_APP_RUNNER_URL GitHub secret
const getApiBase = () => {
  if (typeof window !== 'undefined') {
    // Client-side: check if we're on localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return '/api';
    }
  }
  // Production: use App Runner (preferred) or fallback to Lambda
  // App Runner URL format: https://xxxxx.us-east-1.awsapprunner.com
  // Set NEXT_PUBLIC_APP_RUNNER_URL environment variable after deploying App Runner
  const appRunnerUrl = process.env.NEXT_PUBLIC_APP_RUNNER_URL;
  const apiBase = process.env.NEXT_PUBLIC_API_BASE;
  
  // Ensure we have a valid URL (not empty string)
  if (appRunnerUrl && appRunnerUrl.trim() !== '') {
    // Ensure it has https:// prefix
    let url = appRunnerUrl.startsWith('http') ? appRunnerUrl : `https://${appRunnerUrl}`;
    // App Runner server uses /api prefix for all routes
    return url.endsWith('/api') ? url : `${url}/api`;
  }
  if (apiBase && apiBase.trim() !== '') {
    return apiBase;
  }
  // Lambda fallback
  return 'https://7mnzh94kp5.execute-api.us-east-1.amazonaws.com/api';
};

// Client-side randomization and live data using React hooks
export default function Home() {
  const [selectedContent, setSelectedContent] = useState(imageFacts[0]);
  const [gameData, setGameData] = useState({
    mainAnswer: '🏈 Loading',
    mainAnswerColor: '#666',
    gameResult: '🏈 Loading game data',
    lionsScore: '--',
    opponentScore: '--',
    opponent: 'Loading',
    prevGame: '🏈 Loading',
    latestGame: '🏈 Loading',
    nextGame: '🏈 Loading',
    isLive: false
  });
  const [loading, setLoading] = useState(true);
  const [loadingDots, setLoadingDots] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Animated loading dots effect
  useEffect(() => {
    if (!loading) return;
    
    console.log('Starting loading animation...');
    const interval = setInterval(() => {
      setLoadingDots(prev => {
        const newDots = prev === '...' ? '' : prev + '.';
        console.log('Loading dots:', newDots);
        return newDots;
      });
    }, 500); // Change every 500ms

    return () => clearInterval(interval);
  }, [loading]);

  // Update loading display when dots change
  useEffect(() => {
    if (loading) {
      setGameData(prev => ({
        ...prev,
        mainAnswer: `🏈 Loading${loadingDots}`,
        gameResult: `🏈 Loading game data${loadingDots}`,
        opponent: `Loading${loadingDots}`,
        prevGame: `🏈 Loading${loadingDots}`,
        latestGame: `🏈 Loading${loadingDots}`,
        nextGame: `🏈 Loading${loadingDots}`
      }));
    }
  }, [loadingDots, loading]);

  // Load live game data
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;

    async function loadLiveData() {
      try {
        const apiBase = getApiBase();
        console.log('Loading live game data...', { 
          apiBase, 
          hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
          appRunnerUrl: process.env.NEXT_PUBLIC_APP_RUNNER_URL,
          apiBaseEnv: process.env.NEXT_PUBLIC_API_BASE
        });
        
        // Load APIs separately to update UI progressively (don't wait for slow schedule API)
        // Fast APIs (status, live-score) update immediately, schedule updates when ready
        
        let statusData: any = null;
        let liveData: any = null;
        let scheduleData: any = null;

        // Start all API calls in parallel, but handle responses as they arrive
        const statusPromise = fetch(`${apiBase}/game-status`)
          .then(async (response) => {
            if (response.ok) {
              try {
                const data = await response.json();
                console.log('✅ Status data loaded:', data);
                statusData = data;
                // Update UI immediately with status data
                updateGameDisplay(statusData, liveData, scheduleData);
                return data;
              } catch (err) {
                console.warn('Failed to parse status data:', err);
              }
            } else {
              console.warn('Status response not ok:', response.status);
            }
            return null;
          })
          .catch((err) => {
            console.warn('Game status API failed:', err);
            return null;
          });

        const livePromise = fetch(`${apiBase}/live-score`)
          .then(async (response) => {
            if (response.ok) {
              try {
                const data = await response.json();
                console.log('✅ Live data loaded:', data);
                liveData = data;
                // Update UI immediately with live data
                updateGameDisplay(statusData, liveData, scheduleData);
                return data;
              } catch (err) {
                console.warn('Failed to parse live data:', err);
              }
            } else {
              console.warn('Live response not ok:', response.status);
            }
            return null;
          })
          .catch((err) => {
            console.warn('Live score API failed:', err);
            return null;
          });

        // Schedule API is slow - load it separately and update when ready
        const schedulePromise = fetch(`${apiBase}/schedule`)
          .then(async (response) => {
            if (response.ok) {
              try {
                console.log('⏳ Schedule API loading (makes many ESPN requests)...');
                const data = await response.json();
                console.log('✅ Schedule data loaded:', data);
                scheduleData = data;
                // Store the timestamp from the API response
                if (scheduleData.timestamp) {
                  setLastUpdated(scheduleData.timestamp);
                }
                // Update UI with complete data when schedule finishes
                updateGameDisplay(statusData, liveData, scheduleData);
                return data;
              } catch (err) {
                console.warn('Failed to parse schedule data:', err);
              }
            } else {
              console.warn('Schedule response not ok:', response.status);
            }
            return null;
          })
          .catch((err) => {
            console.warn('Schedule API failed:', err);
            return null;
          });

        // Wait for all to complete (for error handling)
        await Promise.all([statusPromise, livePromise, schedulePromise]);

        // Set up polling for live games
        if (liveData?.isLive || statusData?.hasLiveGame) {
          console.log('Game is live, starting polling...');
          pollInterval = setInterval(loadLiveData, 30000); // Poll every 30 seconds
        }

      } catch (error) {
        console.error('Error loading live data:', error);
        // Fallback when API fails - show error state
        setGameData({
          mainAnswer: '❓ ERROR',
          mainAnswerColor: '#666',
          gameResult: '🏈 Unable to load game data',
          lionsScore: '--',
          opponentScore: '--',
          opponent: 'Unknown',
          prevGame: '🏈 Unable to load previous game',
          latestGame: '🏈 Unable to load latest game',
          nextGame: '🏈 Unable to load next game',
          isLive: false
        });
      } finally {
        setLoading(false);
      }
    }

    loadLiveData();

    // Randomize content
    const randomIndex = Math.floor(Math.random() * imageFacts.length);
    setSelectedContent(imageFacts[randomIndex]);

    // Cleanup polling on unmount
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, []);

  function updateGameDisplay(statusData: any, liveData: any, scheduleData: any) {
    // Determine main answer and styling
    let mainAnswer = `🏈 Loading${loadingDots}`;
    let mainAnswerColor = '#666';
    let gameResult = `🏈 Loading game data${loadingDots}`;
    let lionsScore = '--';
    let opponentScore = '--';
    let opponent = `Loading${loadingDots}`;
    let isLive = false;

    // CRITICAL: Check for LIVE games FIRST before showing final results
    // Priority order: 1) Live data API (most reliable for live games), 2) Status data, 3) Schedule currentGame, 4) Completed games
    
    // FIRST: Check liveData API - this is specifically designed to detect live games
    if (liveData && liveData.isLive) {
      isLive = true;
      opponent = liveData.opponent || 'Opponent';
      lionsScore = liveData.score?.lions?.toString() || '--';
      opponentScore = liveData.score?.opponent?.toString() || '--';
      mainAnswer = '🔴 LIVE';
      mainAnswerColor = '#ff0000';
      gameResult = `🏈 LIVE: ${liveData.name}`;
    }
    
    // SECOND: Check status data for live game indication
    else if (statusData && statusData.hasLiveGame && statusData.currentGame) {
      isLive = true;
      mainAnswer = '🔴 LIVE';
      mainAnswerColor = '#ff0000';
      gameResult = `🏈 LIVE: ${statusData.currentGame.name}`;
      
      // Try to get scores from liveData if available (even if it's not marked as live)
      if (liveData) {
        opponent = liveData.opponent || statusData.currentGame.name.split(' at ')[0].replace('Detroit Lions ', '');
        lionsScore = liveData.score?.lions?.toString() || '--';
        opponentScore = liveData.score?.opponent?.toString() || '--';
      } else if (scheduleData?.currentGame) {
        opponent = scheduleData.currentGame.opponent || 'Opponent';
        lionsScore = scheduleData.currentGame.score?.lions?.toString() || '--';
        opponentScore = scheduleData.currentGame.score?.opponent?.toString() || '--';
      } else {
        opponent = 'Opponent';
      }
    }
    
    // THIRD: Check scheduleData.currentGame - this is the source of truth for current game status
    else if (scheduleData?.currentGame) {
      const currentGame = scheduleData.currentGame;
      const gameStatus = currentGame.status || '';
      const isGameLive = currentGame.isLive || gameStatus === 'STATUS_IN_PROGRESS';
      
      // If game is live/in-progress, ALWAYS treat it as live (ignore any result field)
      if (isGameLive) {
        isLive = true;
        mainAnswer = '🔴 LIVE';
        mainAnswerColor = '#ff0000';
        gameResult = `🏈 LIVE: ${currentGame.name}`;
        opponent = currentGame.opponent || 'Opponent';
        lionsScore = currentGame.score?.lions?.toString() || '--';
        opponentScore = currentGame.score?.opponent?.toString() || '--';
        
        // Try to get updated scores from liveData if available
        if (liveData) {
          opponent = liveData.opponent || opponent;
          lionsScore = liveData.score?.lions?.toString() || lionsScore;
          opponentScore = liveData.score?.opponent?.toString() || opponentScore;
        }
      }
      // If game is scheduled but not started yet
      else if (gameStatus === 'STATUS_SCHEDULED') {
        gameResult = `🏈 Upcoming: ${currentGame.name}`;
        mainAnswer = '⏰ SOON';
        mainAnswerColor = '#ff8800';
        opponent = currentGame.opponent || 'Opponent';
      }
    }

    // FOURTH: Show final results from scheduleData if game is NOT live
    // CRITICAL: Prioritize scheduleData.latestGame for final results, but only if no live game
    if (!isLive && scheduleData) {
      // Final safety check: if liveData or statusData says there's a live game, don't show results
      const hasAnyLiveIndicator = 
        (liveData && liveData.isLive) ||
        (statusData && statusData.hasLiveGame) ||
        (statusData && statusData.currentGame && statusData.currentGame.isLive);
      
      if (hasAnyLiveIndicator) {
        // One of the APIs says there's a live game, override and show LIVE
        isLive = true;
        mainAnswer = '🔴 LIVE';
        mainAnswerColor = '#ff0000';
        
        if (liveData && liveData.isLive) {
          gameResult = `🏈 LIVE: ${liveData.name}`;
          opponent = liveData.opponent || 'Opponent';
          lionsScore = liveData.score?.lions?.toString() || '--';
          opponentScore = liveData.score?.opponent?.toString() || '--';
        } else if (statusData && statusData.currentGame) {
          gameResult = `🏈 LIVE: ${statusData.currentGame.name}`;
        }
      } else {
        // Use currentGame if available (and not live), otherwise use latestGame
        const gameToShow = scheduleData.currentGame || scheduleData.latestGame;
        
        if (gameToShow) {
          // We have a game - check if it's live or has a result
          const gameStatus = gameToShow.status || '';
          const isGameLive = gameToShow.isLive || gameStatus === 'STATUS_IN_PROGRESS';
          
          // If game has a result and is not live, show it!
          if (!isGameLive && gameToShow.result) {
            // ALWAYS use the scores and opponent from the game - this is the source of truth
            // scheduleData.latestGame is more reliable than liveData, so use it completely
            // All data should be dynamic from the API - use gameToShow properties directly
            opponent = gameToShow.opponent || opponent;
            if (gameToShow.score?.lions !== undefined && gameToShow.score?.lions !== null) {
              lionsScore = gameToShow.score.lions.toString();
            }
            if (gameToShow.score?.opponent !== undefined && gameToShow.score?.opponent !== null) {
              opponentScore = gameToShow.score.opponent.toString();
            }
            
            // All result data comes from gameToShow - dynamic from API
            if (gameToShow.result === 'WIN') {
              mainAnswer = '✅ YES';
              mainAnswerColor = '#00aa00';
              gameResult = `🏈 Game Over: ${gameToShow.name}`;
            } else if (gameToShow.result === 'LOSS') {
              mainAnswer = '❌ NO';
              mainAnswerColor = '#cc0000';
              gameResult = `🏈 Game Over: ${gameToShow.name}`;
            } else if (gameToShow.result === 'TIE') {
              mainAnswer = '🤝 TIE';
              mainAnswerColor = '#ff8800';
              gameResult = `🏈 Game Over: ${gameToShow.name}`;
            }
          } else if (gameStatus === 'STATUS_SCHEDULED' && gameToShow === scheduleData.currentGame) {
            // Upcoming game that hasn't started yet
            gameResult = `🏈 Upcoming: ${gameToShow.name}`;
            mainAnswer = '⏰ SOON';
            mainAnswerColor = '#ff8800';
            opponent = gameToShow.opponent || opponent;
          }
        }
      }
    }

    // FIFTH: Check status data for game day but not live (only if we haven't set mainAnswer yet)
    if (!isLive && !mainAnswer.includes('YES') && !mainAnswer.includes('NO') && !mainAnswer.includes('TIE') && statusData) {
      if (statusData.isGameDay && statusData.currentGame) {
        if (statusData.currentGame.isPreGame) {
          gameResult = `🏈 Upcoming: ${statusData.currentGame.name}`;
          mainAnswer = '⏰ SOON';
          mainAnswerColor = '#ff8800';
        } else if (statusData.currentGame.isPostGame) {
          gameResult = `🏈 Game Over: ${statusData.currentGame.name}`;
          // Will get result from scheduleData above
        }
      } else if (statusData.season?.isOffSeason) {
        mainAnswer = '🏈 OFF-SEASON';
        mainAnswerColor = '#666';
        gameResult = '🏈 Off-season - No games scheduled';
      } else {
        // Only show "NO GAME" if we haven't already set a result
        if (mainAnswer === `🏈 Loading${loadingDots}` || mainAnswer.includes('Loading')) {
          mainAnswer = '🏈 NO GAME';
          mainAnswerColor = '#666';
          gameResult = '🏈 No game today';
        }
      }
    }
    
    // Handle live data that's not live (completed) - ONLY use this as a last resort
    // scheduleData.latestGame is ALWAYS more reliable for final results, so prioritize that
    // Only use liveData if scheduleData doesn't have a result AND we haven't set mainAnswer yet
    const hasResultFromSchedule = scheduleData && (scheduleData.currentGame?.result || scheduleData.latestGame?.result);
    const hasMainAnswerSet = mainAnswer.includes('YES') || mainAnswer.includes('NO') || mainAnswer.includes('TIE');
    
    if (!isLive && !hasResultFromSchedule && !hasMainAnswerSet && liveData && !liveData.isLive && liveData.result) {
      // Only use liveData if scheduleData doesn't have the game data
      opponent = liveData.opponent || opponent;
      if (liveData.score?.lions !== undefined) {
        lionsScore = liveData.score.lions.toString();
      }
      if (liveData.score?.opponent !== undefined) {
        opponentScore = liveData.score.opponent.toString();
      }
      
      if (liveData.result === 'WIN') {
        mainAnswer = '✅ YES';
        mainAnswerColor = '#00aa00';
        gameResult = `🏈 Game Over: ${liveData.name}`;
      } else if (liveData.result === 'LOSS') {
        mainAnswer = '❌ NO';
        mainAnswerColor = '#cc0000';
        gameResult = `🏈 Game Over: ${liveData.name}`;
      } else if (liveData.result === 'TIE') {
        mainAnswer = '🤝 TIE';
        mainAnswerColor = '#ff8800';
        gameResult = `🏈 Game Over: ${liveData.name}`;
      }
    }

    // Update previous/latest/next games
    let prevGame = `🏈 Loading${loadingDots}`;
    let latestGame = `🏈 Loading${loadingDots}`;
    let nextGame = `🏈 Loading${loadingDots}`;

    if (scheduleData) {
      // Previous game
      if (scheduleData.previousGame) {
        const prev = scheduleData.previousGame;
        const prevDate = new Date(prev.date);
        const prevResult = prev.result === 'WIN' ? '✅' : prev.result === 'LOSS' ? '❌' : '🤝';
        const prevGameDate = prevDate.toLocaleDateString('en-US', {
          month: 'numeric',
          day: 'numeric',
          year: 'numeric'
        });
        prevGame = `${prevResult} ${prev.name} - ${prevGameDate} - Lions ${prev.score.lions}, ${prev.opponent} ${prev.score.opponent}`;
      }
      
      // Latest game
      if (scheduleData.latestGame) {
        const latest = scheduleData.latestGame;
        const latestDate = new Date(latest.date);
        const latestResult = latest.result === 'WIN' ? '✅' : latest.result === 'LOSS' ? '❌' : '🤝';
        const latestGameDate = latestDate.toLocaleDateString('en-US', {
          month: 'numeric',
          day: 'numeric',
          year: 'numeric'
        });
        latestGame = `${latestResult} ${latest.name} - ${latestGameDate} - Lions ${latest.score.lions}, ${latest.opponent} ${latest.score.opponent}`;
      }
      
      // Next game
      if (scheduleData.nextGame) {
        const next = scheduleData.nextGame;
        const nextDate = new Date(next.date);
        const now = new Date();
        
        // Check if this is a placeholder (no real game info)
        const isPlaceholder = !next.opponent || 
                              next.opponent === 'TBD' || 
                              next.name.includes('Regular Season') ||
                              !next.name.includes('Detroit Lions');
        
        // Only show the game if it's actually in the future (at least 1 hour from now)
        if (nextDate.getTime() > now.getTime() + (60 * 60 * 1000)) {
          if (isPlaceholder) {
            // It's a placeholder, show TBD message
            nextGame = '🏈 Next game TBD';
          } else {
            // It's a real game, show it
            const gameDate = nextDate.toLocaleDateString('en-US', {
              month: 'numeric',
              day: 'numeric',
              year: 'numeric'
            });
            nextGame = `🏈 ${next.name} - ${gameDate}`;
          }
        } else {
          // Game is in the past or too soon, show placeholder
          nextGame = '🏈 Next game TBD';
        }
      }
    }

    setGameData({
      mainAnswer,
      mainAnswerColor,
      gameResult,
      lionsScore,
      opponentScore,
      opponent,
      prevGame,
      latestGame,
      nextGame,
      isLive
    });
  }

  return (
    <>
      <main className={styles.main}>
      <div>
        <h1>Did The Detroit Lions Win?</h1>
        <div id="main-answer">
          <h2 id="main-answer-text" style={{ 
            color: gameData.mainAnswerColor, 
            fontSize: '2.5rem', 
            margin: '1rem 0' 
          }}>
            {gameData.mainAnswer}
          </h2>
        </div>
      </div>

      {/* Game content */}
      <div id="game-content">
        <div className="game-result" id="game-result">
          {gameData.gameResult}
        </div>
        
        <div className="game-score" id="game-score">
          <div className="score-display">
            <span className="lions-score" id="lions-score">{gameData.lionsScore}</span>
            <span className="score-separator">-</span>
            <span className="opponent-score" id="opponent-score">{gameData.opponentScore}</span>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        <div>
          <h3>Previous Game</h3>
          <div id="prev-game">{gameData.prevGame}</div>
        </div>
        <div>
          <h3>Latest Game</h3>
          <div id="latest-game">{gameData.latestGame}</div>
        </div>
        <div>
          <h3>Next Game</h3>
          <div id="next-game">{gameData.nextGame}</div>
        </div>
      </div>

      {/* Randomized image and fact */}
      <div style={{ textAlign: 'center', margin: '2rem 0' }}>
        <img src={selectedContent.image} alt="Lions win" style={{ maxWidth: '300px', height: 'auto' }} />
        <p style={{ marginTop: '1rem', fontSize: '1.2rem' }}>
          💡 {selectedContent.fact}
        </p>
      </div>

      {/* Last updated timestamp */}
      {lastUpdated && (
        <div style={{ 
          textAlign: 'center', 
          marginTop: '3rem', 
          paddingTop: '2rem',
          borderTop: '1px solid #e0e0e0',
          fontSize: '0.875rem',
          color: '#666'
        }}>
          <p>Last updated: {new Date(lastUpdated).toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short'
          })}</p>
        </div>
      )}

      </main>
    </>
  );
}
