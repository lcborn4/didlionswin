#!/bin/bash

# AWS Amplify Deployment Setup Script
# This script helps you set up GitHub Actions deployment to AWS Amplify

echo "🚀 AWS Amplify Deployment Setup"
echo "================================"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI is installed and configured"
echo ""

# Get current AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "📋 AWS Account ID: $ACCOUNT_ID"
echo ""

# Prompt for Amplify App details
echo "📝 Please provide the following information:"
echo ""

read -p "Amplify App Name (e.g., didlionswin): " APP_NAME
read -p "Amplify Branch Name (e.g., main): " BRANCH_NAME
read -p "AWS Region (default: us-east-1): " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

echo ""
echo "🔧 Creating Amplify app..."

# Create Amplify app
APP_JSON=$(aws amplify create-app \
    --name "$APP_NAME" \
    --description "Did Lions Win - Next.js app deployed via GitHub Actions" \
    --repository "" \
    --platform WEB \
    --iam-service-role-arn "" \
    --region $AWS_REGION 2>/dev/null)

if [ $? -eq 0 ]; then
    APP_ID=$(echo "$APP_JSON" | jq -r '.app.appId')
    DEFAULT_DOMAIN=$(echo "$APP_JSON" | jq -r '.app.defaultDomain')
    
    echo "✅ Amplify app created successfully!"
    echo "   App ID: $APP_ID"
    echo "   Default Domain: $DEFAULT_DOMAIN"
    echo ""
    
    # Create branch
    echo "🌿 Creating branch..."
    aws amplify create-branch \
        --app-id "$APP_ID" \
        --branch-name "$BRANCH_NAME" \
        --description "Main deployment branch" \
        --region $AWS_REGION > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ Branch '$BRANCH_NAME' created successfully!"
    else
        echo "⚠️  Branch creation failed, but app was created. You can create it manually in the console."
    fi
else
    echo "❌ Failed to create Amplify app. Please check your permissions and try again."
    exit 1
fi

echo ""
echo "🔐 GitHub Secrets Setup"
echo "========================"
echo ""
echo "Please add the following secrets to your GitHub repository:"
echo "Go to: Settings → Secrets and variables → Actions"
echo ""
echo "Secret Name                | Value"
echo "---------------------------|----------------------------------"
echo "AWS_ACCESS_KEY_ID         | (Your AWS Access Key)"
echo "AWS_SECRET_ACCESS_KEY     | (Your AWS Secret Key)"
echo "AMPLIFY_APP_ID            | $APP_ID"
echo "AMPLIFY_BRANCH_NAME       | $BRANCH_NAME"
echo ""

echo "📋 IAM Policy"
echo "============="
echo ""
echo "Create an IAM policy with the following JSON and attach it to your AWS user:"
echo ""
cat << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "amplify:GetApp",
                "amplify:GetBranch",
                "amplify:StartJob",
                "amplify:GetJob",
                "amplify:ListJobs",
                "amplify:CreateDeployment",
                "amplify:StartDeployment"
            ],
            "Resource": [
                "arn:aws:amplify:$AWS_REGION:$ACCOUNT_ID:apps/$APP_ID",
                "arn:aws:amplify:$AWS_REGION:$ACCOUNT_ID:apps/$APP_ID/branches/*",
                "arn:aws:amplify:$AWS_REGION:$ACCOUNT_ID:apps/$APP_ID/deployments/*"
            ]
        }
    ]
}
EOF

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Add the GitHub secrets listed above"
echo "2. Create and attach the IAM policy"
echo "3. Push your code to trigger the first deployment"
echo "4. Visit your app at: https://$BRANCH_NAME.$DEFAULT_DOMAIN"
echo ""
echo "For more details, see .github/AMPLIFY_DEPLOYMENT.md"
