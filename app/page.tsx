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
  { image: '/images/good/out.gif', fact: 'The Detroit Lions All-time Rushing Leader: Barry Sanders 3,062 att, 15,269 yds, 99 TD' }
];

// API endpoints
const API_BASE = 'https://7mnzh94kp5.execute-api.us-east-1.amazonaws.com/api';

// Client-side randomization and live data using React hooks
export default function Home() {
  const [selectedContent, setSelectedContent] = useState(imageFacts[0]);
  const [gameData, setGameData] = useState({
    mainAnswer: '🏈 Loading...',
    mainAnswerColor: '#666',
    gameResult: '🏈 Loading game data...',
    lionsScore: '--',
    opponentScore: '--',
    opponent: 'Loading...',
    prevGame: '🏈 Loading...',
    latestGame: '🏈 Loading...',
    nextGame: '🏈 Loading...',
    isLive: false
  });
  const [loading, setLoading] = useState(true);

  // Load live game data
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;

    async function loadLiveData() {
      try {
        console.log('Loading live game data...');
        
        // Load game status and live score data
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
          })
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
        // Fallback to static data (Ravens game result)
        setGameData({
          mainAnswer: '✅ YES',
          mainAnswerColor: '#00aa00',
          gameResult: '🏈 Game Over: Detroit Lions at Baltimore Ravens',
          lionsScore: '38',
          opponentScore: '30',
          opponent: 'Ravens',
          prevGame: '✅ Chicago Bears at Detroit Lions - Lions 52, Bears 21',
          latestGame: '✅ Detroit Lions at Baltimore Ravens - Lions 38, Ravens 30',
          nextGame: '🏈 Cleveland Browns at Detroit Lions - 9/28/2025',
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
    let mainAnswer = '🏈 Loading...';
    let mainAnswerColor = '#666';
    let gameResult = '🏈 Loading game data...';
    let lionsScore = '--';
    let opponentScore = '--';
    let opponent = 'Loading...';
    let isLive = false;

    // Prioritize schedule data for current/latest game info
    if (scheduleData && scheduleData.currentGame) {
      const currentGame = scheduleData.currentGame;
      opponent = currentGame.opponent;
      lionsScore = currentGame.score.lions.toString();
      opponentScore = currentGame.score.opponent.toString();
      
      if (currentGame.result === 'WIN') {
        mainAnswer = '✅ YES';
        mainAnswerColor = '#00aa00';
        gameResult = `🏈 Game Over: ${currentGame.name}`;
      } else if (currentGame.result === 'LOSS') {
        mainAnswer = '❌ NO';
        mainAnswerColor = '#cc0000';
        gameResult = `🏈 Game Over: ${currentGame.name}`;
      } else if (currentGame.result === 'TIE') {
        mainAnswer = '🤝 TIE';
        mainAnswerColor = '#ff8800';
        gameResult = `🏈 Game Over: ${currentGame.name}`;
      }
    }
    // Check if we have live game data (for live games only)
    else if (liveData && liveData.result && liveData.isLive) {
      isLive = liveData.isLive;
      opponent = liveData.opponent;
      lionsScore = liveData.score.lions.toString();
      opponentScore = liveData.score.opponent.toString();
      
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
      } else if (isLive) {
        mainAnswer = '🔴 LIVE';
        mainAnswerColor = '#ff0000';
        gameResult = `🏈 LIVE: ${liveData.name}`;
      }
    } else if (statusData) {
      // Use status data if no live data
      if (statusData.hasLiveGame && statusData.currentGame) {
        isLive = true;
        mainAnswer = '🔴 LIVE';
        mainAnswerColor = '#ff0000';
        gameResult = `🏈 LIVE: ${statusData.currentGame.name}`;
      } else if (statusData.isGameDay && statusData.currentGame) {
        if (statusData.currentGame.isPostGame) {
          gameResult = `🏈 Game Over: ${statusData.currentGame.name}`;
          // We'd need more data to determine win/loss
        } else if (statusData.currentGame.isPreGame) {
          gameResult = `🏈 Upcoming: ${statusData.currentGame.name}`;
          mainAnswer = '⏰ SOON';
          mainAnswerColor = '#ff8800';
        }
      } else if (statusData.season?.isOffSeason) {
        mainAnswer = '🏈 OFF-SEASON';
        mainAnswerColor = '#666';
        gameResult = '🏈 Off-season - No games scheduled';
      } else {
        mainAnswer = '🏈 NO GAME';
        mainAnswerColor = '#666';
        gameResult = '🏈 No game today';
      }
    }

    // Update previous/latest/next games
    let prevGame = '🏈 Loading...';
    let latestGame = '🏈 Loading...';
    let nextGame = '🏈 Loading...';

    if (scheduleData) {
      // Previous game
      if (scheduleData.previousGame) {
        const prev = scheduleData.previousGame;
        const prevResult = prev.result === 'WIN' ? '✅' : prev.result === 'LOSS' ? '❌' : '🤝';
        prevGame = `${prevResult} ${prev.name} - Lions ${prev.score.lions}, ${prev.opponent} ${prev.score.opponent}`;
      }
      
      // Latest game
      if (scheduleData.latestGame) {
        const latest = scheduleData.latestGame;
        const latestResult = latest.result === 'WIN' ? '✅' : latest.result === 'LOSS' ? '❌' : '🤝';
        latestGame = `${latestResult} ${latest.name} - Lions ${latest.score.lions}, ${latest.opponent} ${latest.score.opponent}`;
      }
      
      // Next game
      if (scheduleData.nextGame) {
        const next = scheduleData.nextGame;
        const gameDate = new Date(next.date).toLocaleDateString('en-US', {
          month: 'numeric',
          day: 'numeric',
          year: 'numeric'
        });
        nextGame = `🏈 ${next.name} - ${gameDate}`;
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

      </main>
    </>
  );
}
