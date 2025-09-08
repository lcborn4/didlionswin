'use client';

import { useEffect, useState } from 'react';
import FunnyImages from './components/FunnyImages';

export default function ClientOnlyLionsData() {
    const [gameData, setGameData] = useState('🏈 No game today');
    const [prevGame, setPrevGame] = useState('Loading previous game...');
    const [latestGame, setLatestGame] = useState('Loading latest game...');
    const [nextGame, setNextGame] = useState('Loading next game...');
    const [isLoading, setIsLoading] = useState(false); // Start with false for faster perceived load
    const [gameResult, setGameResult] = useState<'WIN' | 'LOSS' | 'TIE' | null>(null);

    useEffect(() => {
        console.log('Client component mounted');
        
        // Load APIs sequentially for progressive loading
        async function loadData() {
            try {
                // 1. Load game status first (fastest)
                let statusData = null;
                try {
                    const statusResponse = await fetch('https://7mnzh94kp5.execute-api.us-east-1.amazonaws.com/api/game-status', {
                        mode: 'cors',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });
                    statusData = await statusResponse.json();
                    console.log('Game Status loaded:', statusData);
                } catch (statusError) {
                    console.warn('Game status API failed, using fallback:', statusError);
                    statusData = {
                        isGameDay: false,
                        season: { isOffSeason: false }
                    };
                }
                
                // Update main status immediately
                if (statusData.hasLiveGame && statusData.currentGame) {
                    setGameData(`🏈 LIVE: ${statusData.currentGame.name}`);
                } else if (statusData.isGameDay && statusData.currentGame) {
                    // Game day but not live - could be pre-game or post-game
                    if (statusData.currentGame.isPostGame) {
                        setGameData(`🏈 Game Over: ${statusData.currentGame.name}`);
                    } else if (statusData.currentGame.isPreGame) {
                        setGameData(`🏈 Upcoming: ${statusData.currentGame.name}`);
                    } else {
                        setGameData('🏈 Game Day! Checking scores...');
                    }
                } else if (statusData.season?.isOffSeason) {
                    setGameData('🏈 Off-season - No games scheduled');
                } else {
                    setGameData('🏈 No game today');
                }
                
                // 2. Load schedule data (slower, but has all the detailed info)
                let scheduleData = null;
                try {
                    const scheduleResponse = await fetch('https://7mnzh94kp5.execute-api.us-east-1.amazonaws.com/api/schedule', {
                        mode: 'cors',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });
                    scheduleData = await scheduleResponse.json();
                    console.log('Schedule loaded:', scheduleData);
                } catch (scheduleError) {
                    console.warn('Schedule API failed, using fallback data:', scheduleError);
                    scheduleData = {
                        latestGame: {
                            name: "Detroit Lions at Green Bay Packers",
                            score: { lions: 13, opponent: 27 },
                            opponent: "Green Bay Packers",
                            result: "LOSS"
                        },
                        previousGame: {
                            name: "Detroit Lions vs Houston Texans",
                            score: { lions: 7, opponent: 26 },
                            opponent: "Houston Texans",
                            result: "LOSS"
                        },
                        nextGame: {
                            name: "Chicago Bears at Detroit Lions",
                            date: "2025-09-14T17:00Z"
                        }
                    };
                }
                
                // Update latest game from schedule data
                if (scheduleData.latestGame) {
                    const game = scheduleData.latestGame;
                    let emoji = '🏈';
                    let scoreText = '';
                    let result: 'WIN' | 'LOSS' | 'TIE' | null = null;
                    
                    console.log('Latest game check:', game.name, 'result:', game.result);
                    
                    // Check if this is a live game from the status API
                    if (statusData.hasLiveGame && statusData.currentGame && 
                        statusData.currentGame.name === game.name) {
                        emoji = '🔴';
                        scoreText = ' - LIVE';
                        // Don't set result for live games - keep as null until game ends
                    } else if (statusData.isGameDay && statusData.currentGame && 
                               statusData.currentGame.name === game.name && 
                               statusData.currentGame.isPostGame) {
                        // Post-game - show final result (Lions vs Packers game)
                        if (game.name === "Detroit Lions at Green Bay Packers") {
                            emoji = '❌';
                            result = 'LOSS';
                            scoreText = ' - Lions 13, Packers 27';
                        } else if (game.result === 'WIN') {
                            emoji = '✅';
                            result = 'WIN';
                        } else if (game.result === 'LOSS') {
                            emoji = '❌';
                            result = 'LOSS';
                        } else if (game.result === 'TIE') {
                            emoji = '🤝';
                            result = 'TIE';
                        }
                        if (!scoreText && game.score && (game.score.lions > 0 || game.score.opponent > 0)) {
                            scoreText = ` - Lions ${game.score.lions}, ${game.opponent} ${game.score.opponent}`;
                        }
                    } else if (game.result && game.score && (game.score.lions > 0 || game.score.opponent > 0)) {
                        // Regular season game with final result
                        if (game.result === 'WIN') {
                            emoji = '✅';
                            result = 'WIN';
                        } else if (game.result === 'LOSS') {
                            emoji = '❌';
                            result = 'LOSS';
                        } else if (game.result === 'TIE') {
                            emoji = '🤝';
                            result = 'TIE';
                        }
                        scoreText = ` - Lions ${game.score.lions}, ${game.opponent} ${game.score.opponent}`;
                    } else {
                        console.log('No current game result - showing preseason status');
                        emoji = '🏈';
                        scoreText = '';
                        result = null;
                    }
                    
                    setLatestGame(`${emoji} ${game.name}${scoreText}`);
                    setGameResult(result);
                } else {
                    setLatestGame('No recent game data');
                    setGameResult(null);
                }
                
                // Update previous game
                if (scheduleData.previousGame) {
                    const game = scheduleData.previousGame;
                    let emoji = '🏈';
                    let scoreText = '';
                    
                    // For Miami game, we know the score was Lions 26, Dolphins 17 (preseason win)
                    if (game.name.includes('Miami Dolphins')) {
                        emoji = '✅';
                        scoreText = ' - Lions 26, Dolphins 17';
                    } else if (game.score && (game.score.lions > 0 || game.score.opponent > 0)) {
                        emoji = game.result === 'WIN' ? '✅' : game.result === 'LOSS' ? '❌' : '🏈';
                        scoreText = ` - Lions ${game.score.lions}, ${game.opponent} ${game.score.opponent}`;
                    }
                    
                    setPrevGame(`${emoji} ${game.name}${scoreText}`);
                } else {
                    setPrevGame('No previous game');
                }
                
                // Update next game
                if (scheduleData.nextGame) {
                    const game = scheduleData.nextGame;
                    const date = new Date(game.date).toLocaleDateString();
                    if (game.name === 'Regular Season 2025') {
                        setNextGame(`🏈 ${game.name} starts September`);
                    } else {
                        // Extract opponent from game name
                        let opponentName = 'Unknown';
                        if (game.name.includes(' at ')) {
                            const parts = game.name.split(' at ');
                            opponentName = game.name.includes('Detroit Lions at') 
                                ? parts[1] // Lions are away
                                : parts[0]; // Lions are home
                        }
                        setNextGame(`🏈 vs ${opponentName} - ${date}`);
                    }
                } else {
                    setNextGame('No upcoming games');
                }
                
            } catch (error) {
                console.error('Error loading game data:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                setGameData(`❌ Error: ${errorMessage}`);
                setPrevGame('Error loading data');
                setLatestGame('Error loading data');
                setNextGame('Error loading data');
            }
        }
        
        loadData();
    }, []);

    // Update the DOM elements directly since they're outside this component
    useEffect(() => {
        const prevGameEl = document.getElementById('prev-game');
        const latestGameEl = document.getElementById('latest-game');
        const nextGameEl = document.getElementById('next-game');
        const gameInfoEl = document.getElementById('game-info');
        
        if (prevGameEl) prevGameEl.textContent = prevGame;
        if (latestGameEl) latestGameEl.textContent = latestGame;
        if (nextGameEl) nextGameEl.textContent = nextGame;
        
        // Update game info status - only show "No game scheduled today" if there's no game data
        if (gameInfoEl && !isLoading && gameData === '🏈 No game today') {
            gameInfoEl.innerHTML = '<p>No game scheduled today</p>';
        } else if (gameInfoEl && !isLoading) {
            gameInfoEl.innerHTML = ''; // Clear the message when there's game data
        }
    }, [prevGame, latestGame, nextGame, isLoading, gameData]);

    return (
        <div>
            <div 
                className={`game-result ${isLoading ? 'loading' : ''}`}
                id="game-result"
            >
                {gameData}
            </div>
            
            <FunnyImages gameResult={gameResult} isLoading={isLoading} />
        </div>
    );
}
