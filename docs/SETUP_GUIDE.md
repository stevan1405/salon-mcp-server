# 🚀 WhatsApp AI Salon Bot - Complete Setup Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start Overview](#quick-start-overview)
3. [Detailed Setup Steps](#detailed-setup-steps)
4. [Configuration](#configuration)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts & APIs

| Service               | Purpose                | Cost                       |
| --------------------- | ---------------------- | -------------------------- |
| n8n Cloud/Self-Hosted | Workflow automation    | Free tier available        |
| WhatsApp Business API | Messaging platform     | Pay per conversation       |
| OpenAI API            | GPT-4o-mini, Whisper   | ~$0.001-0.01 per request   |
| Google Gemini API     | Backup AI model        | Free tier: 60 requests/min |
| Google Calendar API   | Appointment scheduling | Free                       |
| Airtable              | Database               | Free tier: 1,200 records   |
| Redis                 | Memory & rate limiting | Free tier available        |

### Technical Skills Required

- Basic understanding of APIs
- Ability to copy/paste credentials
- Familiarity with JSON (helpful but not required)

---

## Quick Start Overview

### 5-Step Process

1. **Set up WhatsApp Business API** (15 minutes)
2. **Configure Airtable Base** (10 minutes - automated!)
3. **Set up MCP Server** (20 minutes)
4. **Import n8n Workflow** (10 minutes)
5. **Test & Launch** (15 minutes)

**Total Setup Time: ~70 minutes**

---

## Detailed Setup Steps

### Step 1: WhatsApp Business API Setup

#### 1.1 Create Meta Developer Account

1. Go to https://developers.facebook.com/
2. Click "Get Started" → Create Meta Developer Account
3. Verify your email and phone number
4. Accept developer terms

#### 1.2 Create WhatsApp Business App

1. In Meta Developer Console, click "Create App"
2. Select "Business" as app type
3. Fill in app details:
   - **App Name**: "Your Salon Bot"
   - **Contact Email**: your-email@example.com
4. Click "Create App"

#### 1.3 Add WhatsApp Product

1. In your app dashboard, find "WhatsApp" product
2. Click "Set Up"
3. Select your Business Portfolio (or create new one)

#### 1.4 Get Your Credentials

1. Navigate to WhatsApp → API Setup
2. **Copy these values** (you'll need them later):
   - **Phone Number ID**: Found under "From" dropdown
   - **WhatsApp Business Account ID**: In the URL or settings
   - **Temporary Access Token**: Click "Generate Token"

#### 1.5 Get Permanent Access Token

```bash
# Use Graph API Explorer or this curl command
curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_TEMP_TOKEN"
```

**Save this permanent token securely!**

#### 1.6 Set Up Webhook

1. In WhatsApp settings, click "Configuration"
2. Click "Edit" next to Webhook
3. **Callback URL**: `https://your-n8n-instance.com/webhook/webhook-whatsapp`
   - (You'll get this URL after importing the n8n workflow)
4. **Verify Token**: Create a random string (e.g., `salon_bot_verify_2026`)
5. Click "Verify and Save"
6. Subscribe to webhook fields:
   - ✅ messages
   - ✅ message_status

---

### Step 2: Airtable Database Setup

#### 2.1 Create Airtable Account

1. Go to https://airtable.com/signup
2. Create free account
3. Verify email

#### 2.2 Create New Base

1. Click "+ Create" → "Start from scratch"
2. Name it: "Salon Booking System"
3. **Copy the Base ID**:
   - Click "Help" → "API Documentation"
   - The Base ID is in the URL: `app___________`

#### 2.3 Get API Key

1. Go to https://airtable.com/account
2. Click "Generate API key"
3. Copy and save securely

#### 2.4 Automated Table Creation

The bot will automatically create these tables when first run:

**Tables Created Automatically:**

- ✅ **Customers** - Customer database
- ✅ **Services** - Available services
- ✅ **Bookings** - Appointment records
- ✅ **BusinessSettings** - Configuration

**What You Need to Do:**
Just provide the Base ID in your n8n workflow - the bot handles the rest!

#### 2.5 Manual Table Setup (Optional Fallback)

If you prefer manual setup, use this schema:

**Customers Table:**

```
- id (Auto-generated)
- name (Single line text)
- phone_number (Phone number)
- total_bookings (Number)
- last_booking_date (Date)
- created_at (Date)
```

**Services Table:**

```
- id (Auto-generated)
- name (Single line text)
- description (Long text)
- duration (Number - minutes)
- price (Currency)
- archived (Checkbox)
```

**Bookings Table:**

```
- id (Auto-generated)
- customer_id (Link to Customers)
- customer_name (Single line text)
- customer_phone (Phone number)
- booked_by (Single line text) - for friend bookings
- booked_by_phone (Phone number)
- service (Single line text)
- service_id (Link to Services)
- date_time (Date with time)
- duration (Number)
- price (Currency)
- status (Single select: confirmed, cancelled, completed, no-show)
- google_event_id (Single line text)
- cancellation_reason (Long text)
- created_at (Date)
- cancelled_at (Date)
```

**BusinessSettings Table:**

```
- id (Auto-generated)
- business_name (Single line text)
- business_hours (Long text)
- business_hours_json (Long text - JSON format)
- booking_limit (Number - default: 6)
- timezone (Single line text)
- owner_phone (Phone number)
- rate_limit (Number - default: 30)
```

---

### Step 3: Google Calendar Setup

#### 3.1 Enable Google Calendar API

1. Go to https://console.cloud.google.com/
2. Create new project: "Salon Bot"
3. Enable Google Calendar API:
   - Search "Google Calendar API"
   - Click "Enable"

#### 3.2 Create OAuth Credentials

1. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
2. Configure consent screen:
   - User Type: External
   - App name: "Salon Booking Bot"
   - Add your email
3. Create OAuth Client ID:
   - Application type: Web application
   - Authorized redirect URIs: `https://developers.google.com/oauthplayground`
4. **Save**:
   - Client ID
   - Client Secret

#### 3.3 Get Refresh Token

1. Go to https://developers.google.com/oauthplayground
2. Click settings gear → Use your own OAuth credentials
3. Enter your Client ID and Secret
4. In left panel, find "Google Calendar API v3"
5. Select `https://www.googleapis.com/auth/calendar`
6. Click "Authorize APIs"
7. Sign in with Google account
8. Click "Exchange authorization code for tokens"
9. **Copy the Refresh Token**

#### 3.4 Get Calendar ID

1. Go to Google Calendar
2. Settings → Settings for my calendars
3. Select calendar → Integrate calendar
4. **Copy Calendar ID** (looks like: `yourname@gmail.com`)

---

### Step 4: Redis Setup

#### Option A: Redis Cloud (Recommended)

1. Go to https://redis.com/try-free/
2. Create free account
3. Create new database:
   - Name: "salon-bot-memory"
   - Type: Redis Cloud
   - Region: Choose closest to your n8n instance
4. Get connection details:
   - **Host**: Your Redis endpoint
   - **Port**: Usually 6379
   - **Password**: From database credentials

#### Option B: Local Redis (Development)

```bash
# Install Redis (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install redis-server
#ABOVE DONE
# Start Redis
sudo systemctl start redis
sudo systemctl enable redis

# Test connection
redis-cli ping
# Should return: PONG
```

---

### Step 5: MCP Server Setup

#### 5.1 Prerequisites

```bash
# Install Node.js (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### 5.2 Install MCP Server

```bash
# Create directory
mkdir salon-mcp-server
cd salon-mcp-server

# Initialize npm
npm init -y

# Install dependencies
npm install @anthropic-ai/mcp googleapis airtable openai dotenv express
```

#### 5.3 Configure Environment Variables

Create `.env` file:

```env
# MCP Server
MCP_PORT=3000

# Airtable
AIRTABLE_API_KEY=your_airtable_key
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX

# Google Calendar
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://developers.google.com/oauthplayground
GOOGLE_REFRESH_TOKEN=your_refresh_token
GOOGLE_CALENDAR_ID=your_calendar_id

# OpenAI (for service matching)
OPENAI_API_KEY=your_openai_key

# Anthropic (for Claude)
ANTHROPIC_API_KEY=your_anthropic_key
```

#### 5.4 Copy MCP Server Code

Copy the `mcp-server.js` file to your `salon-mcp-server` directory.

#### 5.5 Start MCP Server

```bash
# Development
node mcp-server.js

# Production (with PM2)
npm install -g pm2
pm2 start mcp-server.js --name salon-mcp
pm2 startup
pm2 save
```

#### 5.6 Test MCP Server

```bash
curl http://localhost:3000/health
# Should return: {"status":"ok"}
```

---

### Step 6: n8n Workflow Setup

#### 6.1 Import Workflow

1. Open your n8n instance
2. Click "+" → "Import from File"
3. Select `salon-whatsapp-bot-workflow.json`
4. Click "Import"

#### 6.2 Configure Credentials

**WhatsApp Credentials:**

1. Open "WhatsApp Webhook" node
2. Create new HTTP Header Auth credential:
   - **Name**: WhatsApp API Auth
   - **Header Name**: Authorization
   - **Value**: `Bearer YOUR_PERMANENT_ACCESS_TOKEN`

**OpenAI Credentials:**

1. Any OpenAI node → Add credential
2. Enter your OpenAI API key

**Google Gemini Credentials:**

1. Fallback Gemini node → Add credential
2. Enter your Gemini API key

**Redis Credentials:**

1. Any Redis node → Add credential
2. Enter:
   - **Host**: Your Redis host
   - **Port**: 6379
   - **Password**: Your Redis password
   - **Database**: 0

**Airtable Credentials:**

1. Any Airtable node → Add credential
2. Enter:
   - **API Key**: Your Airtable API key
   - **Base ID**: Your base ID (the bot will create tables)

#### 6.3 Update MCP Endpoint

1. Open "Booking Agent (Claude MCP)" node
2. Update URL to your MCP server:
   - Local: `http://localhost:3000/mcp/claude`
   - Production: `https://your-mcp-server.com/mcp/claude`

#### 6.4 Get Webhook URL

1. Open "WhatsApp Webhook" node
2. Click "Test URL" or look at "Webhook URLs"
3. Copy the Production URL
4. **Go back to Meta Developer Console**:
   - WhatsApp → Configuration
   - Update Callback URL with this webhook URL

---

### Step 7: Initial Configuration via WhatsApp

#### 7.1 Set Business Hours

Send to your WhatsApp bot:

```
Set business hours:
Monday-Friday: 9:00 AM - 6:00 PM
Saturday: 10:00 AM - 5:00 PM
Sunday: Closed
```

#### 7.2 Add Services

```
Add service: Manicure, $35, 60 minutes
Add service: Pedicure, $45, 75 minutes
Add service: Gel Nails, $55, 90 minutes
Add service: Acrylic Full Set, $65, 120 minutes
```

#### 7.3 Configure Settings

```
Set booking limit: 6
Set rate limit: 30 messages per hour
Set timezone: America/New_York
```

---

## Configuration

### Rate Limiting

Default: 30 messages per hour per customer

**Adjust in workflow:**

1. Open "Rate Limit OK?" node
2. Change value2 parameter (currently: 30)

### Booking Limits

Default: 6 appointments per customer

**Adjust in Airtable:**

1. Open BusinessSettings table
2. Edit booking_limit field

### Conversation Memory

Default: 24 hours

**Adjust in workflow:**

1. Open "Update Conversation History" node
2. Change ttl parameter (currently: 86400 seconds)

### Business Hours

**Update via WhatsApp:**

```
Update hours: [Day]: [Open]-[Close]
```

**Or manually in Airtable:**

```json
{
  "Monday": { "open": "09:00", "close": "18:00" },
  "Tuesday": { "open": "09:00", "close": "18:00" },
  "Wednesday": { "open": "09:00", "close": "18:00" },
  "Thursday": { "open": "09:00", "close": "18:00" },
  "Friday": { "open": "09:00", "close": "18:00" },
  "Saturday": { "open": "10:00", "close": "17:00" },
  "Sunday": { "closed": true }
}
```

---

## Testing

### Test Checklist

#### ✅ Basic Messaging

1. Send "Hello" to your bot
2. Should receive greeting

#### ✅ Service Inquiry

1. Send "What services do you offer?"
2. Should list all services with prices

#### ✅ Check Availability

1. Send "Do you have any openings tomorrow?"
2. Should check calendar and respond with available times

#### ✅ Book Appointment

1. Send "I'd like to book a manicure for tomorrow at 2pm"
2. Should:
   - Check availability
   - Confirm booking
   - Create Google Calendar event
   - Save to Airtable
   - Send confirmation

#### ✅ Voice Message

1. Send voice message: "Book me for a pedicure next Wednesday"
2. Should transcribe and process booking

#### ✅ Image Processing

1. Send screenshot of your calendar
2. Bot should analyze and extract any booking info

#### ✅ Friend Booking

1. Send "Book a manicure for my friend Sarah at 3pm Friday"
2. Should ask for Sarah's phone number
3. Create booking under Sarah's name

#### ✅ Cancellation

1. Send "Cancel my appointment"
2. Should list upcoming appointments
3. Confirm which one to cancel
4. Update Airtable and Google Calendar

#### ✅ Rate Limiting

1. Send 35+ messages within an hour
2. Should receive rate limit message after 30

---

## Troubleshooting

### Common Issues

#### Issue: "Webhook verification failed"

**Solution:**

1. Check Verify Token matches exactly
2. Ensure webhook URL is correct
3. Verify n8n workflow is active

#### Issue: "Rate limit error from OpenAI"

**Solution:**

1. Check OpenAI API credits
2. Ensure you're not hitting rate limits
3. Fallback to Gemini will activate automatically

#### Issue: "Cannot find service"

**Solution:**

1. Service names must match exactly
2. Use GPT-4o-nano service matching
3. Check Services table in Airtable

#### Issue: "No available slots"

**Solution:**

1. Check business hours are set correctly
2. Verify Google Calendar is synced
3. Check for conflicting events

#### Issue: "MCP Server not responding"

**Solution:**

```bash
# Check if server is running
pm2 status

# Check logs
pm2 logs salon-mcp

# Restart server
pm2 restart salon-mcp
```

#### Issue: "Redis connection error"

**Solution:**

1. Verify Redis is running: `redis-cli ping`
2. Check credentials in n8n
3. Test connection: `redis-cli -h HOST -p PORT -a PASSWORD ping`

#### Issue: "Airtable permissions error"

**Solution:**

1. Verify API key is correct
2. Check base sharing settings
3. Ensure API key has write permissions

### Debug Mode

#### Enable Detailed Logging in n8n

1. Settings → Log Level → Debug
2. Check execution logs for each node
3. Look for error messages in red

#### Test Individual Components

**Test WhatsApp API:**

```bash
curl -X POST "https://graph.facebook.com/v18.0/YOUR_PHONE_ID/messages" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "YOUR_PHONE",
    "type": "text",
    "text": {"body": "Test message"}
  }'
```

**Test Google Calendar:**

```bash
# In MCP server directory
node -e "require('./test-calendar.js')"
```

**Test Airtable:**

```bash
curl "https://api.airtable.com/v0/YOUR_BASE_ID/Services" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## Advanced Configuration

### Multi-Location Support

1. Create separate Airtable bases for each location
2. Duplicate workflow for each location
3. Use different WhatsApp numbers per location

### Custom Reminders

Edit in Google Calendar event creation:

```javascript
reminders: {
  useDefault: false,
  overrides: [
    { method: 'sms', minutes: 1440 },  // 24 hours
    { method: 'sms', minutes: 120 },   // 2 hours
    { method: 'email', minutes: 60 }   // 1 hour
  ]
}
```

### Analytics Dashboard

Connect Airtable to:

- Google Data Studio
- Tableau
- Power BI

Track:

- Bookings per day/week/month
- Revenue analytics
- Popular services
- Customer retention
- Peak booking times

---

## Support

### Resources

- **n8n Documentation**: https://docs.n8n.io
- **WhatsApp Business API**: https://developers.facebook.com/docs/whatsapp
- **Airtable API**: https://airtable.com/api
- **Google Calendar API**: https://developers.google.com/calendar

### Community

- n8n Community Forum
- WhatsApp Business API Slack
- Stack Overflow (tag: n8n, whatsapp-api)

---

## Security Best Practices

1. **Never share API keys publicly**
2. **Use environment variables** for all credentials
3. **Enable 2FA** on all accounts
4. **Regularly rotate** API keys (every 90 days)
5. **Monitor** unusual activity in logs
6. **Backup** Airtable base weekly
7. **Use HTTPS** for all webhook URLs
8. **Implement** IP whitelisting where possible

---

## Cost Optimization

### Estimated Monthly Costs

**For 1,000 conversations/month:**

- WhatsApp: ~$10-20
- OpenAI (GPT-4o-mini): ~$5-10
- Google Gemini: Free (60 req/min)
- Airtable: Free (up to 1,200 records)
- Redis: Free tier
- Google Calendar: Free
- n8n: Free (self-hosted) or $20/month (cloud)

**Total: $15-50/month**

### Optimization Tips

1. Use Gemini for non-critical responses
2. Implement aggressive caching in Redis
3. Batch Airtable operations
4. Use GPT-4o-nano for service matching
5. Compress conversation history

---

**🎉 Congratulations! Your WhatsApp AI Salon Bot is now live!**

Send a test message to get started.



