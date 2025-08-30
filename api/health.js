// Health Check API - Simple endpoint to verify API is working
export const handler = async (event, context) => {
    try {
        const health = {
            status: 'OK',
            service: 'didlionswin-api',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            region: process.env.AWS_REGION || 'us-east-1',
            endpoints: {
                liveScore: '/api/live-score',
                gameStatus: '/api/game-status',
                health: '/api/health'
            },
            uptime: process.uptime(),
            memory: process.memoryUsage()
        };

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Cache-Control': 'no-cache'
            },
            body: JSON.stringify(health)
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                status: 'ERROR',
                error: error.message,
                timestamp: new Date().toISOString()
            })
        };
    }
};
