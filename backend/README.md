# Backend for OpenAI Proxy

This is a simple Express server that proxies requests to the OpenAI API. It keeps your API key secure and allows your frontend to make requests without exposing the key.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in this directory with the following content:
   ```env
   OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE
   ```
   Replace `YOUR_OPENAI_API_KEY_HERE` with your actual OpenAI API key.

## Usage

Start the server:
```bash
npm start
```

The server will run on port 5000 by default. Your frontend should send POST requests to `/api/openai` with the required payload. 