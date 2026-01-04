#!/bin/bash
# Deployment script for AWS App Runner

set -e

echo "🚀 Deploying Did Lions Win API to AWS App Runner..."

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
SERVICE_NAME="didlionswin-api"
ECR_REPO_NAME="didlionswin-api"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install it first."
    exit 1
fi

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPO_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}"

echo "📍 AWS Account: ${AWS_ACCOUNT_ID}"
echo "📍 Region: ${AWS_REGION}"
echo "📍 ECR Repository: ${ECR_REPO_URI}"

# Create ECR repository if it doesn't exist
echo "📦 Creating ECR repository if needed..."
aws ecr describe-repositories --repository-names ${ECR_REPO_NAME} --region ${AWS_REGION} 2>/dev/null || \
aws ecr create-repository --repository-name ${ECR_REPO_NAME} --region ${AWS_REGION} --image-scanning-configuration scanOnPush=true

# Login to ECR
echo "🔐 Logging in to ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REPO_URI}

# Build Docker image
echo "🔨 Building Docker image..."
cd "$(dirname "$0")/.."
docker build -f api-server/Dockerfile -t ${ECR_REPO_NAME}:latest .

# Tag image
docker tag ${ECR_REPO_NAME}:latest ${ECR_REPO_URI}:latest

# Push image to ECR
echo "📤 Pushing image to ECR..."
docker push ${ECR_REPO_URI}:latest

# Check if App Runner service exists
echo "🔍 Checking if App Runner service exists..."
SERVICE_EXISTS=$(aws apprunner list-services --region ${AWS_REGION} --query "ServiceSummaryList[?ServiceName=='${SERVICE_NAME}'].ServiceName" --output text)

if [ -z "$SERVICE_EXISTS" ]; then
    echo "🆕 Creating new App Runner service..."
    
    # Create service configuration
    cat > /tmp/apprunner-config.json <<EOF
{
  "ServiceName": "${SERVICE_NAME}",
  "SourceConfiguration": {
    "ImageRepository": {
      "ImageIdentifier": "${ECR_REPO_URI}:latest",
      "ImageConfiguration": {
        "Port": "8080",
        "RuntimeEnvironmentVariables": {
          "NODE_ENV": "production",
          "ESPN_API_URL": "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl",
          "LIONS_TEAM_ID": "8"
        }
      }
    },
    "AutoDeploymentsEnabled": true
  },
  "InstanceConfiguration": {
    "Cpu": "0.5 vCPU",
    "Memory": "1 GB"
  },
  "HealthCheckConfiguration": {
    "Protocol": "HTTP",
    "Path": "/api/health",
    "Interval": 10,
    "Timeout": 5,
    "HealthyThreshold": 1,
    "UnhealthyThreshold": 5
  }
}
EOF

    aws apprunner create-service \
        --region ${AWS_REGION} \
        --cli-input-json file:///tmp/apprunner-config.json
    
    echo "✅ Service created! It may take a few minutes to become available."
else
    echo "🔄 Updating existing App Runner service..."
    aws apprunner start-deployment \
        --service-arn $(aws apprunner list-services --region ${AWS_REGION} --query "ServiceSummaryList[?ServiceName=='${SERVICE_NAME}'].ServiceArn" --output text) \
        --region ${AWS_REGION}
    
    echo "✅ Deployment started! The service will update automatically."
fi

echo ""
echo "🎉 Deployment complete!"
echo "📝 To get the service URL, run:"
echo "   aws apprunner describe-service --service-arn <SERVICE_ARN> --region ${AWS_REGION} --query 'Service.ServiceUrl' --output text"


