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

// API endpoints
const API_BASE = 'https://7mnzh94kp5.execute-api.us-east-1.amazonaws.com/api';

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
        console.log('Loading live game data...');
        
        // Add minimum loading time to see animation
        const minLoadingTime = new Promise(resolve => setTimeout(resolve, 2000));
        
        // Load game status and live score data (with minimum loading time)
        const [statusResponse, liveResponse, scheduleResponse] = await Promise.all([
          fetch(`${API_BASE}/game-status`).catch((err) => {
            console.warn('Game status API failed:', err);
            return null;
          }),
          fetch(`${API_BASE}/live-score`).catch((err) => {
            console.warn('Live score API failed:', err);
            return null;
          }),
          fetch(`${API_BASE}/schedule`).catch((err) => {
            console.warn('Schedule API failed:', err);
            return null;
          }),
          minLoadingTime // Ensure minimum 2 second loading time
        ]);

        let statusData = null;
        let liveData = null;
        let scheduleData = null;

        if (statusResponse?.ok) {
          try {
            statusData = await statusResponse.json();
            console.log('Status data:', statusData);
          } catch (err) {
            console.warn('Failed to parse status data:', err);
          }
        } else {
          console.warn('Status response not ok:', statusResponse?.status);
        }

        if (liveResponse?.ok) {
          try {
            liveData = await liveResponse.json();
            console.log('Live data:', liveData);
          } catch (err) {
            console.warn('Failed to parse live data:', err);
          }
        } else {
          console.warn('Live response not ok:', liveResponse?.status);
        }

        if (scheduleResponse?.ok) {
          try {
            scheduleData = await scheduleResponse.json();
            console.log('Schedule data:', scheduleData);
            // Store the timestamp from the API response
            if (scheduleData.timestamp) {
              setLastUpdated(scheduleData.timestamp);
            }
          } catch (err) {
            console.warn('Failed to parse schedule data:', err);
          }
        } else {
          console.warn('Schedule response not ok:', scheduleResponse?.status);
        }

        // Update game data based on what we received
        updateGameDisplay(statusData, liveData, scheduleData);

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
            // Force use of gameToShow.opponent when available - don't fall back to old values
            if (gameToShow.opponent) {
              opponent = gameToShow.opponent;
            }
            if (gameToShow.score?.lions !== undefined && gameToShow.score?.lions !== null) {
              lionsScore = gameToShow.score.lions.toString();
            }
            if (gameToShow.score?.opponent !== undefined && gameToShow.score?.opponent !== null) {
              opponentScore = gameToShow.score.opponent.toString();
            }
            
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
    
    // Handle live data that's not live (completed) - only if we haven't already set a result from scheduleData
    // scheduleData.latestGame is more reliable, so prioritize that
    const hasResultFromSchedule = scheduleData && (scheduleData.currentGame?.result || scheduleData.latestGame?.result);
    if (!isLive && !hasResultFromSchedule && liveData && !liveData.isLive && liveData.result) {
      if (liveData.opponent) {
        opponent = liveData.opponent;
      }
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
