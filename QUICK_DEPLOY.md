# Quick Deployment Guide 🚀

## Recommended: Vercel (Frontend) + Railway (Backend)

This is the **easiest and fastest** way to deploy your project.

---

## Step 1: Push to GitHub

1. **Initialize Git** (if not already done)
   ```bash
   cd "/Users/petermoschitto/Desktop/Side-Projects/Onboarding Project"
   git init
   git add .
   git commit -m "Ready for deployment"
   ```

2. **Create GitHub Repository**
   - Go to [github.com](https://github.com)
   - Click "New repository"
   - Name it (e.g., `resume-analyzer` or `ai-resume-comparison`)
   - Don't initialize with README (you already have files)
   - Click "Create repository"

3. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```
   Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repo name.

---

## Step 2: Deploy Backend to Railway (5 minutes)

1. **Go to [railway.app](https://railway.app)** and sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository (the one you just pushed)
   - Railway will start deploying automatically

3. **Set Root Directory to `backend`**
   - After the project is created, click on the service
   - Go to the **"Settings"** tab
   - Scroll down to **"Root Directory"** section
   - Click the folder icon or "Change" button
   - Type or select: `backend`
   - Click "Save" or "Update"
   - Railway will automatically redeploy with the new root directory

4. **Add Environment Variables**
   - In Railway project → Variables tab, add:
     ```
     OPENAI_API_KEY=your_key_here
     ANTHROPIC_API_KEY=your_key_here (optional)
     GOOGLE_API_KEY=your_key_here (optional)
     PORT=5001
     NODE_ENV=production
     FRONTEND_URL=https://your-frontend.vercel.app (add after Step 3)
     ```

5. **Deploy**
   - Railway auto-detects Node.js and deploys
   - Copy the URL (e.g., `https://your-app.up.railway.app`)

---

## Step 3: Deploy Frontend to Vercel (5 minutes)

2. **Go to [vercel.com](https://vercel.com)** and sign in

3. **Import Project**
   - Click "Add New Project"
   - Import your GitHub repository
   - **Root Directory**: Set to `onboarding-project`
   - **Framework Preset**: Create React App (auto-detected)

4. **Add Environment Variable**
   - In project settings → Environment Variables:
     ```
     REACT_APP_API_URL=https://your-backend-url.up.railway.app
     ```
   - Replace with your actual Railway backend URL

5. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - Copy your frontend URL (e.g., `https://your-app.vercel.app`)

6. **Update Backend CORS**
   - Go back to Railway
   - Update `FRONTEND_URL` variable with your Vercel URL
   - Railway will auto-restart

---

## Step 4: Test Everything

1. Visit your Vercel URL
2. Upload a resume
3. Check that it connects to the backend
4. Test the analysis
5. Test the resume editor

---

## Alternative: Render (if Railway doesn't work)

### Backend on Render:
1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repo
4. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add environment variables (same as Railway)
6. Deploy

**Note**: Render uses port 10000 by default, but your code already handles `process.env.PORT` correctly.

---

## Environment Variables Summary

### Backend (Railway/Render):
```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-... (optional)
GOOGLE_API_KEY=... (optional)
PORT=5001
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app
```

### Frontend (Vercel):
```
REACT_APP_API_URL=https://your-backend.up.railway.app
```

---

## Troubleshooting

**Frontend can't connect to backend:**
- Check `REACT_APP_API_URL` is set correctly in Vercel
- Verify backend is running (visit `https://your-backend-url/api/health`)
- Check CORS settings in backend
- Check browser console for errors

**Backend deployment fails:**
- Check Railway/Render logs
- Verify all dependencies in `package.json`
- Ensure `server.js` exists in backend folder
- Check environment variables are set

**API keys not working:**
- Verify keys are correct in production
- Check keys haven't expired
- Ensure keys have proper permissions

---

## Why This Setup?

✅ **Vercel**: Best for React, you know it, instant deployments  
✅ **Railway**: Easiest backend deployment, just connect GitHub  
✅ **Free tiers**: Perfect for portfolio projects  
✅ **Fast**: Both deploy in minutes  
✅ **Easy updates**: Just push to GitHub

**Total deployment time**: ~10-15 minutes

---

## Next Steps

1. ✅ Push code to GitHub
2. ✅ Deploy backend to Railway
3. ✅ Deploy frontend to Vercel  
4. ✅ Test everything works
5. ✅ Add URL to your resume/portfolio
6. 🎉 You're live!

Good luck! 🚀
