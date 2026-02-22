# 🔧 n8n Node & Credential Setup Guide

## Fixing "Node Not Installed" Issues

### Issue: "Fallback to Gemini" Node Not Found

**Problem:** The workflow uses a Google Gemini node that may not be available in your n8n version.

**Solution:** The workflow has been updated to use standard HTTP Request nodes instead. Here's how to configure it:

---

## Setting Up Gemini API (HTTP Request Method)

### Step 1: Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key (starts with `AIzaSy...`)

### Step 2: Configure Credentials in n8n

The updated workflow uses **HTTP Header Auth** for Gemini. Here's how to set it up:

1. **Open the "Fallback to Gemini" node** in your workflow
2. **Click "Credential for Gemini API Auth"**
3. **Create new credential:**
   - Credential Type: **HTTP Header Auth**
   - Name: `Gemini API Auth`
   - Header Name: Leave empty (we're using query param)
   - Value: Your Gemini API key

**Alternative: Using Query Parameters**

The workflow is already configured to use query parameters. Just ensure you have the API key in the credential.

---

## All Required Credentials in n8n

Here's the complete list of credentials you need to configure:

### 1. WhatsApp API Auth

**Type:** HTTP Header Auth

```
Name: WhatsApp API Auth
Header Name: Authorization
Value: Bearer YOUR_PERMANENT_ACCESS_TOKEN
```

### 2. OpenAI API

**Type:** OpenAI

```
Name: OpenAI API
API Key: sk-proj-xxxxxxxxxxxxx
```

### 3. Google Gemini API Auth

**Type:** HTTP Header Auth (or use query parameter in URL)

```
Name: Gemini API Auth
API Key: AIzaSyxxxxxxxxxxxxx
```

_Note: The workflow passes this as a query parameter_

### 4. Redis

**Type:** Redis

```
Name: Redis Credentials
Host: your-redis-host.com
Port: 6379
Password: your_redis_password
Database: 0
```

### 5. Airtable

**Type:** Airtable API

```
Name: Airtable API
Personal Access Token: patxxxxxxxxxxxxx
```

### 6. Google Calendar (OAuth2)

**Type:** Google OAuth2 API

```
Name: Google Calendar OAuth2
Client ID: your_client_id.apps.googleusercontent.com
Client Secret: GOCSPx-xxxxxxxxxxxxx
Auth URI: https://accounts.google.com/o/oauth2/v2/auth
Token URI: https://oauth2.googleapis.com/token
Scope: https://www.googleapis.com/auth/calendar
```

---

## Common n8n Credential Issues

### Issue 1: "Credential Type Not Found"

**Solution:**

- Update n8n to latest version: `npm install -g n8n@latest`
- Or use HTTP Request nodes with manual authentication

### Issue 2: "OAuth2 Connection Failed"

**Solution for Google Calendar:**

```bash
# 1. Verify redirect URI matches:
https://your-n8n-instance.com/rest/oauth2-credential/callback

# 2. Add to Google Cloud Console:
- Go to Credentials
- Edit OAuth Client
- Add authorized redirect URI
- Save
```

### Issue 3: "API Key Invalid"

**Troubleshooting:**

1. Check for extra spaces before/after key
2. Verify key hasn't expired
3. Regenerate key and update
4. Check API is enabled in provider console

---

## Alternative: Using HTTP Request for All AI APIs

If you prefer to avoid custom nodes entirely, here's how to replace them:

### Replace OpenAI Node with HTTP Request

```json
{
  "url": "https://api.openai.com/v1/chat/completions",
  "method": "POST",
  "authentication": "headerAuth",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "Authorization",
        "value": "Bearer {{$credentials.openaiApiKey}}"
      },
      {
        "name": "Content-Type",
        "value": "application/json"
      }
    ]
  },
  "sendBody": true,
  "bodyParameters": {
    "parameters": [
      {
        "name": "model",
        "value": "gpt-4o-mini"
      },
      {
        "name": "messages",
        "value": "={{JSON.stringify($json.messages)}}"
      }
    ]
  }
}
```

### Replace Claude MCP with Direct HTTP Request

```json
{
  "url": "https://api.anthropic.com/v1/messages",
  "method": "POST",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "x-api-key",
        "value": "{{$credentials.anthropicApiKey}}"
      },
      {
        "name": "anthropic-version",
        "value": "2023-06-01"
      },
      {
        "name": "Content-Type",
        "value": "application/json"
      }
    ]
  },
  "sendBody": true,
  "bodyParameters": {
    "parameters": [
      {
        "name": "model",
        "value": "claude-sonnet-4-20250514"
      },
      {
        "name": "max_tokens",
        "value": "1000"
      },
      {
        "name": "messages",
        "value": "={{JSON.stringify($json.messages)}}"
      }
    ]
  }
}
```

---

## Testing Your Credentials

### Test WhatsApp API

```bash
# In n8n, add a test workflow:
# HTTP Request Node
curl -X POST "https://graph.facebook.com/v18.0/YOUR_PHONE_ID/messages" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "YOUR_TEST_PHONE",
    "type": "text",
    "text": {"body": "Test from n8n"}
  }'
```

### Test OpenAI API

```bash
# In n8n HTTP Request node:
URL: https://api.openai.com/v1/chat/completions
Method: POST
Headers:
  Authorization: Bearer YOUR_OPENAI_KEY
  Content-Type: application/json
Body:
{
  "model": "gpt-4o-mini",
  "messages": [{"role": "user", "content": "Hello"}]
}
```

### Test Gemini API

```bash
# In n8n HTTP Request node:
URL: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent
Method: POST
Query Parameters:
  key: YOUR_GEMINI_API_KEY
Body:
{
  "contents": [{
    "parts": [{"text": "Hello"}]
  }]
}
```

### Test Airtable API

```bash
# In n8n HTTP Request node:
URL: https://api.airtable.com/v0/YOUR_BASE_ID/Services
Method: GET
Headers:
  Authorization: Bearer YOUR_AIRTABLE_TOKEN
```

### Test Redis

```bash
# In n8n Redis node:
Operation: Get
Key: test_key

# Should return null if key doesn't exist (this is normal)
```

---

## Simplified Credential Setup (Step-by-Step)

### 1. Create Credentials in n8n

Go to **Settings → Credentials** in n8n:

#### WhatsApp

```
Type: HTTP Header Auth
Name: WhatsApp API Auth
Header Name: Authorization
Value: Bearer YOUR_WHATSAPP_TOKEN
```

#### OpenAI

```
Type: OpenAI (if available) OR HTTP Header Auth
Name: OpenAI API
API Key: sk-proj-YOUR_KEY
```

#### Gemini

```
Type: HTTP Header Auth
Name: Gemini API Auth
(We'll use query param, so this is just for organization)
Note: Add your API key to the workflow's URL query parameter
```

#### Anthropic/Claude

```
Type: HTTP Header Auth
Name: Anthropic API
Header Name: x-api-key
Value: sk-ant-YOUR_KEY
```

#### Airtable

```
Type: Airtable API
Name: Airtable API
Personal Access Token: patYOUR_TOKEN
```

#### Redis

```
Type: Redis
Name: Redis Credentials
Host: your-host.com
Port: 6379
Password: your_password
Database: 0
```

#### Google Calendar

```
Type: OAuth2 API
Name: Google Calendar OAuth2
[Follow OAuth2 setup in SETUP_GUIDE.md]
```

---

## Troubleshooting Specific Nodes

### "Booking Agent (Claude MCP)" Node

**If MCP server not set up:**

Replace with direct API call:

```json
{
  "url": "https://api.anthropic.com/v1/messages",
  "method": "POST",
  "headers": {
    "x-api-key": "YOUR_ANTHROPIC_KEY",
    "anthropic-version": "2023-06-01",
    "content-type": "application/json"
  },
  "body": {
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 1000,
    "messages": [
      {
        "role": "user",
        "content": "YOUR_PROMPT_HERE"
      }
    ]
  }
}
```

### "Transcribe with Whisper" Node

Ensure OpenAI credential has Whisper access:

```json
{
  "url": "https://api.openai.com/v1/audio/transcriptions",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer YOUR_OPENAI_KEY"
  },
  "bodyType": "form-data",
  "formData": {
    "file": "AUDIO_FILE_BINARY",
    "model": "whisper-1"
  }
}
```

---

## Quick Fix Checklist

Before running the workflow, verify:

- [ ] All credentials created in n8n
- [ ] No "credential not found" errors
- [ ] Webhook URL copied to WhatsApp config
- [ ] MCP server running (or using direct API calls)
- [ ] Redis accessible
- [ ] Airtable base ID correct
- [ ] All API keys valid and active
- [ ] Workflow is set to "Active"

---

## Getting Help

If you still have credential issues:

1. **Check n8n Logs:**

   ```bash
   # If self-hosted
   docker logs n8n

   # Or check the UI
   # Executions → Select failed execution → View error
   ```

2. **Test Individual Nodes:**
   - Click "Test" on each node
   - Fix errors one at a time
   - Start from webhook and work forward

3. **Common Error Messages:**
   - "401 Unauthorized" → API key wrong
   - "403 Forbidden" → Insufficient permissions
   - "404 Not Found" → Wrong endpoint/ID
   - "429 Too Many Requests" → Rate limited
   - "500 Server Error" → API provider issue

4. **Update n8n:**

   ```bash
   # Docker
   docker pull n8nio/n8n:latest

   # NPM
   npm install -g n8n@latest
   ```

---

## Alternative: Simplified Workflow (No Custom Nodes)

If you want a version that uses ONLY standard n8n nodes (HTTP Request, Code, etc.), I can provide a simplified version that works in any n8n installation without custom node dependencies.

Let me know if you need this version!

---

**💡 Pro Tip:** Set up credentials in this order for smoothest experience:

1. WhatsApp (test webhook first)
2. Redis (test connection)
3. Airtable (test read/write)
4. OpenAI (test completion)
5. Gemini (backup)
6. Claude/Anthropic (if using MCP)
7. Google Calendar (last, as OAuth is more complex)
