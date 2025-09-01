#!/bin/bash

echo "🌐 Setting up custom domain: didthelionswin.com"
echo "================================================"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI configured"

# Step 1: Request SSL Certificate
echo ""
echo "🚀 Step 1: Requesting SSL Certificate..."
echo "Requesting certificate for didthelionswin.com and www.didthelionswin.com..."

CERT_ARN=$(aws acm request-certificate \
    --domain-names didthelionswin.com www.didthelionswin.com \
    --validation-method DNS \
    --region us-east-1 \
    --query 'CertificateArn' \
    --output text)

if [ $? -eq 0 ]; then
    echo "✅ Certificate requested successfully!"
    echo "Certificate ARN: $CERT_ARN"
    echo ""
    echo "📝 Save this ARN: $CERT_ARN"
    echo ""
    echo "🔧 Next steps:"
    echo "1. Go to AWS Certificate Manager console"
    echo "2. Find your certificate: $CERT_ARN"
    echo "3. Copy the DNS validation records"
    echo "4. Add them to your domain registrar's DNS settings"
    echo "5. Wait for validation (can take 24-48 hours)"
    echo ""
    echo "After validation, update the CloudFront distribution with:"
    echo "aws cloudfront update-distribution --id E1IDDWHMSCI9BZ --distribution-config file://current-distribution.json --if-match E18CX4CKBORIGL"
    echo ""
    echo "⚠️  IMPORTANT: Replace 'YOUR_ACM_CERTIFICATE_ARN_HERE' in current-distribution.json with: $CERT_ARN"
else
    echo "❌ Failed to request certificate"
    exit 1
fi

echo ""
echo "📚 For detailed instructions, see DOMAIN_SETUP.md"
