# 🚀 Deployment Guide

## Quick Start

### 1. Deploy App Runner

```bash
cd api-server
./deploy.sh
```

**Note:** Requires Docker Desktop. Takes ~8-15 minutes first time.

### 2. Get App Runner URL

```bash
cd api-server
./get-url.sh
```

### 3. Set GitHub Secret

#### Option A: GitHub Web UI
1. Go to: GitHub → Your Repo → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `NEXT_PUBLIC_APP_RUNNER_URL`
4. Value: Your App Runner URL (from Step 2)
5. Click "Add secret"

#### Option B: GitHub CLI
```bash
gh secret set NEXT_PUBLIC_APP_RUNNER_URL --body "https://YOUR_APP_RUNNER_URL"
```

**Important:** Secret name must be exactly `NEXT_PUBLIC_APP_RUNNER_URL` (case-sensitive)

### 4. Push to Master

```bash
git push origin master
```

GitHub Actions will automatically build and deploy using App Runner!

---

## Architecture

- **Development**: Local Next.js API routes (`/api/*`) - no cold starts
- **Production**: AWS App Runner - always warm, no cold starts
- **Fallback**: Lambda (if App Runner URL not set)

---

## API Endpoints

All endpoints available at App Runner URL:
- `GET /api/health` - Health check
- `GET /api/schedule` - Game schedule
- `GET /api/game-status` - Check if game is live
- `GET /api/live-score` - Live score updates

---

## Cost

- **App Runner**: ~$7-15/month (always warm)
- **S3 + CloudFront**: ~$1-2/month
- **Total**: ~$8-17/month

---

## Troubleshooting

### App Runner deployment fails?
- Check Docker is running: `docker ps`
- Check AWS credentials: `aws sts get-caller-identity`
- Check ECR permissions

### Frontend still uses Lambda?
- Verify `NEXT_PUBLIC_APP_RUNNER_URL` is set in GitHub Secrets
- Rebuild: `npm run build`
- Check browser console for API calls

---

## More Details

- **App Runner Setup**: See `APP_RUNNER_SETUP.md`
- **GitHub Actions**: See `GITHUB_ACTIONS_SETUP.md`
- **Domain Setup**: See `DOMAIN_SETUP.md`
- **Live Scores**: See `LIVE_SCORE_SETUP.md`

