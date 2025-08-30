#!/bin/bash

# GitHub Secrets Configuration Helper
# This script helps you get the values needed for GitHub secrets

echo "🔐 GitHub Secrets Configuration Helper"
echo "======================================="
echo ""
echo "This script will help you gather the values needed for GitHub repository secrets."
echo "You'll need to manually add these to GitHub → Settings → Secrets and variables → Actions"
echo ""

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI is configured"
echo ""

# Get AWS account info
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
USER_ARN=$(aws sts get-caller-identity --query Arn --output text)
REGION=$(aws configure get region)

echo "📋 AWS Account Information:"
echo "  Account ID: $ACCOUNT_ID"
echo "  User: $USER_ARN"
echo "  Region: $REGION"
echo ""

# Get AWS credentials
echo "🔑 AWS Credentials:"
echo "  These are from your AWS CLI configuration"
ACCESS_KEY=$(aws configure get aws_access_key_id)
SECRET_KEY_MASKED=$(aws configure get aws_secret_access_key | sed 's/./*/g')

echo "  Access Key ID: $ACCESS_KEY"
echo "  Secret Key: $SECRET_KEY_MASKED (hidden for security)"
echo ""

# Check for existing S3 buckets
echo "🪣 Checking for existing S3 buckets..."
BUCKETS=$(aws s3 ls | grep didlionswin || echo "")

if [ -z "$BUCKETS" ]; then
    echo "  No didlionswin buckets found"
    echo "  Suggested bucket name: didlionswin-static-$(date +%Y%m%d)"
    SUGGESTED_BUCKET="didlionswin-static-$(date +%Y%m%d)"
else
    echo "  Existing buckets:"
    echo "$BUCKETS"
    SUGGESTED_BUCKET=$(echo "$BUCKETS" | head -1 | awk '{print $3}')
fi
echo ""

# Check for CloudFront distributions
echo "☁️  Checking for CloudFront distributions..."
DISTRIBUTIONS=$(aws cloudfront list-distributions --query 'DistributionList.Items[?Comment==`CloudFront distribution for didlionswin static site`].[Id,DomainName,Comment]' --output table 2>/dev/null || echo "")

if [ -z "$DISTRIBUTIONS" ] || [ "$DISTRIBUTIONS" == "" ]; then
    echo "  No didlionswin CloudFront distributions found"
    echo "  You'll need to create one using the setup script"
    DISTRIBUTION_ID="NEEDS_TO_BE_CREATED"
else
    echo "  Existing distributions:"
    echo "$DISTRIBUTIONS"
    DISTRIBUTION_ID=$(aws cloudfront list-distributions --query 'DistributionList.Items[?Comment==`CloudFront distribution for didlionswin static site`].Id' --output text | head -1)
fi
echo ""

# Generate the secrets table
echo "📝 GitHub Repository Secrets to Add:"
echo "====================================="
echo ""
echo "Go to your GitHub repository → Settings → Secrets and variables → Actions"
echo "Click 'New repository secret' and add each of these:"
echo ""
printf "%-30s | %-40s | %s\n" "Secret Name" "Value" "Notes"
echo "-------------------------------|------------------------------------------|---------------------------"
printf "%-30s | %-40s | %s\n" "AWS_ACCESS_KEY_ID" "$ACCESS_KEY" "From AWS CLI config"
printf "%-30s | %-40s | %s\n" "AWS_SECRET_ACCESS_KEY" "***HIDDEN***" "From AWS CLI config"
printf "%-30s | %-40s | %s\n" "S3_BUCKET" "$SUGGESTED_BUCKET" "Your S3 bucket name"
printf "%-30s | %-40s | %s\n" "CLOUDFRONT_DISTRIBUTION_ID" "$DISTRIBUTION_ID" "After CloudFront creation"
echo ""

# Create a file with the secrets for reference
cat > github-secrets.txt << EOF
GitHub Repository Secrets for didlionswin
=========================================

Add these secrets to: GitHub Repository → Settings → Secrets and variables → Actions

AWS_ACCESS_KEY_ID
Value: $ACCESS_KEY
Notes: Your AWS access key from 'aws configure'

AWS_SECRET_ACCESS_KEY  
Value: [Get from: aws configure get aws_secret_access_key]
Notes: Your AWS secret key (keep this secure!)

S3_BUCKET
Value: $SUGGESTED_BUCKET
Notes: S3 bucket name for static hosting

CLOUDFRONT_DISTRIBUTION_ID
Value: $DISTRIBUTION_ID
Notes: CloudFront distribution ID (create if needed)

Generated on: $(date)
AWS Account: $ACCOUNT_ID
AWS Region: $REGION
EOF

echo "💾 Secrets information saved to: github-secrets.txt"
echo ""

# Check if infrastructure exists
echo "🏗️  Infrastructure Status:"
echo "=========================="

# Check S3 bucket
if aws s3 ls "s3://$SUGGESTED_BUCKET" &> /dev/null; then
    echo "✅ S3 bucket '$SUGGESTED_BUCKET' exists"
else
    echo "❌ S3 bucket '$SUGGESTED_BUCKET' does not exist"
    echo "   Run: ./scripts/setup-aws-static.sh to create it"
fi

# Check CloudFront
if [ "$DISTRIBUTION_ID" != "NEEDS_TO_BE_CREATED" ] && [ ! -z "$DISTRIBUTION_ID" ]; then
    DIST_STATUS=$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID" --query 'Distribution.Status' --output text 2>/dev/null || echo "NOT_FOUND")
    if [ "$DIST_STATUS" == "Deployed" ]; then
        echo "✅ CloudFront distribution '$DISTRIBUTION_ID' is deployed"
        DIST_DOMAIN=$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID" --query 'Distribution.DomainName' --output text)
        echo "   Domain: $DIST_DOMAIN"
    else
        echo "⏳ CloudFront distribution '$DISTRIBUTION_ID' status: $DIST_STATUS"
    fi
else
    echo "❌ CloudFront distribution needs to be created"
    echo "   Run: ./scripts/setup-aws-static.sh to create it"
fi

echo ""
echo "🚀 Next Steps:"
echo "=============="
echo ""
echo "1. 📝 Add the secrets to GitHub (shown above)"
echo "2. 🏗️  Create missing infrastructure:"
echo "   ./scripts/setup-aws-static.sh"
echo "3. 🧪 Test the deployment:"
echo "   git add . && git commit -m 'setup deployment' && git push"
echo "4. 📊 Monitor in GitHub Actions tab"
echo ""

# Security reminder
echo "🔒 Security Reminder:"
echo "====================="
echo ""
echo "⚠️  IMPORTANT: Never commit AWS credentials to your repository!"
echo "✅ Use GitHub secrets for all sensitive information"
echo "✅ Regularly rotate your AWS access keys"
echo "✅ Monitor AWS costs and set up billing alerts"
echo ""

echo "🎉 Configuration helper complete!"
echo ""
echo "📄 Reference file created: github-secrets.txt"
echo "🔐 Add these secrets to GitHub and you're ready to deploy!"
