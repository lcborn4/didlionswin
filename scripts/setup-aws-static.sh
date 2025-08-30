#!/bin/bash

# AWS S3 + CloudFront Setup Script for didlionswin
# This script sets up the cheapest AWS hosting option for Next.js

echo "🏆 AWS S3 + CloudFront Setup (CHEAPEST Option)"
echo "==============================================="
echo ""
echo "💰 Expected monthly cost: $1-5"
echo "⚡ Performance: Lightning fast with global CDN"
echo "🚀 Scalability: Handles millions of requests"
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

# Prompt for configuration
echo "📝 Configuration Setup:"
echo ""

read -p "S3 Bucket Name (e.g., didlionswin-static): " BUCKET_NAME
read -p "AWS Region (default: us-east-1): " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}
read -p "Custom domain (optional, e.g., didlionswin.com): " CUSTOM_DOMAIN

echo ""
echo "🪣 Creating S3 bucket..."

# Create S3 bucket
aws s3 mb s3://$BUCKET_NAME --region $AWS_REGION

if [ $? -eq 0 ]; then
    echo "✅ S3 bucket '$BUCKET_NAME' created successfully!"
else
    echo "⚠️  Bucket might already exist or there was an error. Continuing..."
fi

# Configure bucket for static website hosting
echo "🌐 Configuring S3 for static website hosting..."

aws s3 website s3://$BUCKET_NAME \
    --index-document index.html \
    --error-document 404.html

# Create bucket policy for public read access
cat > bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        }
    ]
}
EOF

aws s3api put-bucket-policy \
    --bucket $BUCKET_NAME \
    --policy file://bucket-policy.json

rm bucket-policy.json

echo "✅ S3 static website hosting configured!"

# Create CloudFront distribution
echo "☁️  Creating CloudFront distribution..."

# CloudFront distribution configuration
cat > cloudfront-config.json << EOF
{
    "CallerReference": "didlionswin-$(date +%s)",
    "Aliases": {
        "Quantity": 0
    },
    "DefaultRootObject": "index.html",
    "Comment": "CloudFront distribution for didlionswin static site",
    "Enabled": true,
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "$BUCKET_NAME-origin",
                "DomainName": "$BUCKET_NAME.s3-website-$AWS_REGION.amazonaws.com",
                "CustomOriginConfig": {
                    "HTTPPort": 80,
                    "HTTPSPort": 443,
                    "OriginProtocolPolicy": "http-only"
                }
            }
        ]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "$BUCKET_NAME-origin",
        "ViewerProtocolPolicy": "redirect-to-https",
        "TrustedSigners": {
            "Enabled": false,
            "Quantity": 0
        },
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": {
                "Forward": "none"
            }
        },
        "MinTTL": 0,
        "DefaultTTL": 3600,
        "MaxTTL": 31536000
    },
    "CustomErrorPages": {
        "Quantity": 1,
        "Items": [
            {
                "ErrorCode": 404,
                "ResponsePagePath": "/404.html",
                "ResponseCode": "404",
                "ErrorCachingMinTTL": 300
            }
        ]
    },
    "PriceClass": "PriceClass_100"
}
EOF

# Create the distribution
DISTRIBUTION_JSON=$(aws cloudfront create-distribution \
    --distribution-config file://cloudfront-config.json)

if [ $? -eq 0 ]; then
    DISTRIBUTION_ID=$(echo "$DISTRIBUTION_JSON" | jq -r '.Distribution.Id')
    DOMAIN_NAME=$(echo "$DISTRIBUTION_JSON" | jq -r '.Distribution.DomainName')
    
    echo "✅ CloudFront distribution created successfully!"
    echo "   Distribution ID: $DISTRIBUTION_ID"
    echo "   Domain Name: $DOMAIN_NAME"
    
    rm cloudfront-config.json
else
    echo "❌ Failed to create CloudFront distribution"
    rm cloudfront-config.json
    exit 1
fi

echo ""
echo "🔐 GitHub Secrets Setup"
echo "========================"
echo ""
echo "Add these secrets to your GitHub repository:"
echo "Go to: Settings → Secrets and variables → Actions"
echo ""
echo "Secret Name                | Value"
echo "---------------------------|----------------------------------"
echo "AWS_ACCESS_KEY_ID         | (Your AWS Access Key)"
echo "AWS_SECRET_ACCESS_KEY     | (Your AWS Secret Key)"
echo "S3_BUCKET                 | $BUCKET_NAME"
echo "CLOUDFRONT_DISTRIBUTION_ID| $DISTRIBUTION_ID"
echo ""

echo "📝 Update GitHub Actions Workflow"
echo "=================================="
echo ""
echo "Edit .github/workflows/deploy-static.yml and update:"
echo "  S3_BUCKET: \"$BUCKET_NAME\""
echo "  CLOUDFRONT_DISTRIBUTION_ID: \"$DISTRIBUTION_ID\""
echo ""

echo "💰 Cost Estimate"
echo "================"
echo ""
echo "Monthly costs for 1,000 visitors:"
echo "• S3 Storage (1GB): ~$0.02"
echo "• S3 Requests: ~$0.01"
echo "• CloudFront (1GB transfer): ~$0.085"
echo "• Total: ~$0.11/month"
echo ""
echo "For 10,000 visitors: ~$1/month"
echo "For 100,000 visitors: ~$5-10/month"
echo ""

echo "🚀 Next Steps"
echo "============="
echo ""
echo "1. Add the GitHub secrets listed above"
echo "2. Update the deploy-static.yml workflow file"
echo "3. Test static build locally: npm run build"
echo "4. Push to main branch to trigger deployment"
echo "5. Access your site at: https://$DOMAIN_NAME"
echo ""

if [ ! -z "$CUSTOM_DOMAIN" ]; then
    echo "🌐 Custom Domain Setup"
    echo "======================"
    echo ""
    echo "To use $CUSTOM_DOMAIN:"
    echo "1. Add CNAME record: $CUSTOM_DOMAIN → $DOMAIN_NAME"
    echo "2. Request SSL certificate in AWS Certificate Manager"
    echo "3. Update CloudFront distribution with custom domain"
    echo ""
fi

echo "📊 Monitoring"
echo "============="
echo ""
echo "Monitor your costs in AWS Console:"
echo "• CloudWatch for traffic metrics"
echo "• Billing Dashboard for cost tracking"
echo "• Set up billing alerts for cost control"
echo ""

echo "🎉 Setup complete!"
echo ""
echo "Your didlionswin app is now configured for the cheapest AWS deployment option!"
echo "Expected savings: 90%+ compared to serverless options"
