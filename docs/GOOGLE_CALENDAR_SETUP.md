# 🔐 Google Calendar API - Complete Step-by-Step Guide

## Overview

You need 4 things from Google:

1. ✅ Client ID
2. ✅ Client Secret
3. ❌ Refresh Token (YOU NEED THIS - we'll get it below)
4. ✅ Calendar ID (your email is CORRECT!)

---

## Part 1: Get Client ID & Client Secret (Google Cloud Console)

### Step 1: Create Google Cloud Project

1. **Go to:** https://console.cloud.google.com/
2. **Sign in** with your Google account
3. **Click** the project dropdown (top left, next to "Google Cloud")
4. **Click** "NEW PROJECT"
5. **Enter:**
   - Project name: `Salon WhatsApp Bot`
   - Location: No organization
6. **Click** "CREATE"
7. **Wait** 10-30 seconds for project creation
8. **Select** your new project from the dropdown

### Step 2: Enable Google Calendar API

1. **In the search bar** at top, type: `Calendar API`
2. **Click** "Google Calendar API"
3. **Click** "ENABLE" button
4. **Wait** for it to enable (shows "API enabled" checkmark)

### Step 3: Create OAuth Consent Screen

1. **In left sidebar**, click "OAuth consent screen"
2. **Select** "External" user type
3. **Click** "CREATE"

4. **Fill in App Information:**

   ```
   App name: Salon Booking Bot
   User support email: your-email@gmail.com
   Developer contact: your-email@gmail.com
   ```

5. **Click** "SAVE AND CONTINUE"

6. **Scopes page:**
   - Click "ADD OR REMOVE SCOPES"
   - Search for: `calendar`
   - Check: ✅ `.../auth/calendar` (See, edit, share, and permanently delete calendars)
   - Click "UPDATE"
   - Click "SAVE AND CONTINUE"

7. **Test users page:**
   - Click "ADD USERS"
   - Enter your Gmail address
   - Click "ADD"
   - Click "SAVE AND CONTINUE"

8. **Summary page:**
   - Click "BACK TO DASHBOARD"

### Step 4: Create OAuth Client ID

1. **In left sidebar**, click "Credentials"
2. **Click** "CREATE CREDENTIALS" (top)
3. **Select** "OAuth client ID"

4. **Configure:**

   ```
   Application type: Web application
   Name: Salon Bot Web Client
   ```

5. **Authorized redirect URIs:**
   - Click "ADD URI"
   - Enter: `https://developers.google.com/oauthplayground`
   - Click "ADD URI" again
   - Enter: `http://localhost:3000/oauth/callback` (for local testing)
   - Click "CREATE"

6. **IMPORTANT - Copy these:**

   ```
   Client ID: xxxxx.apps.googleusercontent.com
   Client Secret: GOCSPx-xxxxx
   ```

   💾 **Save these** to a text file temporarily!

---

## Part 2: Get Refresh Token (OAuth Playground)

### Step 1: Open OAuth Playground

1. **Go to:** https://developers.google.com/oauthplayground
2. **Click the settings gear** icon (top right)
3. **Check:** ✅ "Use your own OAuth credentials"

### Step 2: Enter Your Credentials

4. **Paste in:**
   ```
   OAuth Client ID: [Your Client ID from above]
   OAuth Client secret: [Your Client Secret from above]
   ```
5. **Close** the settings panel

### Step 3: Select Calendar Scope

6. **In the left panel**, scroll down to find:
   - "Google Calendar API v3"
7. **Expand it** (click the arrow)
8. **Check the box** for:
   ```
   ✅ https://www.googleapis.com/auth/calendar
   ```

### Step 4: Authorize

9. **Click** the blue "Authorize APIs" button (bottom left)
10. **You'll see a Google sign-in popup:**
    - Select your Google account
    - Click "Continue" (it may warn "Google hasn't verified this app" - that's OK, it's YOUR app!)
    - Click "Continue" again
    - Review permissions
    - Click "Allow"

### Step 5: Get the Refresh Token

11. **You'll be redirected** back to OAuth Playground
12. **Click** "Exchange authorization code for tokens" (blue button, bottom left)
13. **COPY the Refresh Token:**

    ```
    Refresh token: 1//0xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    ```

    💾 **This is your REFRESH TOKEN!** Save it!

---

## Part 3: Get Calendar ID

### Option 1: Use Your Gmail Address (Easiest)

For your **primary calendar**, the Calendar ID is simply:

```
GOOGLE_CALENDAR_ID=your-email@gmail.com
```

✅ **This is CORRECT!** You already have this!

### Option 2: Get Specific Calendar ID (If Using Different Calendar)

1. **Go to:** https://calendar.google.com
2. **Click settings gear** (top right) → "Settings"
3. **In left sidebar**, click the calendar you want to use
4. **Scroll down** to "Integrate calendar"
5. **Copy the Calendar ID**
   ```
   Example: abc123@group.calendar.google.com
   ```

---

## Part 4: Update Your .env File

Now update your `.env` file with all the values:

```bash
# ============================================
# GOOGLE CALENDAR API
# ============================================
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPx-YourSecretHere
GOOGLE_REDIRECT_URI=https://developers.google.com/oauthplayground
GOOGLE_REFRESH_TOKEN=1//0gABCDEFGHIJKLMNOPQRSTUVWXYZ
GOOGLE_CALENDAR_ID=your-email@gmail.com
```

---

## Part 5: Test Your Credentials

### Quick Test Script

Create a file: `test-google-calendar.js`

```javascript
require("dotenv").config();
const { google } = require("googleapis");

async function testCalendar() {
  console.log("🔍 Testing Google Calendar credentials...\n");

  // Create OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  // Set credentials
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  // Create calendar instance
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  try {
    // Test 1: List calendars
    console.log("📅 Test 1: Listing calendars...");
    const calendarList = await calendar.calendarList.list();
    console.log("✅ Found", calendarList.data.items.length, "calendars");
    console.log(
      "   Primary calendar:",
      calendarList.data.items.find((c) => c.primary)?.id,
    );

    // Test 2: Get calendar details
    console.log("\n📅 Test 2: Getting calendar details...");
    const cal = await calendar.calendars.get({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
    });
    console.log("✅ Calendar found:", cal.data.summary);

    // Test 3: List upcoming events
    console.log("\n📅 Test 3: Listing upcoming events...");
    const events = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: new Date().toISOString(),
      maxResults: 5,
      singleEvents: true,
      orderBy: "startTime",
    });
    console.log("✅ Found", events.data.items.length, "upcoming events");

    console.log("\n🎉 All tests passed! Your credentials are working!\n");
  } catch (error) {
    console.error("❌ Error:", error.message);

    if (error.message.includes("invalid_grant")) {
      console.log(
        "\n💡 Fix: Your refresh token may have expired. Get a new one from OAuth Playground.",
      );
    } else if (error.message.includes("invalid_client")) {
      console.log(
        "\n💡 Fix: Check your Client ID and Client Secret are correct.",
      );
    } else if (error.message.includes("Not Found")) {
      console.log("\n💡 Fix: Check your Calendar ID is correct.");
    }
  }
}

testCalendar();
```

### Run the Test

```bash
# Install googleapis if you haven't
npm install googleapis

# Run test
node test-google-calendar.js
```

**Expected Output:**

```
🔍 Testing Google Calendar credentials...

📅 Test 1: Listing calendars...
✅ Found 3 calendars
   Primary calendar: your-email@gmail.com

📅 Test 2: Getting calendar details...
✅ Calendar found: your-email@gmail.com

📅 Test 3: Listing upcoming events...
✅ Found 2 upcoming events

🎉 All tests passed! Your credentials are working!
```

---

## Common Issues & Fixes

### Issue 1: "invalid_grant" Error

**Problem:** Refresh token expired or revoked

**Fix:**

```bash
# Go back to OAuth Playground and get a new refresh token
# Follow Part 2 again
# Update .env with new token
```

### Issue 2: "Access Not Configured"

**Problem:** Calendar API not enabled

**Fix:**

```bash
# Go to: https://console.cloud.google.com/apis/library/calendar-json.googleapis.com
# Click ENABLE
```

### Issue 3: "Calendar Not Found"

**Problem:** Wrong Calendar ID

**Fix:**

```bash
# For primary calendar, use your Gmail:
GOOGLE_CALENDAR_ID=your-email@gmail.com

# Or get ID from calendar settings
```

### Issue 4: "redirect_uri_mismatch"

**Problem:** Redirect URI not authorized

**Fix:**

```bash
# Go to Google Cloud Console → Credentials
# Edit your OAuth Client
# Add: https://developers.google.com/oauthplayground
# Save
```

### Issue 5: "Access Blocked: Authorization Error"

**Problem:** OAuth consent screen not properly configured

**Fix:**

```bash
# Go to OAuth consent screen
# Add your email as a test user
# Make sure app status is "Testing" (not "In production")
```

---

## Visual Walkthrough (Text Format)

### Getting Refresh Token - Screenshot Guide

**Screen 1: OAuth Playground Settings**

```
┌─────────────────────────────────────┐
│ OAuth 2.0 Configuration             │
│                                     │
│ ☑ Use your own OAuth credentials   │
│                                     │
│ OAuth Client ID:                    │
│ [paste your client ID here]         │
│                                     │
│ OAuth Client secret:                │
│ [paste your client secret here]     │
│                                     │
│              [Close]                │
└─────────────────────────────────────┘
```

**Screen 2: Select Scope**

```
┌─────────────────────────────────────┐
│ Step 1: Select & authorize APIs     │
│                                     │
│ ▼ Google Calendar API v3            │
│   ☑ .../auth/calendar               │
│                                     │
│                                     │
│      [Authorize APIs]               │
└─────────────────────────────────────┘
```

**Screen 3: Exchange for Tokens**

```
┌─────────────────────────────────────┐
│ Step 2: Exchange authorization code │
│                                     │
│ Authorization code:                 │
│ [auto-filled]                       │
│                                     │
│ [Exchange authorization code...]    │
│                                     │
│ Refresh token:                      │
│ 1//0gABC...XYZ                      │
│ ← COPY THIS!                        │
└─────────────────────────────────────┘
```

---

## Summary Checklist

Before moving on, verify you have:

- [ ] ✅ GOOGLE_CLIENT_ID (from Google Cloud Console)
- [ ] ✅ GOOGLE_CLIENT_SECRET (from Google Cloud Console)
- [ ] ✅ GOOGLE_REFRESH_TOKEN (from OAuth Playground)
- [ ] ✅ GOOGLE_CALENDAR_ID (your Gmail address)
- [ ] ✅ All values in .env file
- [ ] ✅ Test script passes

---

## Your Complete .env Should Look Like:

```bash
# GOOGLE CALENDAR API
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPx-1234567890abcdefghijk
GOOGLE_REDIRECT_URI=https://developers.google.com/oauthplayground
GOOGLE_REFRESH_TOKEN=1//0gABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890
GOOGLE_CALENDAR_ID=youremail@gmail.com
```

---

## Next Steps

Once you have all credentials:

1. ✅ Update `.env` file
2. ✅ Run test script
3. ✅ Test passes? → Move to MCP server setup
4. ✅ Test fails? → Check troubleshooting section above

---

**Need help?** Share the specific error message you're getting and I'll help debug!
