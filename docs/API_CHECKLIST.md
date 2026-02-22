# 📋 API Configuration Checklist

## Quick Reference Guide for All Required API Keys

Use this checklist to ensure you have all necessary credentials before starting setup.

---

## 1. WhatsApp Business API ✅

### Required Information

- [ ] **Access Token** (Permanent)
- [ ] **Phone Number ID**
- [ ] **Business Account ID**
- [ ] **Verify Token** (custom string you create)
- [ ] **App ID**
- [ ] **App Secret**

### Where to Get

1. Go to [Meta Developer Console](https://developers.facebook.com/)
2. Create App → Select "Business"
3. Add WhatsApp Product
4. Navigate to API Setup section

### How to Test

```bash
curl -X GET "https://graph.facebook.com/v18.0/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**

```json
{
  "id": "123456789",
  "name": "Your App Name"
}
```

### Common Issues

- ❌ **Token expired**: Generate new permanent token
- ❌ **Phone number not verified**: Complete verification in Business Manager
- ❌ **Webhook failing**: Check verify token matches exactly

---

## 2. OpenAI API ✅

### Required Information

- [ ] **API Key** (starts with sk-proj-)
- [ ] **Organization ID** (optional)

### Where to Get

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up/Login
3. Navigate to API Keys
4. Create New Secret Key

### Models Used

- `gpt-4o-mini` - Primary conversational AI
- `gpt-4o` - Image analysis (vision)
- `whisper-1` - Voice transcription
- `gpt-4o-nano` - Service name matching

### How to Test

```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

**Expected Response:**

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      }
    }
  ]
}
```

### Pricing (as of Feb 2026)

- GPT-4o-mini: ~$0.001 per request
- Whisper: ~$0.006 per minute
- GPT-4o Vision: ~$0.01 per image

### Common Issues

- ❌ **Insufficient credits**: Add payment method
- ❌ **Rate limit exceeded**: Upgrade plan or wait
- ❌ **Model not found**: Check model name spelling

---

## 3. Anthropic API (Claude) ✅

### Required Information

- [ ] **API Key** (starts with sk-ant-)
- [ ] **Workspace ID** (optional)

### Where to Get

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create account / Login
3. Navigate to API Keys
4. Generate New Key

### Models Used

- `claude-sonnet-4-20250514` - Advanced booking agent via MCP

### How to Test

```bash
curl https://api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

**Expected Response:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "Hello! How can I assist you today?"
    }
  ],
  "model": "claude-sonnet-4-20250514",
  "role": "assistant"
}
```

### Pricing

- Claude Sonnet 4: ~$0.003 per request
- High reasoning capability
- Excellent tool use

### Common Issues

- ❌ **API key invalid**: Regenerate key
- ❌ **Model unavailable**: Check model string
- ❌ **Credits exhausted**: Add payment method

---

## 4. Google Gemini API ✅

### Required Information

- [ ] **API Key** (starts with AIzaSy)

### Where to Get

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google Account
3. Create API Key

### Models Used

- `gemini-2.0-flash-exp` - Backup/fallback model

### How to Test

```bash
curl "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{"text": "Hello!"}]
    }]
  }'
```

**Expected Response:**

```json
{
  "candidates": [
    {
      "content": {
        "parts": [{ "text": "Hello! How can I help you?" }]
      }
    }
  ]
}
```

### Pricing

- **FREE TIER**: 60 requests per minute
- Excellent for backup/fallback
- No credit card required

### Common Issues

- ❌ **API key restricted**: Enable required APIs
- ❌ **Quota exceeded**: Wait or upgrade
- ❌ **Region blocked**: Use VPN or different region

---

## 5. Google Calendar API ✅

### Required Information

- [ ] **Client ID** (ends with .apps.googleusercontent.com)
- [ ] **Client Secret**
- [ ] **Refresh Token**
- [ ] **Calendar ID** (usually your Gmail address)

### Where to Get

#### Step 1: Enable API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create New Project: "Salon Bot"
3. Enable "Google Calendar API"

#### Step 2: Create OAuth Credentials

1. Navigate to "Credentials"
2. Create Credentials → OAuth Client ID
3. Application type: Web application
4. Authorized redirect URIs: `https://developers.google.com/oauthplayground`
5. **Save Client ID and Secret**

#### Step 3: Get Refresh Token

1. Go to [OAuth Playground](https://developers.google.com/oauthplayground)
2. Click Settings (gear icon)
3. Check "Use your own OAuth credentials"
4. Enter Client ID and Secret
5. In left panel, select "Google Calendar API v3"
6. Select scope: `https://www.googleapis.com/auth/calendar`
7. Click "Authorize APIs"
8. Sign in with Google
9. Click "Exchange authorization code for tokens"
10. **Copy Refresh Token**

#### Step 4: Get Calendar ID

1. Open Google Calendar
2. Settings → Settings for my calendars
3. Select calendar
4. Scroll to "Integrate calendar"
5. **Copy Calendar ID**

### How to Test

```bash
# First, get access token from refresh token
curl -X POST https://oauth2.googleapis.com/token \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "refresh_token=YOUR_REFRESH_TOKEN" \
  -d "grant_type=refresh_token"

# Then test calendar access
curl https://www.googleapis.com/calendar/v3/calendars/YOUR_CALENDAR_ID/events \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### Pricing

- **FREE** - No cost for Calendar API

### Common Issues

- ❌ **Token expired**: Tokens last ~1 hour, refresh token lasts indefinitely
- ❌ **403 Forbidden**: Check Calendar API is enabled
- ❌ **Calendar not found**: Verify Calendar ID is correct

---

## 6. Airtable API ✅

### Required Information

- [ ] **Personal Access Token** (starts with pat)
- [ ] **Base ID** (starts with app)

### Where to Get

#### Step 1: Generate PAT

1. Go to [Airtable Account](https://airtable.com/account)
2. Click "Generate token"
3. Give it a name: "Salon Bot"
4. Add scopes:
   - ✅ data.records:read
   - ✅ data.records:write
   - ✅ schema.bases:read
5. Select base access
6. **Copy Personal Access Token**

#### Step 2: Get Base ID

1. Open your Airtable base
2. Click "Help" → "API Documentation"
3. Base ID shown in URL and docs
4. Format: `appXXXXXXXXXXXXXX`

### How to Test

```bash
curl "https://api.airtable.com/v0/YOUR_BASE_ID/Services" \
  -H "Authorization: Bearer YOUR_PAT"
```

**Expected Response:**

```json
{
  "records": [
    {
      "id": "recXXXXXXXXXXXXXX",
      "fields": {
        "name": "Service Name"
      }
    }
  ]
}
```

### Pricing

- **FREE TIER**: Up to 1,200 records per base
- **Plus**: $10/month - Unlimited records
- **Pro**: $20/month - Advanced features

### Common Issues

- ❌ **Invalid token**: Regenerate PAT
- ❌ **Base not found**: Check Base ID
- ❌ **Permission denied**: Add write scope to PAT
- ❌ **Record limit**: Upgrade plan

---

## 7. Redis ✅

### Required Information

- [ ] **Host** (e.g., redis-12345.c1.us-east-1-1.ec2.cloud.redislabs.com)
- [ ] **Port** (usually 6379)
- [ ] **Password**
- [ ] **Database** (usually 0)

### Where to Get

#### Option A: Redis Cloud (Recommended)

1. Go to [Redis Cloud](https://redis.com/try-free/)
2. Create free account
3. Create new database
4. **Copy connection details**

#### Option B: Local Redis

```bash
# Install Redis (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis
sudo systemctl enable redis

# Connection:
# Host: localhost
# Port: 6379
# Password: (none by default)
```

### How to Test

```bash
# Test connection
redis-cli -h YOUR_HOST -p 6379 -a YOUR_PASSWORD ping

# Should return: PONG

# Test basic operations
redis-cli -h YOUR_HOST -p 6379 -a YOUR_PASSWORD
> SET test "Hello"
> GET test
> DEL test
```

### Pricing

- **FREE TIER**: 30MB storage, plenty for this use case
- **Paid**: From $5/month for larger storage

### Common Issues

- ❌ **Connection refused**: Check host/port
- ❌ **Authentication failed**: Verify password
- ❌ **Timeout**: Check firewall rules

---

## 8. n8n ✅

### Required Information

- [ ] **Webhook URL** (from n8n after importing workflow)
- [ ] **Instance URL** (your n8n installation)

### Where to Get

#### Option A: n8n Cloud

1. Go to [n8n.cloud](https://n8n.cloud/)
2. Sign up for account
3. Create workspace
4. **URL**: `https://[your-name].app.n8n.cloud`

#### Option B: Self-Hosted

```bash
# Docker installation
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# Your URL: http://localhost:5678
```

### After Import

1. Import workflow JSON
2. Open "WhatsApp Webhook" node
3. **Copy Webhook URLs**:
   - Production: `https://your-n8n.com/webhook/webhook-whatsapp`
   - Test: `https://your-n8n.com/webhook-test/webhook-whatsapp`

### Pricing

- **Self-Hosted**: FREE (requires server)
- **Cloud Starter**: $20/month
- **Cloud Pro**: $50/month

### Common Issues

- ❌ **Workflow won't activate**: Check credentials
- ❌ **Webhook not found**: Workflow must be active
- ❌ **Execution failed**: Check node errors

---

## ✅ Final Checklist

Before starting setup, verify you have:

### API Keys

- [ ] WhatsApp Access Token (permanent)
- [ ] WhatsApp Phone Number ID
- [ ] WhatsApp Verify Token (custom)
- [ ] OpenAI API Key
- [ ] Anthropic API Key (Claude)
- [ ] Google Gemini API Key
- [ ] Airtable Personal Access Token
- [ ] Airtable Base ID

### OAuth Credentials

- [ ] Google Client ID
- [ ] Google Client Secret
- [ ] Google Refresh Token
- [ ] Google Calendar ID

### Infrastructure

- [ ] Redis Host/Port/Password
- [ ] n8n Instance URL
- [ ] n8n Webhook URL

### Optional

- [ ] Sentry DSN (error tracking)
- [ ] Twilio credentials (SMS)
- [ ] SendGrid key (email)
- [ ] Stripe keys (payments)

---

## 🔐 Security Best Practices

### Storage

- ✅ Store all keys in `.env` file
- ✅ Add `.env` to `.gitignore`
- ✅ Never commit credentials to git
- ✅ Use environment-specific `.env` files

### Access Control

- ✅ Enable 2FA on all accounts
- ✅ Use least-privilege access for API keys
- ✅ Regularly rotate credentials (every 90 days)
- ✅ Monitor API usage for anomalies

### Backup

- ✅ Keep backup of all credentials in secure location
- ✅ Document which keys are for which environment
- ✅ Have rollback plan for key rotation

---

## 📊 Cost Summary

### Minimum Monthly Cost (1,000 conversations)

| Service         | Cost       |
| --------------- | ---------- |
| WhatsApp        | $10-20     |
| OpenAI          | $5-10      |
| Anthropic       | $10-15     |
| Gemini          | FREE       |
| Google Calendar | FREE       |
| Airtable        | FREE       |
| Redis           | FREE       |
| n8n             | $0-20      |
| **Total**       | **$25-65** |

### Scaling Costs (5,000 conversations)

| Service   | Cost         |
| --------- | ------------ |
| WhatsApp  | $50-100      |
| OpenAI    | $25-50       |
| Anthropic | $50-75       |
| Airtable  | $10-20       |
| Redis     | $5-10        |
| n8n       | $20-50       |
| **Total** | **$160-305** |

---

## 🆘 Need Help?

### Documentation

- [Complete Setup Guide](SETUP_GUIDE.md)
- [Troubleshooting](TROUBLESHOOTING.md)
- [README](README.md)

### API Documentation

- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [OpenAI API](https://platform.openai.com/docs)
- [Anthropic API](https://docs.anthropic.com)
- [Google Calendar API](https://developers.google.com/calendar)
- [Airtable API](https://airtable.com/api)

### Testing Tools

- [Postman Collection](postman-collection.json) - Import for quick API testing
- [Webhook Tester](https://webhook.site/) - Test webhooks
- [JSON Validator](https://jsonlint.com/) - Validate JSON

---

**✨ Once you have all credentials, proceed to [SETUP_GUIDE.md](SETUP_GUIDE.md) for step-by-step installation!**
