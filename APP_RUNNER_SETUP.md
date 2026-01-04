# 🚀 App Runner Setup Guide

## Quick Start

### 1. Deploy App Runner

```bash
cd api-server
./deploy.sh
```

This will:
- Build the Docker image
- Push to ECR
- Create/update the App Runner service
- Take ~5-10 minutes for first deployment

### 2. Get Your App Runner URL

After deployment completes, get the service URL:

```bash
aws apprunner list-services \
  --query "ServiceSummaryList[?ServiceName=='didlionswin-api'].ServiceUrl" \
  --output text \
  --region us-east-1
```

The URL will look like: `https://xxxxx.us-east-1.awsapprunner.com`

### 3. Set Environment Variable

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_APP_RUNNER_URL=https://xxxxx.us-east-1.awsapprunner.com
```

Or set it in your deployment environment (GitHub Actions, Vercel, etc.)

### 4. Rebuild Your Frontend

```bash
npm run build
```

The frontend will now use App Runner in production!

---

## How It Works

### Development (localhost)
- Uses local Next.js API routes (`/api/*`)
- No cold starts, instant responses
- Perfect for development

### Production
- Uses App Runner URL (if set)
- Falls back to Lambda if App Runner URL not set
- App Runner is always warm = no cold starts!

---

## API Endpoints

All endpoints are available at your App Runner URL:

- `GET /api/health` - Health check
- `GET /api/schedule` - Get game schedule
- `GET /api/game-status` - Check if game is live
- `GET /api/live-score` - Get live score updates

Example:
```
https://xxxxx.us-east-1.awsapprunner.com/api/schedule
```

---

## Cost Monitoring

App Runner costs:
- **Base**: ~$7-10/month (0.5 vCPU + 1GB RAM)
- **Traffic**: ~$0.007 per GB
- **Total**: ~$7-15/month for typical usage

Monitor costs in AWS Console:
- App Runner → didlionswin-api → Metrics

---

## Troubleshooting

### Service Not Starting
```bash
# Check service status
aws apprunner describe-service \
  --service-arn $(aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='didlionswin-api'].ServiceArn" --output text) \
  --region us-east-1

# Check logs
aws apprunner list-operations \
  --service-arn <SERVICE_ARN> \
  --region us-east-1
```

### Health Check Failing
- Verify `/api/health` endpoint works locally
- Check Dockerfile health check configuration
- Review App Runner service logs

### CORS Issues
- App Runner server already has CORS configured
- Should work out of the box
- If issues, check `api-server/server.js` CORS settings

---

## Updating the Service

To update after code changes:

```bash
cd api-server
./deploy.sh
```

App Runner will automatically:
1. Build new Docker image
2. Deploy new version
3. Switch traffic to new version
4. Keep old version for rollback

---

## Benefits Over Lambda

✅ **No Cold Starts** - Always warm, instant responses  
✅ **Simpler** - One service instead of 3 Lambda functions  
✅ **Better Caching** - Shared in-memory cache across endpoints  
✅ **Easier Debugging** - Single Express server, easier logs  
✅ **Consistent Performance** - No variance from cold starts  

---

## Next Steps

1. ✅ Deploy App Runner
2. ✅ Get the URL
3. ✅ Set `NEXT_PUBLIC_APP_RUNNER_URL` environment variable
4. ✅ Rebuild and deploy frontend
5. ✅ Test and enjoy instant API responses!

