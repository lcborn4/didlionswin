'use client';

import { useEffect, useState, useRef } from 'react';
import FunnyImages from './components/FunnyImages';

interface GameStatus {
    hasLiveGame: boolean;
    isGameDay: boolean;
    currentGame: any;
    nextGame: any;
    shouldPoll: boolean;
    pollInterval: number;
    season: {
        isOffSeason: boolean;
        type: string;
    };
    timestamp: string;
}

interface ScheduleData {
    previousGame: any;
    currentGame: any;
    latestGame: any;
    nextGame: any;
    season: {
        type: string;
        year: number;
    };
    timestamp: string;
}

export default function DynamicLionsData() {
    const [gameStatus, setGameStatus] = useState<GameStatus | null>(null);
    const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isPollingRef = useRef(false);

    // Determine the main answer based on current data
    const getMainAnswer = () => {
        if (error) {
            return { text: '❓ ERROR', color: '#cc0000' };
        }

        if (isLoading || (!gameStatus && !scheduleData)) {
            return { text: '⏳ Loading...', color: '#666666' };
        }

        // Check for live game first
        if (gameStatus?.hasLiveGame) {
            return { text: '🔴 LIVE', color: '#ff0000' };
        }

        // Check for today's game status
        if (gameStatus?.isGameDay && gameStatus.currentGame) {
            if (gameStatus.currentGame.isPreGame) {
                return { text: '⏰ SOON', color: '#0066cc' };
            } else if (gameStatus.currentGame.isPostGame) {
                // Game just finished, show result from latest game
                const latestGame = scheduleData?.latestGame;
                if (latestGame?.result === 'WIN') {
                    return { text: '✅ YES', color: '#00aa00' };
                } else if (latestGame?.result === 'LOSS') {
                    return { text: '❌ NO', color: '#cc0000' };
                } else if (latestGame?.result === 'TIE') {
                    return { text: '🤝 TIE', color: '#ff8800' };
                }
            }
        }

        // Check latest completed game
        const latestGame = scheduleData?.latestGame;
        if (latestGame?.result) {
            if (latestGame.result === 'WIN') {
                return { text: '✅ YES', color: '#00aa00' };
            } else if (latestGame.result === 'LOSS') {
                return { text: '❌ NO', color: '#cc0000' };
            } else if (latestGame.result === 'TIE') {
                return { text: '🤝 TIE', color: '#ff8800' };
            }
        }

        // Check if it's a bye week or off-season
        if (gameStatus?.season?.isOffSeason) {
            return { text: '😴 OFF-SEASON', color: '#666666' };
        }

        // Check if next game is far away (likely bye week)
        if (scheduleData?.nextGame) {
            const nextGameDate = new Date(scheduleData.nextGame.date);
            const today = new Date();
            const daysUntilNext = (nextGameDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
            
            if (daysUntilNext > 7) {
                return { text: '😴 BYE WEEK', color: '#666666' };
            }
        }

        // Default fallback
        return { text: '❓ ?', color: '#666666' };
    };

    // Fetch data from APIs
    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Fetch both APIs in parallel
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
                throw new Error(`API Error: Status ${statusResponse.status}, Schedule ${scheduleResponse.status}`);
            }

            const statusData = await statusResponse.json();
            const scheduleData = await scheduleResponse.json();

            setGameStatus(statusData);
            setScheduleData(scheduleData);

            console.log('Data loaded:', { statusData, scheduleData });

            // Set up polling if needed
            setupPolling(statusData);

        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
            
            // Set fallback data
            setGameStatus({
                hasLiveGame: false,
                isGameDay: false,
                currentGame: null,
                nextGame: null,
                shouldPoll: false,
                pollInterval: 300000,
                season: { isOffSeason: false, type: 'Regular Season' },
                timestamp: new Date().toISOString()
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Set up intelligent polling
    const setupPolling = (statusData: GameStatus) => {
        // Clear existing polling
        if (pollTimeoutRef.current) {
            clearTimeout(pollTimeoutRef.current);
            pollTimeoutRef.current = null;
        }

        if (!statusData.shouldPoll || isPollingRef.current) {
            return;
        }

        const pollInterval = statusData.pollInterval || 300000; // Default 5 minutes
        
        console.log(`Setting up polling with ${pollInterval}ms interval`);

        const poll = () => {
            if (isPollingRef.current) return;
            
            isPollingRef.current = true;
            fetchData().finally(() => {
                isPollingRef.current = false;
                
                // Schedule next poll
                pollTimeoutRef.current = setTimeout(poll, pollInterval);
            });
        };

        // Start polling after the interval
        pollTimeoutRef.current = setTimeout(poll, pollInterval);
    };

    // Initial data fetch
    useEffect(() => {
        fetchData();

        // Cleanup polling on unmount
        return () => {
            if (pollTimeoutRef.current) {
                clearTimeout(pollTimeoutRef.current);
            }
            isPollingRef.current = false;
        };
    }, []);

    // Update DOM elements
    useEffect(() => {
        if (!scheduleData) return;

        // Update game info
        const gameResultEl = document.getElementById('game-result');
        const lionsScoreEl = document.getElementById('lions-score');
        const opponentScoreEl = document.getElementById('opponent-score');
        const prevGameEl = document.getElementById('prev-game');
        const latestGameEl = document.getElementById('latest-game');
        const nextGameEl = document.getElementById('next-game');

        // Update main game status
        if (gameResultEl) {
            if (gameStatus?.hasLiveGame && gameStatus.currentGame) {
                gameResultEl.textContent = `🔴 LIVE: ${gameStatus.currentGame.name}`;
            } else if (gameStatus?.isGameDay && gameStatus.currentGame) {
                if (gameStatus.currentGame.isPostGame) {
                    gameResultEl.textContent = `🏈 Game Over: ${gameStatus.currentGame.name}`;
                } else if (gameStatus.currentGame.isPreGame) {
                    gameResultEl.textContent = `⏰ Upcoming: ${gameStatus.currentGame.name}`;
                } else {
                    gameResultEl.textContent = '🏈 Game Day!';
                }
            } else if (gameStatus?.season?.isOffSeason) {
                gameResultEl.textContent = '🏈 Off-season - No games scheduled';
            } else {
                gameResultEl.textContent = '🏈 No game today';
            }
        }

        // Update scores
        const latestGame = scheduleData.latestGame;
        if (latestGame && latestGame.score) {
            if (lionsScoreEl) lionsScoreEl.textContent = latestGame.score.lions.toString();
            if (opponentScoreEl) opponentScoreEl.textContent = latestGame.score.opponent.toString();
        }

        // Update game list
        if (prevGameEl && scheduleData.previousGame) {
            const game = scheduleData.previousGame;
            const emoji = game.result === 'WIN' ? '✅' : game.result === 'LOSS' ? '❌' : '🏈';
            const scoreText = game.score && (game.score.lions > 0 || game.score.opponent > 0) 
                ? ` - Lions ${game.score.lions}, ${game.opponent} ${game.score.opponent}`
                : '';
            prevGameEl.textContent = `${emoji} ${game.name}${scoreText}`;
        }

        if (latestGameEl && latestGame) {
            const emoji = latestGame.result === 'WIN' ? '✅' : latestGame.result === 'LOSS' ? '❌' : '🏈';
            const scoreText = latestGame.score && (latestGame.score.lions > 0 || latestGame.score.opponent > 0) 
                ? ` - Lions ${latestGame.score.lions}, ${latestGame.opponent} ${latestGame.score.opponent}`
                : '';
            latestGameEl.textContent = `${emoji} ${latestGame.name}${scoreText}`;
        }

        if (nextGameEl && scheduleData.nextGame) {
            const game = scheduleData.nextGame;
            const date = new Date(game.date).toLocaleDateString();
            if (game.name === 'Regular Season 2025') {
                nextGameEl.textContent = `🏈 ${game.name} starts September`;
            } else {
                const opponent = game.opponent || 'Unknown';
                nextGameEl.textContent = `🏈 vs ${opponent} - ${date}`;
            }
        }

    }, [gameStatus, scheduleData]);

    const mainAnswer = getMainAnswer();

    // Determine game result for images/facts
    const gameResult = (() => {
        if (gameStatus?.hasLiveGame) return null; // Don't show images during live games
        
        const latestGame = scheduleData?.latestGame;
        if (latestGame?.result) {
            return latestGame.result as 'WIN' | 'LOSS' | 'TIE';
        }
        return null;
    })();

    return (
        <div>
            <h2 style={{ 
                color: mainAnswer.color, 
                fontSize: '2.5rem', 
                margin: '1rem 0' 
            }}>
                {mainAnswer.text}
            </h2>
            
            <FunnyImages gameResult={gameResult} isLoading={isLoading} />
            
            {/* Debug info in development */}
            {process.env.NODE_ENV === 'development' && (
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '1rem' }}>
                    <div>Status: {gameStatus ? 'Loaded' : 'Loading...'}</div>
                    <div>Schedule: {scheduleData ? 'Loaded' : 'Loading...'}</div>
                    <div>Polling: {gameStatus?.shouldPoll ? `Every ${Math.round((gameStatus.pollInterval || 0) / 1000)}s` : 'No'}</div>
                    <div>Last Update: {gameStatus?.timestamp ? new Date(gameStatus.timestamp).toLocaleTimeString() : 'Never'}</div>
                </div>
            )}
        </div>
    );
}
