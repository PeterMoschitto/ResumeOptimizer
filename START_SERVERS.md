# How to Start the Application

## Quick Start

### 1. Start the Backend Server

Open a terminal and run:
```bash
cd backend
npm start
```

You should see:
```
Server is running on port 5001
Configured providers: openai, anthropic, google
```

### 2. Start the Frontend

Open a **new terminal** and run:
```bash
cd onboarding-project
npm start
```

The frontend will open at `http://localhost:3000`

## Troubleshooting

### Backend Not Starting

1. **Check if port 5001 is already in use:**
   ```bash
   lsof -ti:5001
   ```
   If it returns a PID, kill it:
   ```bash
   lsof -ti:5001 | xargs kill -9
   ```

2. **Check for syntax errors:**
   ```bash
   cd backend
   node -c server.js
   ```

3. **Verify .env file exists:**
   ```bash
   ls backend/.env
   ```
   Make sure it contains your API keys (see `API_KEYS_SETUP.md`)

### Frontend Can't Connect to Backend

1. **Verify backend is running:**
   ```bash
   curl http://localhost:5001/api/health
   ```
   Should return: `{"status":"ok","providers":[...]}`

2. **Check CORS settings** - The backend should have CORS enabled (it does by default)

3. **Check API URL** - Frontend uses `http://localhost:5001` by default

### Network Errors

If you see "Network error. Please check your internet connection":

1. **Make sure backend is running** (see above)
2. **Check browser console** for specific error messages
3. **Verify both servers are running** in separate terminals
4. **Try refreshing the page** after starting the backend

## Running Both Servers

You need **two terminal windows**:

**Terminal 1 (Backend):**
```bash
cd "/Users/petermoschitto/Desktop/Side-Projects/Onboarding Project/backend"
npm start
```

**Terminal 2 (Frontend):**
```bash
cd "/Users/petermoschitto/Desktop/Side-Projects/Onboarding Project/onboarding-project"
npm start
```

## Auto-Start Script (Optional)

You can create a script to start both:

**start-all.sh:**
```bash
#!/bin/bash
cd backend && npm start &
sleep 2
cd ../onboarding-project && npm start
```

Make it executable:
```bash
chmod +x start-all.sh
./start-all.sh
```
