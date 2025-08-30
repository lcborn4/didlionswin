# 🚀 GitHub Actions Setup for didlionswin

## 📋 **Prerequisites Checklist**

Before setting up GitHub Actions, ensure you have:

- [ ] AWS Account with billing enabled
- [ ] AWS CLI installed and configured locally
- [ ] GitHub repository for didlionswin
- [ ] Domain name (optional, for custom domain)

## 🔧 **Step 1: AWS Infrastructure Setup**

### Option A: Quick Setup Script (Recommended)
```bash
# Run the automated setup script
./scripts/setup-aws-static.sh
```

### Option B: Manual Setup
If you prefer manual setup, follow these steps:

#### 1.1 Create S3 Bucket
```bash
# Replace 'your-bucket-name' with your preferred name
aws s3 mb s3://didlionswin-static-prod --region us-east-1

# Enable static website hosting
aws s3 website s3://didlionswin-static-prod \
  --index-document index.html \
  --error-document 404.html
```

#### 1.2 Create CloudFront Distribution
```bash
# Create distribution (this takes 15-20 minutes)
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

#### 1.3 Get Distribution ID
```bash
# Note down the distribution ID for later
aws cloudfront list-distributions \
  --query 'DistributionList.Items[0].Id' \
  --output text
```

## 🔐 **Step 2: GitHub Secrets Configuration**

### 2.1 Navigate to Repository Settings
1. Go to your GitHub repository
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**

### 2.2 Add Required Secrets
Click **New repository secret** and add each of these:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `AWS_ACCESS_KEY_ID` | Your AWS Access Key | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | Your AWS Secret Key | `abc123...` |
| `S3_BUCKET` | Your S3 bucket name | `didlionswin-static-prod` |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID | `E1234567890ABC` |

### 2.3 Optional Secrets (for API deployment)
| Secret Name | Value | Purpose |
|-------------|-------|---------|
| `LIVE_SCORE_API_URL` | API Gateway URL | For frontend integration |
| `ESPN_API_KEY` | ESPN API key | If you get a premium key |

## 📝 **Step 3: Update Workflow Configuration**

### 3.1 Edit Static Deployment Workflow
Update `.github/workflows/deploy-hybrid.yml`:

```yaml
env:
  NODE_VERSION: "18"
  AWS_REGION: "us-east-1"
  S3_BUCKET: ${{ secrets.S3_BUCKET }}  # Use secret
  CLOUDFRONT_DISTRIBUTION_ID: ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }}  # Use secret
```

### 3.2 Verify Workflow Files
Ensure these files exist:
- [ ] `.github/workflows/deploy-hybrid.yml`
- [ ] `next.config.hybrid.js`
- [ ] `serverless-api.yml`

## 🏗️ **Step 4: AWS IAM Permissions**

### 4.1 Create IAM Policy
Create a policy with these permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "S3StaticHosting",
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::didlionswin-static-prod",
                "arn:aws:s3:::didlionswin-static-prod/*"
            ]
        },
        {
            "Sid": "CloudFrontInvalidation",
            "Effect": "Allow",
            "Action": [
                "cloudfront:CreateInvalidation",
                "cloudfront:GetInvalidation",
                "cloudfront:ListInvalidations"
            ],
            "Resource": "*"
        },
        {
            "Sid": "LambdaDeployment",
            "Effect": "Allow",
            "Action": [
                "lambda:CreateFunction",
                "lambda:UpdateFunctionCode",
                "lambda:UpdateFunctionConfiguration",
                "lambda:GetFunction",
                "lambda:ListFunctions",
                "lambda:DeleteFunction",
                "lambda:InvokeFunction",
                "lambda:AddPermission",
                "lambda:RemovePermission",
                "iam:PassRole"
            ],
            "Resource": "*"
        },
        {
            "Sid": "ApiGatewayDeployment",
            "Effect": "Allow",
            "Action": [
                "apigateway:*"
            ],
            "Resource": "*"
        },
        {
            "Sid": "IAMRoleManagement",
            "Effect": "Allow",
            "Action": [
                "iam:CreateRole",
                "iam:DeleteRole",
                "iam:GetRole",
                "iam:PassRole",
                "iam:AttachRolePolicy",
                "iam:DetachRolePolicy",
                "iam:PutRolePolicy",
                "iam:DeleteRolePolicy"
            ],
            "Resource": "*"
        },
        {
            "Sid": "CloudFormation",
            "Effect": "Allow",
            "Action": [
                "cloudformation:*"
            ],
            "Resource": "*"
        },
        {
            "Sid": "LogsAccess",
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams"
            ],
            "Resource": "*"
        }
    ]
}
```

### 4.2 Attach Policy to User
```bash
# Create the policy
aws iam create-policy \
  --policy-name DidLionsWinDeployment \
  --policy-document file://deployment-policy.json

# Attach to your user (replace with your username)
aws iam attach-user-policy \
  --user-name your-username \
  --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/DidLionsWinDeployment
```

## 🧪 **Step 5: Test the Setup**

### 5.1 Test Local Build
```bash
# Test static build
npm run build:static

# Verify output directory
ls -la out/
```

### 5.2 Test Manual Deployment
```bash
# Test S3 upload
aws s3 sync out/ s3://your-bucket-name --dry-run

# Test CloudFront invalidation
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*" \
  --dry-run
```

### 5.3 Trigger GitHub Action
1. **Commit and push** your changes:
   ```bash
   git add .
   git commit -m "feat: setup hybrid deployment with live scores"
   git push origin main
   ```

2. **Monitor deployment**:
   - Go to GitHub repository
   - Click **Actions** tab
   - Watch the workflow run

## 📊 **Step 6: Monitor and Verify**

### 6.1 Check GitHub Actions Logs
- **Static deployment**: Should show S3 sync and CloudFront invalidation
- **API deployment**: Should show Lambda functions created
- **Overall status**: Both jobs should complete successfully

### 6.2 Verify Deployed Site
1. **Static site**: Visit your CloudFront URL
2. **API endpoints**: Test health check endpoint
3. **Live scores**: Check during a Lions game

### 6.3 Cost Monitoring
```bash
# Check current month's costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost
```

## 🚨 **Troubleshooting Common Issues**

### Issue 1: S3 Access Denied
```bash
# Check bucket policy
aws s3api get-bucket-policy --bucket your-bucket-name

# Fix permissions
aws s3api put-bucket-policy \
  --bucket your-bucket-name \
  --policy file://bucket-policy.json
```

### Issue 2: CloudFront Invalidation Fails
```bash
# Check distribution status
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID

# List existing invalidations
aws cloudfront list-invalidations --distribution-id YOUR_DISTRIBUTION_ID
```

### Issue 3: Lambda Deployment Fails
```bash
# Check IAM permissions
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::ACCOUNT:user/USERNAME \
  --action-names lambda:CreateFunction \
  --resource-arns "*"
```

### Issue 4: GitHub Actions Timeout
- **Increase timeout** in workflow file
- **Check AWS CLI version** in actions
- **Verify secrets** are correctly set

## 🔄 **Step 7: Automated Scheduling**

The workflow includes automatic rebuilds:

```yaml
schedule:
  # Rebuild daily during football season for fresh data
  - cron: '0 11 * 9-12,1-2 *'  # 6 AM EST during Sep-Dec, Jan-Feb
```

This ensures:
- **Fresh game schedules** daily
- **Updated team info** automatically
- **Zero manual intervention** needed

## ✅ **Success Checklist**

After setup, verify:

- [ ] GitHub Actions workflow runs successfully
- [ ] Static site loads from CloudFront URL
- [ ] API health endpoint responds
- [ ] Live score updates work during games
- [ ] Costs stay under $10/month
- [ ] Daily rebuilds work automatically

## 🎉 **You're Ready!**

Once everything is set up, your didlionswin site will:

1. **Deploy automatically** on every push
2. **Serve static content** instantly from CDN
3. **Update live scores** during Lions games
4. **Cost under $8/month** for the entire solution
5. **Handle traffic spikes** automatically

The hybrid approach gives you the **best performance at the lowest cost** while providing **real-time updates when they matter most**! 🦁
