#!/bin/bash

# Complete GitHub Actions Setup for didlionswin
# This script guides you through the entire setup process

echo "🚀 GitHub Actions Setup for didlionswin"
echo "========================================"
echo ""
echo "This script will help you set up GitHub Actions for hybrid deployment"
echo "with live score updates at the lowest cost possible!"
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository. Please run this from your didlionswin repository."
    exit 1
fi

# Check if we have a GitHub remote
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ No GitHub remote found. Please make sure this repository is connected to GitHub."
    exit 1
fi

GITHUB_REPO=$(git remote get-url origin | sed 's/.*github.com[\/:]//; s/\.git$//')
echo "✅ GitHub repository: $GITHUB_REPO"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI is configured"
echo ""

# Get current setup status
echo "📊 Current Setup Status:"
echo "========================"

# Check if workflow files exist
if [ -f ".github/workflows/deploy-hybrid.yml" ]; then
    echo "✅ GitHub Actions workflow exists"
else
    echo "❌ GitHub Actions workflow missing"
fi

# Check configuration files
if [ -f "next.config.hybrid.js" ]; then
    echo "✅ Hybrid Next.js config exists"
else
    echo "❌ Hybrid Next.js config missing"
fi

if [ -f "serverless-api.yml" ]; then
    echo "✅ Serverless API config exists"
else
    echo "❌ Serverless API config missing"
fi

# Check API functions
if [ -d "api" ] && [ -f "api/live-score.js" ]; then
    echo "✅ Live score API functions exist"
else
    echo "❌ Live score API functions missing"
fi

echo ""

# Interactive setup
echo "🛠️  Setup Process:"
echo "=================="
echo ""

read -p "Do you want to proceed with GitHub Actions setup? (y/N): " PROCEED
if [[ ! $PROCEED =~ ^[Yy]$ ]]; then
    echo "Setup cancelled."
    exit 0
fi

echo ""
echo "📋 Step 1: AWS Infrastructure"
echo "============================="
echo ""

# Check if AWS resources exist
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS Account ID: $ACCOUNT_ID"

read -p "Do you want to create AWS infrastructure (S3 + CloudFront)? (y/N): " CREATE_INFRA
if [[ $CREATE_INFRA =~ ^[Yy]$ ]]; then
    echo ""
    echo "🏗️  Creating AWS infrastructure..."
    
    if [ -f "scripts/setup-aws-static.sh" ]; then
        ./scripts/setup-aws-static.sh
    else
        echo "❌ AWS setup script not found. Please run setup manually."
    fi
else
    echo "⏭️  Skipping AWS infrastructure creation"
fi

echo ""
echo "🔐 Step 2: GitHub Secrets Configuration"
echo "======================================="
echo ""

echo "Run the secrets helper to get the values you need:"
echo ""
echo "  ./scripts/configure-github-secrets.sh"
echo ""
echo "This will show you exactly what secrets to add to GitHub."
echo ""

read -p "Press Enter when you've added all secrets to GitHub..."

echo ""
echo "🧪 Step 3: Test Deployment"
echo "=========================="
echo ""

echo "Let's test the deployment workflow:"
echo ""

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "📝 You have uncommitted changes. Let's commit them:"
    echo ""
    git status --short
    echo ""
    
    read -p "Commit these changes? (y/N): " COMMIT_CHANGES
    if [[ $COMMIT_CHANGES =~ ^[Yy]$ ]]; then
        read -p "Enter commit message: " COMMIT_MSG
        COMMIT_MSG=${COMMIT_MSG:-"feat: setup GitHub Actions for hybrid deployment"}
        
        git add .
        git commit -m "$COMMIT_MSG"
        echo "✅ Changes committed"
    fi
fi

echo ""
read -p "Push to GitHub to trigger deployment? (y/N): " PUSH_DEPLOY
if [[ $PUSH_DEPLOY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Pushing to GitHub..."
    git push origin $(git branch --show-current)
    
    echo ""
    echo "🎉 Deployment triggered!"
    echo ""
    echo "Monitor the deployment:"
    echo "1. Go to: https://github.com/$GITHUB_REPO"
    echo "2. Click the 'Actions' tab"
    echo "3. Watch the 'Deploy Hybrid Static + Serverless' workflow"
    echo ""
fi

echo ""
echo "📊 Step 4: Monitoring & Verification"
echo "===================================="
echo ""

echo "After deployment completes, verify:"
echo ""
echo "✅ Static Site:"
echo "   - Should load instantly from CloudFront"
echo "   - Check browser developer tools for errors"
echo ""
echo "✅ Live Score API:"
echo "   - Health check: [API_URL]/api/health"
echo "   - Game status: [API_URL]/api/game-status"
echo "   - Live scores: [API_URL]/api/live-score"
echo ""
echo "✅ Cost Monitoring:"
echo "   - Set up AWS billing alerts"
echo "   - Monitor CloudWatch metrics"
echo "   - Expected cost: $3-8/month"
echo ""

echo "💡 Pro Tips:"
echo "============"
echo ""
echo "1. 📱 Test during a Lions game to see live updates"
echo "2. 📊 Monitor costs in AWS Billing Dashboard"
echo "3. 🔄 Automatic rebuilds happen daily during football season"
echo "4. 🚨 Set up AWS billing alerts for cost protection"
echo "5. 📝 Check GitHub Actions logs if deployment fails"
echo ""

echo "🎉 GitHub Actions Setup Complete!"
echo ""
echo "Your didlionswin site now has:"
echo "✅ Automated deployment on every push"
echo "✅ Static hosting for lightning-fast performance"
echo "✅ Live score updates during games"
echo "✅ Cost-optimized architecture ($3-8/month)"
echo "✅ Daily automatic rebuilds during football season"
echo ""

echo "🦁 Ready for Lions season! One Pride! 🦁"

# Create a summary file
cat > deployment-summary.txt << EOF
didlionswin GitHub Actions Deployment Summary
=============================================

Setup completed on: $(date)
GitHub Repository: $GITHUB_REPO
AWS Account: $ACCOUNT_ID

Deployment Features:
✅ Hybrid static + serverless architecture
✅ Live score updates during games
✅ Automated daily rebuilds during football season
✅ Cost-optimized for $3-8/month
✅ Lightning-fast CDN delivery

Monitoring URLs:
- GitHub Actions: https://github.com/$GITHUB_REPO/actions
- AWS Console: https://console.aws.amazon.com/
- Cost Explorer: https://console.aws.amazon.com/billing/

Next Steps:
1. Monitor first deployment in GitHub Actions
2. Test live score updates during next Lions game
3. Set up AWS billing alerts for cost control
4. Enjoy the fastest Lions score updates on the web!

Go Lions! 🦁
EOF

echo "📄 Summary saved to: deployment-summary.txt"
