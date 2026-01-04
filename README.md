# Did The Detroit Lions Win?

A Next.js app that shows whether the Detroit Lions won their latest game, with live score updates during games.

## Getting Started

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions.

## Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guide (App Runner setup)
- **[APP_RUNNER_SETUP.md](./APP_RUNNER_SETUP.md)** - Detailed App Runner configuration
- **[GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md)** - GitHub Actions automation
- **[LIVE_SCORE_SETUP.md](./LIVE_SCORE_SETUP.md)** - Live score feature documentation
- **[DOMAIN_SETUP.md](./DOMAIN_SETUP.md)** - Custom domain configuration
- **[Documentation/NextJs.md](./Documentation/NextJs.md)** - Next.js framework info

## Architecture

- **Frontend**: Next.js (static export to S3 + CloudFront)
- **API**: AWS App Runner (always warm, no cold starts)
- **Development**: Local Next.js API routes
- **Deployment**: Automated via GitHub Actions
