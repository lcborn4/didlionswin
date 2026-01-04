#!/bin/bash
# Quick script to get your App Runner service URL

SERVICE_NAME="didlionswin-api"
REGION="us-east-1"

echo "🔍 Getting App Runner service URL for: $SERVICE_NAME"
echo ""

# Get the service URL
URL=$(aws apprunner list-services \
  --region $REGION \
  --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].ServiceUrl" \
  --output text 2>/dev/null)

if [ -z "$URL" ]; then
  echo "❌ Service not found. Make sure you've deployed it first:"
  echo "   cd api-server && ./deploy.sh"
  exit 1
fi

echo "✅ App Runner URL:"
echo ""
echo "   $URL"
echo ""
echo "📝 Add this to your .env.local file:"
echo ""
echo "   NEXT_PUBLIC_APP_RUNNER_URL=$URL"
echo ""
echo "🔗 Test endpoints:"
echo "   $URL/api/health"
echo "   $URL/api/schedule"
echo "   $URL/api/game-status"
echo "   $URL/api/live-score"

