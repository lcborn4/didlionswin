# AWS Amplify Deployment with GitHub Actions

This repository is configured to automatically deploy to AWS Amplify using GitHub Actions when code is pushed to the `master` or `main` branch.

## Setup Instructions

### 1. AWS Amplify App Setup

First, you need to create an AWS Amplify app:

1. Go to the [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click "Create app" and choose "Deploy without Git provider" (since we'll use GitHub Actions)
3. Give your app a name (e.g., "didlionswin")
4. Note down the **App ID** from the URL or app details

### 2. Required GitHub Secrets

Navigate to your GitHub repository → Settings → Secrets and variables → Actions, and add these secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS Access Key for deployment | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Access Key | `abc123...` |
| `AMPLIFY_APP_ID` | Your Amplify App ID | `d1234567890` |
| `AMPLIFY_BRANCH_NAME` | Target branch in Amplify | `main` or `master` |

### 3. AWS IAM Permissions

The AWS credentials need the following permissions:

```json
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
                "arn:aws:amplify:*:*:apps/YOUR_APP_ID",
                "arn:aws:amplify:*:*:apps/YOUR_APP_ID/branches/*",
                "arn:aws:amplify:*:*:apps/YOUR_APP_ID/deployments/*"
            ]
        }
    ]
}
```

Replace `YOUR_APP_ID` with your actual Amplify App ID.

### 4. Amplify App Configuration

In your AWS Amplify app settings:

1. **Build Settings**: Make sure the build configuration matches your Next.js setup:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

2. **Environment Variables**: Add any environment variables your app needs

3. **Disable Auto-deployment**: Since we're using GitHub Actions, disable the automatic Git-based deployments

## Deployment Workflows

This repository includes two deployment workflows:

### 1. `deploy.yml` (Amplify CLI Method)
- Uses the Amplify CLI for deployment
- Simpler setup but may require additional configuration
- Recommended for most use cases

### 2. `deploy-amplify-api.yml` (REST API Method)
- Uses AWS CLI and Amplify REST API
- More control over the deployment process
- Better error handling and logging
- Recommended for production environments

## How It Works

1. When you push to `master` or `main` branch, the GitHub Action triggers
2. The workflow:
   - Checks out your code
   - Sets up Node.js
   - Installs dependencies
   - Builds your Next.js app
   - Configures AWS credentials
   - Deploys to AWS Amplify
3. Your app is automatically deployed and available at your Amplify domain

## Manual Deployment

You can also trigger deployments manually:
1. Go to your GitHub repository
2. Navigate to Actions tab
3. Select the deployment workflow
4. Click "Run workflow"

## Troubleshooting

### Common Issues

1. **Authentication Error**: Verify your AWS credentials and IAM permissions
2. **App ID Not Found**: Check that `AMPLIFY_APP_ID` secret is correct
3. **Build Failure**: Check the GitHub Actions logs for build errors
4. **Branch Not Found**: Ensure `AMPLIFY_BRANCH_NAME` matches your Amplify app branch

### Getting Help

- Check the GitHub Actions logs for detailed error messages
- Verify all secrets are set correctly
- Ensure your AWS IAM user has the required permissions
- Check AWS Amplify console for deployment status

## Local Development

To run the app locally:

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to see your app.

## Monitoring

- **GitHub Actions**: Monitor deployment status in the Actions tab
- **AWS Amplify Console**: View detailed deployment logs and app status
- **CloudWatch**: Monitor application performance and errors
