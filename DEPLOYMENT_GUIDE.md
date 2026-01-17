# Deployment Guide

This guide will help you deploy your Resume Analyzer project to production.

## Recommended Setup

**Frontend**: Vercel (you're familiar with it, perfect for React)  
**Backend**: Railway or Render (easy Node.js deployment, free tiers available)

---

## Option 1: Vercel (Frontend) + Railway (Backend) ⭐ Recommended

### Why This Combo?
- **Vercel**: Best-in-class React deployment, you already know it
- **Railway**: Super easy backend deployment, just connect GitHub repo
- Both have free tiers perfect for portfolio projects

### Step 1: Deploy Backend to Railway

1. **Sign up for Railway**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Select the `backend` folder` as the root

3. **Configure Environment Variables**
   - In Railway project settings, go to "Variables"
   - Add all your API keys:
     ```
     OPENAI_API_KEY=your_key_here
     ANTHROPIC_API_KEY=your_key_here
     GOOGLE_API_KEY=your_key_here
     PORT=5001
     NODE_ENV=production
     ```

4. **Deploy**
   - Railway will auto-detect Node.js and deploy
   - Note the generated URL (e.g., `https://your-app.railway.app`)

### Step 2: Update Frontend API URL

1. **Create environment file**
   ```bash
   cd onboarding-project
   ```
   Create `.env.production`:
   ```
   REACT_APP_API_URL=https://your-backend-url.railway.app
   ```

2. **Update api-client.ts** (if needed)
   - Check that it uses `process.env.REACT_APP_API_URL` or defaults to localhost

### Step 3: Deploy Frontend to Vercel

1. **Push to GitHub** (if not already)
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - **Important**: Set root directory to `onboarding-project`
   - Add environment variable:
     ```
     REACT_APP_API_URL=https://your-backend-url.railway.app
     ```
   - Click "Deploy"

3. **Update CORS in Backend**
   - In Railway, update your backend to allow your Vercel domain
   - Or set CORS to allow all origins in production:
     ```javascript
     app.use(cors({
       origin: process.env.NODE_ENV === 'production' 
         ? ['https://your-frontend.vercel.app'] 
         : 'http://localhost:3000'
     }));
     ```

---

## Option 2: Vercel (Frontend) + Render (Backend)

### Why Render?
- Similar to Railway, very easy
- Free tier with automatic SSL
- Good for portfolio projects

### Step 1: Deploy Backend to Render

1. **Sign up for Render**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Settings:
     - **Name**: resume-analyzer-backend
     - **Root Directory**: `backend`
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: Free

3. **Add Environment Variables**
   - In the "Environment" section, add:
     ```
     OPENAI_API_KEY=your_key_here
     ANTHROPIC_API_KEY=your_key_here
     GOOGLE_API_KEY=your_key_here
     PORT=10000
     NODE_ENV=production
     ```
   - Note: Render uses port 10000 by default

4. **Update Backend for Render**
   - Render provides `PORT` automatically, but update server.js:
     ```javascript
     const PORT = process.env.PORT || 5001;
     ```
   - This should already be correct!

5. **Deploy**
   - Click "Create Web Service"
   - Render will deploy automatically
   - Note the URL (e.g., `https://your-app.onrender.com`)

### Step 2 & 3: Same as Railway (update frontend and deploy to Vercel)

---

## Option 3: Render for Both (All-in-One)

If you want everything in one place:

1. **Deploy Backend** (same as Option 2, Step 1)
2. **Deploy Frontend to Render**
   - Create new "Static Site"
   - Root Directory: `onboarding-project`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `build`
   - Add environment variable: `REACT_APP_API_URL=https://your-backend.onrender.com`

---

## Quick Setup Checklist

### Before Deployment:
- [ ] Test locally that everything works
- [ ] Ensure all API keys are set up
- [ ] Update CORS settings for production
- [ ] Test the resume editor and PDF export
- [ ] Check that environment variables are correct

### Backend Checklist:
- [ ] Deployed to Railway/Render
- [ ] Environment variables added
- [ ] Backend URL noted
- [ ] CORS configured for frontend domain
- [ ] Health check endpoint works: `https://your-backend-url/api/health`

### Frontend Checklist:
- [ ] `.env.production` created with backend URL
- [ ] Deployed to Vercel
- [ ] Environment variable `REACT_APP_API_URL` set in Vercel
- [ ] Test that frontend can connect to backend
- [ ] Test resume upload and analysis

---

## Environment Variables Reference

### Backend (.env in Railway/Render):
```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
PORT=5001 (or 10000 for Render)
NODE_ENV=production
```

### Frontend (.env.production or Vercel):
```
REACT_APP_API_URL=https://your-backend-url.railway.app
```

---

## Troubleshooting

### Frontend can't connect to backend
- Check CORS settings in backend
- Verify `REACT_APP_API_URL` is set correctly
- Check browser console for errors
- Verify backend is running (check health endpoint)

### Backend deployment fails
- Check Railway/Render logs
- Verify all dependencies are in `package.json`
- Ensure `server.js` is the entry point
- Check that PORT is set correctly

### API keys not working
- Verify keys are set in production environment
- Check that keys are not expired
- Ensure keys have proper permissions

---

## Recommended: Railway + Vercel

**Why?**
- Railway is the easiest backend deployment (just connect GitHub)
- Vercel is the best for React (you already know it)
- Both have excellent free tiers
- Perfect for portfolio/resume projects
- Easy to update and maintain

**Time to deploy**: ~15-20 minutes total

---

## Next Steps After Deployment

1. Test the full flow: upload resume → get analysis → use editor
2. Add your deployed URL to your resume/portfolio
3. Consider adding a custom domain (optional)
4. Monitor usage and costs (free tiers are generous)

Good luck with your deployment! 🚀
