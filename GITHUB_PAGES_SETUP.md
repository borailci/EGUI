# GitHub Pages Deployment Setup

This document explains how to set up GitHub Pages deployment for the Trip Organizer React frontend.

## Prerequisites

Before deploying to GitHub Pages, you need to:

1. **Enable GitHub Pages** in your repository settings
2. **Set up GitHub Actions** permissions
3. **Configure environment variables** (optional)

## Setup Instructions

### 1. Enable GitHub Pages

1. Go to your GitHub repository
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. Save the configuration

### 2. Configure GitHub Actions Permissions

1. Go to **Settings** → **Actions** → **General**
2. Under **Workflow permissions**, select:
   - ✅ **Read and write permissions**
   - ✅ **Allow GitHub Actions to create and approve pull requests**

### 3. Environment Variables (Optional)

If you want to customize the API URL, add these repository secrets:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add repository secrets:
   - `REACT_APP_API_URL` - Your backend API URL (e.g., `https://your-api.herokuapp.com`)

## Deployment Process

The deployment happens automatically when:

- You push to the `main` branch
- Files in `Lab4/trip-organizer-web/` are changed
- You manually trigger the workflow

### Manual Deployment

To manually trigger a deployment:

1. Go to **Actions** tab in your repository
2. Select **Deploy Frontend to GitHub Pages**
3. Click **Run workflow** → **Run workflow**

## Build Configuration

The deployment process:

1. **Installs dependencies** with `npm ci`
2. **Creates production config** with:
   - `REACT_APP_API_URL` - Backend API endpoint
   - `GENERATE_SOURCEMAP=false` - Disable source maps for security
   - `PUBLIC_URL=/EGUI` - Set correct path for GitHub Pages
3. **Builds the React app** with `npm run build`
4. **Deploys to GitHub Pages** using official GitHub actions

## Accessing Your Application

After successful deployment, your app will be available at:

```
https://[your-username].github.io/EGUI/
```

For example:

```
https://borailci.github.io/EGUI/
```

## Frontend Configuration

The React app is configured for GitHub Pages with:

### package.json

```json
{
  "homepage": "/EGUI"
}
```

### .env.production (generated during build)

```
REACT_APP_API_URL=https://your-api-domain.com
GENERATE_SOURCEMAP=false
PUBLIC_URL=/EGUI
```

## API Integration

For the frontend to work with your backend API:

1. **Deploy your backend** to a cloud service (Heroku, Railway, Render, etc.)
2. **Update the API URL** in the GitHub workflow or repository secrets
3. **Configure CORS** in your backend to allow your GitHub Pages URL

### Backend CORS Configuration

Add your GitHub Pages URL to the CORS allowed origins:

```json
{
  "Cors": {
    "AllowedOrigins": ["https://borailci.github.io"]
  }
}
```

## Troubleshooting

### Common Issues

1. **404 on refresh**: React Router needs proper configuration

   - Ensure `BrowserRouter` is used with `basename="/EGUI"`

2. **API calls failing**: Check CORS and API URL

   - Verify `REACT_APP_API_URL` is correct
   - Check browser console for CORS errors

3. **Build failures**: Check dependencies and scripts
   - Ensure all dependencies are in `package.json`
   - Check for any TypeScript errors

### Debug Steps

1. **Check Actions logs**: Go to Actions tab → Failed workflow → View logs
2. **Verify API URL**: Check if your backend is accessible
3. **Test locally**: Run `npm run build` locally to check for errors
4. **Check Pages settings**: Ensure GitHub Pages source is set to "GitHub Actions"

## Monitoring Deployments

You can monitor deployments:

- **Actions tab**: See all workflow runs
- **Environments**: Check deployment history
- **Repository settings**: Verify Pages configuration

## Security Considerations

- Source maps are disabled in production (`GENERATE_SOURCEMAP=false`)
- Sensitive data should not be included in frontend builds
- Use environment variables for configuration
- API endpoints should use HTTPS

## Next Steps

After successful frontend deployment:

1. Deploy your backend API to a cloud service
2. Update API URL in deployment configuration
3. Test the full application flow
4. Set up monitoring and analytics
5. Configure custom domain (optional)
