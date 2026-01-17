# API Keys Setup Guide

This guide will help you obtain API keys for each AI provider used in this project.

## 📋 Required vs Optional API Keys

### ✅ **Minimum Required:**
- **OpenAI API Key** - Required for basic functionality

### 🔹 **Optional (for Multi-AI Comparison):**
- **Anthropic API Key** - For Claude AI analysis
- **Google API Key** - For Gemini AI analysis

**Note:** You need at least ONE API key (OpenAI) to use the application. The more providers you configure, the better the comparison analysis will be.

---

## 🔑 Provider 1: OpenAI (Required)

### What it's used for:
- Primary AI provider for resume analysis
- Used in single-AI mode
- Required for the application to function

### How to get your OpenAI API Key:

1. **Go to OpenAI Platform:**
   - Visit: https://platform.openai.com/
   - Sign up or log in with your account

2. **Navigate to API Keys:**
   - Click on your profile icon (top right)
   - Select "API keys" from the dropdown
   - Or go directly to: https://platform.openai.com/api-keys

3. **Create a new key:**
   - Click "Create new secret key"
   - Give it a name (e.g., "Resume Analyzer")
   - Click "Create secret key"
   - **⚠️ IMPORTANT:** Copy the key immediately - you won't be able to see it again!

4. **Your key format:**
   - Starts with `sk-` or `sk-proj-`
   - Example: `sk-proj-abc123def456...`

5. **Billing Setup:**
   - OpenAI uses a pay-as-you-go model
   - You'll need to add a payment method: https://platform.openai.com/account/billing
   - Check pricing: https://openai.com/pricing
   - GPT-4 costs approximately $0.03 per 1K input tokens and $0.06 per 1K output tokens

---

## 🔑 Provider 2: Anthropic Claude (Optional)

### What it's used for:
- Alternative AI provider for comparison
- Uses Claude 3.5 Sonnet model
- Provides different perspective on resume analysis

### How to get your Anthropic API Key:

1. **Go to Anthropic Console:**
   - Visit: https://console.anthropic.com/
   - Sign up or log in

2. **Navigate to API Keys:**
   - Click "API Keys" in the left sidebar
   - Or go directly to: https://console.anthropic.com/settings/keys

3. **Create a new key:**
   - Click "Create Key"
   - Give it a name (e.g., "Resume Analyzer")
   - Click "Create Key"
   - **⚠️ IMPORTANT:** Copy the key immediately!

4. **Your key format:**
   - Starts with `sk-ant-`
   - Example: `sk-ant-api03-abc123def456...`

5. **Billing Setup:**
   - Anthropic uses a pay-as-you-go model with credits
   - **You MUST add credits to use the API** - go to: https://console.anthropic.com/settings/billing
   - Check pricing: https://www.anthropic.com/pricing
   - **Claude 3 Haiku** (used by default): ~$0.25 per 1M input tokens, ~$1.25 per 1M output tokens (very affordable!)
   - Claude 3.5 Sonnet: ~$3 per 1M input tokens, ~$15 per 1M output tokens
   - **Note:** The app uses Claude Haiku by default for better free tier access

---

## 🔑 Provider 3: Google Gemini (Optional)

### What it's used for:
- Alternative AI provider for comparison
- Uses Gemini Pro model
- Provides different perspective on resume analysis

### How to get your Google API Key:

1. **Go to Google AI Studio:**
   - Visit: https://makersuite.google.com/app/apikey
   - Sign in with your Google account

2. **Create API Key:**
   - Click "Create API Key" button
   - Select "Create API key in new project" (or choose existing project)
   - Your API key will be generated automatically

3. **Copy your key:**
   - **⚠️ IMPORTANT:** Copy the key immediately!
   - The key will be displayed in a popup

4. **Your key format:**
   - Long alphanumeric string
   - Example: `AIzaSyAbc123Def456Ghi789Jkl012Mno345Pqr678`

5. **Billing Setup:**
   - Google offers generous free tier with limits
   - Check current pricing: https://ai.google.dev/pricing
   - **Gemini 1.5 Flash** (used by default): Free tier available, then pay-as-you-go
   - Gemini 1.5 Pro: Free tier with limits, then pay-as-you-go
   - **Note:** The app tries Gemini Flash first (free tier), then falls back to Pro if needed

---

## 📝 Adding Keys to Your Backend

Once you have your API keys, add them to `backend/.env`:

```env
# Server Configuration
PORT=5001

# OpenAI API Key (Required)
OPENAI_API_KEY=sk-proj-your-actual-openai-key-here

# Anthropic API Key (Optional)
ANTHROPIC_API_KEY=sk-ant-your-actual-anthropic-key-here

# Google API Key (Optional)
GOOGLE_API_KEY=AIzaSy-your-actual-google-key-here
```

**Important Notes:**
- Never commit your `.env` file to git
- Keep your API keys secret
- Each key should be on its own line
- No quotes needed around the key values
- Remove any spaces before/after the `=` sign

---

## 💰 Cost Estimates

### For a typical resume analysis (approximately 2000 tokens):

- **OpenAI GPT-4:** ~$0.10-0.15 per analysis
- **Anthropic Claude:** ~$0.01-0.02 per analysis
- **Google Gemini:** Free tier available, then ~$0.001-0.002 per analysis

### Tips to reduce costs:
- Use caching (already implemented - same resume/job title won't be re-analyzed)
- Start with just OpenAI to test
- Add other providers when you want comparison features

---

## ✅ Testing Your Setup

After adding your keys to `backend/.env`, restart the backend:

```bash
cd backend
npm start
```

You should see:
```
Server is running on port 5001
Configured providers: openai, anthropic, google
```

Test the health endpoint:
```bash
curl http://localhost:5001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "providers": ["openai", "anthropic", "google"]
}
```

---

## 🆘 Troubleshooting

### "No providers configured"
- Check that your `.env` file is in the `backend/` directory
- Verify the key names are exactly: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`
- Make sure there are no extra spaces or quotes

### "Invalid API key" errors
- Verify you copied the entire key (they're long!)
- Check for any hidden characters or line breaks
- Regenerate the key if needed

### Billing/quota errors
- Ensure you've added a payment method
- Check your account has available credits/quota
- Review usage limits in each provider's dashboard

---

## 🔒 Security Best Practices

1. **Never share your API keys publicly**
2. **Don't commit `.env` files to version control**
3. **Rotate keys periodically**
4. **Use environment-specific keys for production**
5. **Monitor usage regularly** to detect any unauthorized use

---

Need help? Check the main README.md or open an issue in the repository.
