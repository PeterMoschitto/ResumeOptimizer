# Provider Setup Fixes

## Current Status

### ✅ OpenAI
- Working correctly

### ⚠️ Anthropic Claude
**Issue:** Needs credits added to account
**Solution:** 
1. Go to: https://console.anthropic.com/settings/billing
2. Add at least $5 in credits
3. Using Claude Haiku model (very affordable: ~$0.25 per 1M input tokens)

### ⚠️ Google Gemini
**Issue:** Free tier quota is 0 (billing not enabled or quota exhausted)
**Solution:**
1. **Enable Billing in Google Cloud:**
   - Go to: https://console.cloud.google.com/billing
   - Create a billing account or link existing one
   - Even with free tier, Google requires billing to be enabled

2. **Enable Gemini API:**
   - Go to: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com
   - Click "Enable" if not already enabled

3. **Check Quota:**
   - Go to: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
   - Verify free tier quotas are available

4. **Current Models Available:**
   - `gemini-2.0-flash-exp` (experimental)
   - `gemini-2.0-flash` (stable)
   - `gemini-2.5-flash` (latest)
   - `gemini-2.5-pro` (pro version)

## Quick Fix Steps

### For Anthropic:
```bash
# Just add credits at:
https://console.anthropic.com/settings/billing
# Minimum: $5
# Claude Haiku is very cheap (~$0.25 per 1M tokens)
```

### For Google Gemini:
```bash
# 1. Enable billing (required even for free tier)
https://console.cloud.google.com/billing

# 2. Enable Gemini API
https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com

# 3. Check your API key is from:
https://makersuite.google.com/app/apikey
```

## Testing

After setting up, test with:
```bash
cd backend
node test-providers.js
```

This will show you:
- Which API keys are configured
- Available Gemini models
- Any errors from each provider

## Cost Estimates

### Per Resume Analysis (~2000 tokens):

- **OpenAI GPT-4:** ~$0.10-0.15**
- **Anthropic Claude Haiku:** ~$0.0005 (very cheap!)
- **Google Gemini Flash:** Free tier (with billing enabled)

**Note:** The app uses caching, so the same resume/job title won't be re-analyzed.
