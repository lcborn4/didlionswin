# 🚀 Setup GitHub Actions - Quick Guide

## Required Secrets

Your GitHub Actions workflow needs these secrets. Add them at:
**GitHub → Your Repo → Settings → Secrets and variables → Actions**

### Required Secrets

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `AWS_ACCESS_KEY_ID` | AWS Access Key | Create IAM user in AWS Console |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Key | Same IAM user |
| `S3_BUCKET` | S3 bucket name | Your S3 bucket (e.g., `didlionswin-static-prod`) |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront ID | Your CloudFront distribution ID |

### Optional (for App Runner)

| Secret Name | Description | When to Set |
|------------|-------------|-------------|
| `NEXT_PUBLIC_APP_RUNNER_URL` | App Runner URL | After deploying App Runner |

---

## Step-by-Step Setup

### Step 1: Create AWS IAM User

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Users** → **Create user**
3. Name: `github-actions-didlionswin`
4. **Attach policies directly:**
   - `AmazonS3FullAccess` (or create custom policy for your bucket)
   - `CloudFrontFullAccess` (or create custom policy)
   - `AWSLambda_FullAccess` (if deploying Lambda)
   - `AmazonEC2ContainerRegistryFullAccess` (if deploying App Runner)
5. Click **Create user**
6. **Create access key:**
   - Click the user → **Security credentials** tab
   - Click **Create access key** → **CLI**
   - **Copy both keys** (you'll need them for GitHub Secrets)

### Step 2: Get S3 Bucket Name

```bash
# List your buckets
aws s3 ls

# Or create one if needed
aws s3 mb s3://didlionswin-static-prod --region us-east-1
```

### Step 3: Get CloudFront Distribution ID

```bash
# List distributions
aws cloudfront list-distributions \
  --query 'DistributionList.Items[*].[Id,DomainName]' \
  --output table

# Or create one if needed (see DOMAIN_SETUP.md)
```

### Step 4: Add Secrets to GitHub

#### Option A: GitHub Web UI
1. Go to: `https://github.com/lcborn4/didlionswin/settings/secrets/actions`
2. Click **New repository secret**
3. Add each secret:
   - `AWS_ACCESS_KEY_ID` → Your access key
   - `AWS_SECRET_ACCESS_KEY` → Your secret key
   - `S3_BUCKET` → Your bucket name
   - `CLOUDFRONT_DISTRIBUTION_ID` → Your distribution ID

#### Option B: GitHub CLI
```bash
gh secret set AWS_ACCESS_KEY_ID --body "YOUR_ACCESS_KEY"
gh secret set AWS_SECRET_ACCESS_KEY --body "YOUR_SECRET_KEY"
gh secret set S3_BUCKET --body "didlionswin-static-prod"
gh secret set CLOUDFRONT_DISTRIBUTION_ID --body "YOUR_DISTRIBUTION_ID"
```

### Step 5: Test the Workflow

```bash
# Push to master to trigger workflow
git push origin master

# Or manually trigger:
# GitHub → Actions → Deploy Hybrid Static + Serverless → Run workflow
```

---

## Verify Setup

### Check Secrets Are Set
```bash
gh secret list
```

Should show all 4 required secrets.

### Check Workflow Runs
1. Go to: `https://github.com/lcborn4/didlionswin/actions`
2. You should see workflow runs
3. Click on a run to see logs

---

## Troubleshooting

### Workflow Fails with "Access Denied"
- Check IAM user has correct permissions
- Verify AWS credentials are correct
- Check bucket/distribution IDs are correct

### Workflow Fails with "Bucket Not Found"
- Verify `S3_BUCKET` secret matches your bucket name exactly
- Check bucket exists: `aws s3 ls`

### Workflow Fails with "Distribution Not Found"
- Verify `CLOUDFRONT_DISTRIBUTION_ID` is correct
- Check distribution exists: `aws cloudfront list-distributions`

### Build Succeeds but Site Not Updating
- Check CloudFront invalidation completed
- Wait 5-10 minutes for CloudFront to propagate
- Check S3 bucket has new files

---

## After App Runner Deployment

Once you deploy App Runner:

1. **Get App Runner URL:**
   ```bash
   cd api-server
   ./get-url.sh
   ```

2. **Add to GitHub Secrets:**
   ```bash
   gh secret set NEXT_PUBLIC_APP_RUNNER_URL --body "https://YOUR_APP_RUNNER_URL"
   ```

3. **Next push will use App Runner!** 🎉

---

## Quick Checklist

- [ ] AWS IAM user created with access keys
- [ ] S3 bucket exists and name noted
- [ ] CloudFront distribution exists and ID noted
- [ ] All 4 required secrets added to GitHub
- [ ] Workflow runs successfully
- [ ] Site deploys to S3/CloudFront
- [ ] (Optional) App Runner deployed and secret added

---

**Ready?** Set up the secrets, then push to master! 🚀

