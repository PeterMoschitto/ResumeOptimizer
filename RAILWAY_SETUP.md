# Railway Backend Setup - Step by Step

## Setting Root Directory to `backend`

### Method 1: During Initial Setup

1. **Create New Project**
   - Click "New Project" on Railway dashboard
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will auto-deploy

2. **Set Root Directory**
   - Click on the newly created service
   - Go to **"Settings"** tab (gear icon)
   - Find **"Root Directory"** section
   - Click the folder icon or "Change" button
   - Enter: `backend`
   - Click "Save"
   - Railway will redeploy automatically

### Method 2: After Project is Created

If you already created the project:

1. **Open Your Service**
   - Click on your service in the Railway dashboard

2. **Go to Settings**
   - Click the **"Settings"** tab (gear icon on the right)

3. **Find Root Directory**
   - Scroll down to find **"Root Directory"** section
   - It should currently show `/` or be empty

4. **Change Root Directory**
   - Click the folder icon or "Change" button next to Root Directory
   - In the input field, type: `backend`
   - Click "Save" or "Update"

5. **Redeploy**
   - Railway will automatically detect the change
   - It will redeploy with the new root directory
   - Watch the deployment logs to confirm it's using the `backend` folder

### Visual Guide

```
Railway Dashboard
└── Your Project
    └── Your Service
        ├── Deployments (tab)
        ├── Metrics (tab)
        ├── Settings (tab) ← Click here
        │   ├── General
        │   ├── Root Directory ← Find this section
        │   │   └── [Change] button → Type "backend"
        │   ├── Environment Variables
        │   └── ...
```

### Verification

After setting the root directory, check:

1. **Deployment Logs**
   - Go to "Deployments" tab
   - Check the latest deployment log
   - You should see it running `npm install` from the `backend` folder
   - Should see `server.js` being executed

2. **File Structure**
   - Railway should now see:
     - `backend/package.json`
     - `backend/server.js`
     - `backend/services/`

### Troubleshooting

**If Root Directory option is not visible:**
- Make sure you're in the Settings tab of the service (not the project)
- Try refreshing the page
- Some Railway interfaces show it under "General" settings

**If deployment fails after setting root directory:**
- Check that `backend/package.json` exists
- Verify `backend/server.js` exists
- Check deployment logs for errors
- Ensure `package.json` has a `start` script: `"start": "node server.js"`

**If it's still deploying from root:**
- Delete the service and create a new one
- Or use Railway CLI to set it programmatically

### Alternative: Use Railway CLI

If the UI doesn't work, you can use Railway CLI:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Set root directory
railway variables set RAILWAY_ROOT_DIRECTORY=backend
```

---

**Next Step**: After root directory is set, add your environment variables in the Settings → Variables section.
