'use client';

import { useEffect, useState } from 'react';

export default function TestSimple() {
    const [message, setMessage] = useState('Loading...');

    useEffect(() => {
        console.log('Test component mounted');
        setMessage('Test component is working!');
        
        // Test API call
        fetch('https://7mnzh94kp5.execute-api.us-east-1.amazonaws.com/api/game-status', {
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log('API response:', data);
            if (data.isGameDay && data.currentGame) {
                setMessage(`Game Day: ${data.currentGame.name} - ${data.currentGame.isPostGame ? 'POST GAME' : 'LIVE'}`);
            } else {
                setMessage('No game today');
            }
        })
        .catch(error => {
            console.error('API error:', error);
            setMessage(`Error: ${error.message}`);
        });
    }, []);

    return (
        <div style={{ padding: '20px', border: '2px solid red', margin: '20px' }}>
            <h2>Test Component</h2>
            <p>{message}</p>
        </div>
    );
}
