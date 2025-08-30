# Testing AWS Amplify Deployment

This guide helps you test your GitHub Actions deployment to AWS Amplify.

## Pre-deployment Checklist

Before testing the deployment, ensure you have:

### ✅ AWS Setup
- [ ] AWS Amplify app created
- [ ] IAM user with proper permissions
- [ ] AWS credentials are valid and active

### ✅ GitHub Setup
- [ ] All required secrets added to GitHub repository:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AMPLIFY_APP_ID`
  - `AMPLIFY_BRANCH_NAME`

### ✅ Project Setup
- [ ] Next.js build works locally (`npm run build`)
- [ ] No TypeScript or linting errors
- [ ] All dependencies are up to date

## Testing Steps

### 1. Local Build Test

First, ensure your app builds successfully locally:

```bash
# Install dependencies
npm ci

# Run the build
npm run build

# Test the built app
npm start
```

Visit `http://localhost:3000` and verify everything works correctly.

### 2. Trigger Deployment

#### Option A: Push to Main Branch
```bash
git add .
git commit -m "feat: setup AWS Amplify deployment"
git push origin main
```

#### Option B: Manual Trigger
1. Go to GitHub → Your Repository → Actions
2. Select "Deploy to AWS Amplify" workflow
3. Click "Run workflow"
4. Select the branch and click "Run workflow"

### 3. Monitor Deployment

#### GitHub Actions
1. Go to the **Actions** tab in your GitHub repository
2. Click on the running workflow
3. Monitor each step for errors
4. Common checkpoints:
   - ✅ Checkout code
   - ✅ Setup Node.js
   - ✅ Install dependencies
   - ✅ Build Next.js app
   - ✅ Configure AWS credentials
   - ✅ Deploy to AWS Amplify

#### AWS Amplify Console
1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Select your app
3. Monitor the deployment progress
4. Check build logs for any errors

### 4. Verify Deployment

Once deployment completes:

1. **Check the URL**: Your app should be available at `https://[branch-name].[app-id].amplifyapp.com`
2. **Test functionality**: Verify all features work correctly
3. **Check console for errors**: Open browser dev tools and check for JavaScript errors
4. **Test on mobile**: Ensure responsive design works

## Common Issues and Solutions

### Build Failures

#### Issue: `npm ci` fails
```
Error: Cannot find module 'xyz'
```
**Solution**: Check your `package.json` and ensure all dependencies are listed correctly.

#### Issue: TypeScript errors
```
Type error: Property 'xyz' does not exist
```
**Solution**: Fix TypeScript errors locally first, then redeploy.

#### Issue: Next.js build fails
```
Build error occurred
```
**Solution**: Run `npm run build` locally to see the full error message.

### AWS Authentication Issues

#### Issue: AWS credentials invalid
```
Error: The security token included in the request is invalid
```
**Solution**: 
1. Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are correct
2. Check if credentials have expired
3. Ensure IAM user has necessary permissions

#### Issue: Amplify app not found
```
Error: App with id 'xyz' not found
```
**Solution**: Verify `AMPLIFY_APP_ID` secret is correct.

### Deployment Issues

#### Issue: Deployment times out
**Solution**: Check AWS Amplify console for detailed logs.

#### Issue: Site shows 404 or blank page
**Solution**: 
1. Check if the build artifacts are correct
2. Verify Next.js configuration
3. Check browser console for errors

## Rollback Process

If deployment fails or breaks your site:

### Option 1: AWS Amplify Console
1. Go to AWS Amplify Console
2. Select your app
3. Go to "Deployments" tab
4. Find a previous successful deployment
5. Click "Promote to main"

### Option 2: GitHub Revert
1. Find the last working commit in GitHub
2. Revert to that commit:
   ```bash
   git revert HEAD~1
   git push origin main
   ```

## Performance Testing

After successful deployment, test performance:

### Lighthouse Audit
1. Open Chrome Dev Tools
2. Go to "Lighthouse" tab
3. Run audit for Performance, Accessibility, Best Practices, SEO

### Load Testing
Test with tools like:
- GTmetrix
- PageSpeed Insights
- WebPageTest

## Monitoring Setup

### CloudWatch
Set up CloudWatch monitoring for:
- Error rates
- Response times
- Request counts

### Alerts
Create alerts for:
- High error rates
- Slow response times
- Failed deployments

## Troubleshooting Commands

### GitHub Actions Debug
Enable debug logging by adding these secrets:
- `ACTIONS_STEP_DEBUG`: `true`
- `ACTIONS_RUNNER_DEBUG`: `true`

### AWS CLI Debug
Test AWS credentials locally:
```bash
aws sts get-caller-identity
aws amplify list-apps
aws amplify get-app --app-id YOUR_APP_ID
```

### Next.js Debug
Test build locally with verbose output:
```bash
npm run build -- --debug
```

## Success Criteria

✅ **Deployment is successful when:**
- GitHub Actions workflow completes without errors
- AWS Amplify shows "Deploy successful" status
- Website loads correctly at the Amplify URL
- All functionality works as expected
- No console errors in browser
- Lighthouse score is acceptable (>90 for Performance)

## Getting Help

If you encounter issues:

1. **Check logs**: GitHub Actions and AWS Amplify console logs
2. **Review documentation**: AWS Amplify and GitHub Actions docs
3. **Search for errors**: Copy exact error messages to search engines
4. **Ask for help**: Create GitHub issues or ask in relevant communities

## Next Steps

After successful deployment:
- Set up custom domain
- Configure environment variables
- Set up monitoring and alerts
- Implement automatic testing
- Set up staging environments
