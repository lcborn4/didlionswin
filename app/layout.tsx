export default function RootLayout({
    // Layouts must accept a children prop.
    // This will be populated with nested layouts or pages
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <style>{`
                    .game-result {
                        font-size: 3rem;
                        font-weight: bold;
                        text-align: center;
                        margin: 2rem 0;
                        padding: 1rem;
                        border-radius: 8px;
                        background: #f5f5f5;
                    }
                    
                    .game-result.loading {
                        color: #666;
                        animation: pulse 2s infinite;
                    }
                    
                    .game-result.win {
                        color: #00cc00;
                        background: #e8f5e8;
                    }
                    
                    .game-result.loss {
                        color: #cc0000;
                        background: #ffe8e8;
                    }
                    
                    .game-result.in-progress {
                        color: #ff6600;
                        background: #fff3e0;
                        animation: pulse 2s infinite;
                    }
                    
                    .game-info {
                        text-align: center;
                        margin: 1rem 0;
                        padding: 1rem;
                        background: #f9f9f9;
                        border-radius: 4px;
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
                    
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.7; }
                    }
                `}</style>
            </head>
            <body>
                {children}

            </body>
        </html>
    );
}