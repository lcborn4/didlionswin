// Express server for AWS App Runner
// Combines all API endpoints into a single always-warm service

import express from 'express';
import cors from 'cors';
import { handler as scheduleHandler } from '../api/schedule.js';
import { handler as liveScoreHandler } from '../api/live-score.js';
import { handler as gameStatusHandler } from '../api/game-status.js';
import { handler as healthHandler } from '../api/health.js';

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  maxAge: 86400
}));

app.use(express.json());

// Convert Lambda event to Express request format
function lambdaToExpress(req, res, handler) {
  const event = {
    httpMethod: req.method,
    path: req.path,
    pathParameters: req.params,
    queryStringParameters: req.query,
    headers: req.headers,
    body: req.body ? JSON.stringify(req.body) : null,
    requestContext: {
      http: {
        method: req.method,
        path: req.path
      }
    }
  };

  const context = {};

  handler(event, context)
    .then(response => {
      // Set headers
      if (response.headers) {
        Object.keys(response.headers).forEach(key => {
          res.setHeader(key, response.headers[key]);
        });
      }

      // Set status code
      res.status(response.statusCode || 200);

      // Send body
      if (response.body) {
        try {
          const body = JSON.parse(response.body);
          res.json(body);
        } catch (e) {
          res.send(response.body);
        }
      } else {
        res.end();
      }
    })
    .catch(error => {
      console.error('Handler error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  lambdaToExpress(req, res, healthHandler);
});

// Schedule endpoint
app.get('/api/schedule', (req, res) => {
  lambdaToExpress(req, res, scheduleHandler);
});

// Live score endpoint
app.get('/api/live-score', (req, res) => {
  lambdaToExpress(req, res, liveScoreHandler);
});

// Game status endpoint
app.get('/api/game-status', (req, res) => {
  lambdaToExpress(req, res, gameStatusHandler);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Did Lions Win API',
    status: 'running',
    endpoints: [
      '/api/health',
      '/api/schedule',
      '/api/live-score',
      '/api/game-status'
    ],
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server running on port ${PORT}`);
  console.log(`📡 Endpoints available:`);
  console.log(`   - GET /api/health`);
  console.log(`   - GET /api/schedule`);
  console.log(`   - GET /api/live-score`);
  console.log(`   - GET /api/game-status`);
});



