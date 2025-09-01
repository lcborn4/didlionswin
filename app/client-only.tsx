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
                if (statusData.isGameDay) {
                    setGameData('🏈 Game Day! Checking scores...');
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
                            name: "Preseason 2024 - No current result",
                            score: null,
                            opponent: "Preseason",
                            result: null
                        },
                        previousGame: {
                            name: "Preseason 2024 - No current result", 
                            score: null,
                            opponent: "Preseason",
                            result: null
                        },
                        nextGame: {
                            name: "Regular Season 2025",
                            date: "2025-09-07T00:00Z"
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
                    
                    // Only set result if there's an actual game result (not preseason)
                    if (game.result && game.score && (game.score.lions > 0 || game.score.opponent > 0)) {
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
        
        // Update game info status
        if (gameInfoEl && !isLoading) {
            gameInfoEl.innerHTML = '<p>No game scheduled today</p>';
        }
    }, [prevGame, latestGame, nextGame, isLoading]);

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
