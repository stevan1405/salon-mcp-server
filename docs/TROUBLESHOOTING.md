# 🔧 WhatsApp AI Salon Bot - Troubleshooting Guide

## Table of Contents

1. [Common Issues & Solutions](#common-issues--solutions)
2. [Error Messages](#error-messages)
3. [API-Specific Issues](#api-specific-issues)
4. [Performance Issues](#performance-issues)
5. [Debugging Techniques](#debugging-techniques)
6. [FAQ](#faq)

---

## Common Issues & Solutions

### Issue #1: Webhook Not Receiving Messages

**Symptoms:**

- WhatsApp messages sent but bot doesn't respond
- n8n workflow never triggers
- No logs in n8n execution history

**Diagnosis:**

```bash
# Check if webhook is accessible
curl https://your-n8n-instance.com/webhook/webhook-whatsapp
curl https://primary-production-f64c.up.railway.app/webhook/webhook-whatsapp
curl https://primary-production-f64c.up.railway.app/webhook-test/webhook-whatsapp
# Should return: {"message":"Method not allowed"} or similar
# If timeout or connection error, webhook isn't accessible
```

**Solutions:**

1. **Verify Webhook URL**

   ```
   Meta Developer Console → WhatsApp → Configuration → Webhook
   Callback URL must exactly match n8n webhook URL
   ```

2. **Check Verify Token**
   - Must match exactly (case-sensitive)
   - No extra spaces or characters

3. **Activate n8n Workflow**
   - Workflow must be "Active" (toggle in top-right)
   - Check that webhook node is properly configured

4. **Firewall/Network Issues**
   - Ensure n8n is accessible from internet
   - Check firewall rules allow HTTPS traffic
   - If self-hosted, verify port forwarding

5. **SSL Certificate**
   - WhatsApp requires HTTPS
   - Certificate must be valid (not self-signed)
   - Use Let's Encrypt for free SSL

**Test Fix:**

```bash
# Send test webhook
curl -X POST https://your-n8n-instance.com/webhook/webhook-whatsapp \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Check n8n execution history for the test
```

---

### Issue #2: "Rate Limit Exceeded" Errors

**Symptoms:**

- Bot stops responding after multiple messages
- Error: "Rate limit exceeded"
- Customer receives rate limit notification

**Diagnosis:**

```bash
# Check Redis for rate limit counter
redis-cli -h YOUR_REDIS_HOST -a YOUR_PASSWORD
> GET rate_limit:+1234567890
```

**Solutions:**

1. **Adjust Rate Limit**
   - Open n8n workflow
   - Find "Rate Limit OK?" node
   - Change `value2` from 30 to desired limit (e.g., 50)

2. **Reset Rate Limit for Specific Customer**

   ```bash
   redis-cli -h YOUR_REDIS_HOST -a YOUR_PASSWORD
   > DEL rate_limit:+1234567890
   ```

3. **Implement Whitelist**
   Add to workflow before rate limit check:

   ```javascript
   // In a Code node
   const whitelistedNumbers = ["+1234567890", "+0987654321"];
   if (whitelistedNumbers.includes($json.phoneNumber)) {
     return { bypass: true };
   }
   ```

4. **Monitor for Spam**
   - Check if single user is triggering limit
   - Investigate unusual patterns
   - Consider temporary blocks for abuse

---

### Issue #3: Booking Not Created

**Symptoms:**

- Customer receives confirmation but no calendar event
- Airtable has no booking record
- No errors visible to customer

**Diagnosis:**

```javascript
// Check n8n workflow execution
// Look for errors in:
// 1. "Execute Tools" node
// 2. Google Calendar creation
// 3. Airtable booking record creation
```

**Solutions:**

1. **Google Calendar API Issues**

   ```bash
   # Test calendar access
   curl https://www.googleapis.com/calendar/v3/calendars/YOUR_CALENDAR_ID/events \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

   **If 401 Unauthorized:**
   - Refresh token may have expired
   - Regenerate OAuth credentials
   - Re-authorize application

2. **Airtable Permissions**

   ```bash
   # Test Airtable write access
   curl "https://api.airtable.com/v0/YOUR_BASE_ID/Bookings" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -X POST \
     -d '{"fields": {"customer_name": "Test"}}'
   ```

   **If error:**
   - Check API key has write permissions
   - Verify base ID is correct
   - Ensure table name matches exactly

3. **MCP Server Not Responding**

   ```bash
   # Check MCP server status
   pm2 status salon-mcp

   # View logs
   pm2 logs salon-mcp --lines 50

   # Restart if needed
   pm2 restart salon-mcp
   ```

4. **Tool Call Parsing Error**
   - Check MCP response format
   - Verify Claude's tool use output
   - Look for JSON parsing errors in logs

**Prevention:**

- Add error handling in workflow
- Send owner notification on booking failures
- Implement retry logic for API calls

---

### Issue #4: Voice Messages Not Transcribed

**Symptoms:**

- Voice messages received but no response
- Transcription errors in logs
- OpenAI Whisper API errors

**Diagnosis:**

```javascript
// Check n8n execution for "Transcribe with Whisper" node
// Look for errors or empty transcription results
```

**Solutions:**

1. **Audio Format Issues**
   - WhatsApp sends .opus or .ogg format
   - Whisper supports: mp3, mp4, mpeg, mpga, m4a, wav, webm

   **Add conversion step:**

   ```bash
   # Install ffmpeg in n8n
   apt-get install ffmpeg

   # Add Code node before Whisper:
   const { exec } = require('child_process');
   exec(`ffmpeg -i input.ogg -ar 16000 output.mp3`);
   ```

2. **File Download Fails**

   ```bash
   # Test WhatsApp media download
   curl -X GET "https://graph.facebook.com/v18.0/MEDIA_ID" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **OpenAI API Key Issues**
   - Verify API key is valid
   - Check billing/credits
   - Ensure Whisper API is enabled

4. **File Size Limits**
   - Whisper max: 25MB
   - WhatsApp voice notes usually <5MB
   - If larger, split or compress

**Fallback Strategy:**
Add to workflow after transcription failure:

```javascript
if (!transcription) {
  return {
    response:
      "I received your voice message but couldn't transcribe it. Could you please send a text message instead?",
  };
}
```

---

### Issue #5: Image Processing Fails

**Symptoms:**

- Images sent but not analyzed
- GPT-4o returns generic response
- Vision API errors

**Diagnosis:**

```javascript
// Check:
// 1. Image download successful
// 2. Base64 encoding correct
// 3. GPT-4o vision call format
```

**Solutions:**

1. **Image Format**
   - Supported: JPEG, PNG, GIF, WebP
   - Max size: 20MB
   - Convert if needed:

   ```javascript
   const sharp = require("sharp");
   const buffer = await sharp(imageBuffer)
     .resize(1024, 1024, { fit: "inside" })
     .jpeg({ quality: 80 })
     .toBuffer();
   ```

2. **Base64 Encoding**

   ```javascript
   // Correct format
   const base64Image = imageBuffer.toString("base64");
   const dataUrl = `data:image/jpeg;base64,${base64Image}`;
   ```

3. **GPT-4o Vision Call**

   ```javascript
   // Proper format
   {
     "model": "gpt-4o-mini",
     "messages": [
       {
         "role": "user",
         "content": [
           { "type": "text", "text": "Analyze this image" },
           {
             "type": "image_url",
             "image_url": { "url": dataUrl }
           }
         ]
       }
     ]
   }
   ```

4. **API Rate Limits**
   - GPT-4o vision has lower rate limits
   - Implement queue for image processing
   - Add retry logic with exponential backoff

---

### Issue #6: MCP Server Connection Issues

**Symptoms:**

- "Cannot connect to MCP server"
- Booking agent fails
- Timeout errors

**Diagnosis:**

```bash
# Check server status
pm2 status salon-mcp

# Check port
netstat -tulpn | grep 3000

# Test endpoint
curl http://localhost:3000/health
```

**Solutions:**

1. **Server Not Running**

   ```bash
   cd /path/to/salon-mcp-server
   pm2 start mcp-server.js --name salon-mcp
   pm2 save
   ```

2. **Port Already in Use**

   ```bash
   # Find process using port 3000
   lsof -i :3000

   # Kill process or use different port
   # Update MCP_PORT in .env
   ```

3. **Firewall Blocking**

   ```bash
   # Allow port 3000
   sudo ufw allow 3000

   # Or use nginx reverse proxy
   ```

4. **Environment Variables Not Loaded**

   ```bash
   # Verify .env file exists
   ls -la /path/to/salon-mcp-server/.env

   # Check variables are loaded
   pm2 logs salon-mcp | grep "Starting"
   ```

5. **Dependencies Missing**
   ```bash
   cd /path/to/salon-mcp-server
   npm install
   pm2 restart salon-mcp
   ```

---

### Issue #7: Conversation Memory Not Working

**Symptoms:**

- Bot forgets context between messages
- Repeats questions
- Doesn't remember customer details

**Diagnosis:**

```bash
# Check Redis
redis-cli -h YOUR_HOST -a YOUR_PASSWORD
> KEYS conversation:*
> GET conversation:+1234567890
```

**Solutions:**

1. **Redis Connection Failed**

   ```bash
   # Test connection
   redis-cli -h YOUR_HOST -p 6379 -a YOUR_PASSWORD ping

   # Should return: PONG
   ```

2. **Memory Expired Too Quickly**
   - Default TTL: 24 hours (86400 seconds)
   - Increase in "Update Conversation History" node:

   ```javascript
   ttl: 172800; // 48 hours
   ```

3. **Memory Not Retrieved**
   - Check "Get Conversation History" node executes
   - Verify phone number format matches (with/without +)
   - Ensure Redis key format is consistent

4. **Memory Too Large**
   ```javascript
   // Limit conversation history to last 10 messages
   const history = JSON.parse(conversationHistory);
   const limitedHistory = history.slice(-10);
   ```

---

## Error Messages

### "Authentication Failed"

**Cause:** Invalid API credentials

**Solutions:**

1. Verify API key/token is correct
2. Check for extra spaces or line breaks
3. Ensure credentials haven't expired
4. Regenerate and update credentials

---

### "Resource Not Found"

**Cause:** Invalid ID or deleted resource

**Solutions:**

1. Verify Airtable Base ID
2. Check table names match exactly
3. Ensure Google Calendar ID is correct
4. Confirm booking/record still exists

---

### "Rate Limit Exceeded"

**Cause:** Too many API requests

**Solutions:**

1. Implement exponential backoff
2. Cache frequently accessed data
3. Batch operations where possible
4. Upgrade API plan if needed

---

### "Insufficient Permissions"

**Cause:** API key lacks required permissions

**Solutions:**

1. Check API key scopes/permissions
2. Re-authorize with correct scopes
3. Ensure workspace/base access granted
4. Update OAuth credentials

---

## API-Specific Issues

### OpenAI API

**Common Issues:**

- Billing/credits exhausted
- Model not available
- Context length exceeded

**Debug:**

```bash
# Check API status
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_KEY"

# Test completion
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "test"}]}'
```

---

### Google Calendar API

**Common Issues:**

- OAuth token expired
- Calendar not shared
- Time zone conflicts

**Debug:**

```bash
# Refresh OAuth token
curl -X POST https://oauth2.googleapis.com/token \
  -d "client_id=YOUR_ID" \
  -d "client_secret=YOUR_SECRET" \
  -d "refresh_token=YOUR_REFRESH_TOKEN" \
  -d "grant_type=refresh_token"

# List calendars
curl https://www.googleapis.com/calendar/v3/users/me/calendarList \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Airtable API

**Common Issues:**

- Record limit exceeded (free tier: 1,200)
- Field type mismatch
- Formula errors

**Debug:**

```bash
# Check base schema
curl "https://api.airtable.com/v0/meta/bases/YOUR_BASE_ID/tables" \
  -H "Authorization: Bearer YOUR_KEY"

# List records
curl "https://api.airtable.com/v0/YOUR_BASE_ID/Bookings?maxRecords=10" \
  -H "Authorization: Bearer YOUR_KEY"
```

---

## Performance Issues

### Slow Response Times

**Diagnosis:**

1. Check n8n execution times
2. Identify slowest nodes
3. Monitor API response times

**Solutions:**

1. **Cache Static Data**
   - Services list
   - Business settings
   - Customer details (for 5 minutes)

2. **Parallel Execution**
   - Fetch multiple data sources simultaneously
   - Use n8n "Split in Batches" node

3. **Optimize AI Calls**
   - Use GPT-4o-mini instead of GPT-4o
   - Reduce context length
   - Cache common responses

4. **Database Indexing**
   - Airtable: Create views with filters
   - Redis: Use hash structures for related data

---

## Debugging Techniques

### Enable Verbose Logging

**n8n:**

```javascript
// Add to workflow nodes
console.log("DEBUG:", JSON.stringify($json, null, 2));
```

**MCP Server:**

```javascript
// In mcp-server.js
const DEBUG = process.env.DEBUG === "true";
if (DEBUG) console.log("MCP Debug:", data);
```

### Monitor API Calls

```bash
# Install mitmproxy
pip install mitmproxy

# Intercept HTTPS traffic
mitmproxy -p 8080

# Configure n8n to use proxy
export HTTP_PROXY=http://localhost:8080
export HTTPS_PROXY=http://localhost:8080
```

### Test Individual Components

**Test WhatsApp Send:**

```bash
node test-whatsapp-send.js
```

**Test MCP Tools:**

```bash
node test-mcp-tools.js
```

**Test Airtable CRUD:**

```bash
node test-airtable.js
```

### Execution Timeline

1. WhatsApp receives message
2. Webhook triggers n8n
3. Extract message data
4. Check rate limit
5. Process media (if applicable)
6. Get conversation history
7. Fetch business data
8. Route to appropriate agent
9. AI generates response
10. Execute tools (if needed)
11. Update memory
12. Send WhatsApp response

**Expected Times:**

- Steps 1-6: <1 second
- Steps 7-9: 2-5 seconds (AI processing)
- Steps 10-12: 1-3 seconds
- **Total: 3-10 seconds**

---

## FAQ

### Q: How do I reset the entire system?

**A:**

```bash
# Clear Redis
redis-cli FLUSHALL

# Delete all Airtable records (manually or via script)

# Restart MCP server
pm2 restart salon-mcp

# Deactivate and reactivate n8n workflow
```

### Q: Can I use this for multiple salons?

**A:** Yes! Options:

1. Separate Airtable bases per salon
2. Duplicate workflows with different credentials
3. Add `salon_id` field to differentiate in single base

### Q: How do I backup my data?

**A:**

```bash
# Airtable backup
node backup-airtable.js

# Redis backup
redis-cli -h HOST -a PASSWORD --rdb /backup/dump.rdb

# Google Calendar export
# Settings → Import & Export → Export
```

### Q: What's the maximum number of concurrent bookings?

**A:** Limited by:

- Airtable rate limits: 5 requests/second
- Google Calendar: 1,000 requests/100 seconds
- Your server resources

Realistically: **100-500 bookings/hour**

### Q: Can customers book for past dates?

**A:** Add validation in workflow:

```javascript
const bookingDate = new Date($json.dateTime);
if (bookingDate < new Date()) {
  return { error: "Cannot book appointments in the past" };
}
```

### Q: How secure is customer data?

**A:**

- WhatsApp: End-to-end encrypted
- Airtable: HTTPS, SOC 2 compliant
- Redis: Password protected
- APIs: HTTPS only

**Recommendations:**

- Enable 2FA on all accounts
- Rotate API keys every 90 days
- Use environment variables (never hardcode)
- Regular security audits

---

## Getting Help

### Before Asking for Help

1. ✅ Check this troubleshooting guide
2. ✅ Review n8n execution logs
3. ✅ Check MCP server logs: `pm2 logs salon-mcp`
4. ✅ Verify all API credentials
5. ✅ Test with a simple message first

### When Reporting Issues

Include:

- **Error message** (full text)
- **n8n execution ID**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Recent changes made**
- **Relevant logs** (sanitize credentials!)

### Support Channels

- n8n Community Forum
- WhatsApp Business API Documentation
- API-specific support channels
- GitHub Issues (if using open-source version)

---

## Appendix: Useful Commands

```bash
# Check all service statuses
pm2 status

# View real-time logs
pm2 logs --lines 100

# Restart all services
pm2 restart all

# Check Redis memory usage
redis-cli INFO memory

# Test WhatsApp connectivity
curl https://graph.facebook.com/v18.0/me -H "Authorization: Bearer TOKEN"

# Monitor n8n workflow executions
# (in n8n UI) Executions → Filter by status

# Export Airtable data
curl "https://api.airtable.com/v0/BASE_ID/TABLE?view=Grid%20view" \
  -H "Authorization: Bearer API_KEY" > backup.json
```

---

**💡 Pro Tip:** Keep a log of all issues and solutions specific to your setup. It'll save time when similar issues occur!
