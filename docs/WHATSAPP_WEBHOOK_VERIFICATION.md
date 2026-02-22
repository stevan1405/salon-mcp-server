# 🔧 WhatsApp Webhook Verification - Complete Fix

## The Problem

Meta (Facebook/WhatsApp) requires webhook verification BEFORE it will send messages.

**Verification Process:**

1. You enter Callback URL + Verify Token in Meta Console
2. Meta sends GET request: `yourwebhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=RANDOM_STRING`
3. Your webhook MUST respond with the `hub.challenge` value
4. If response is correct → ✅ Verified
5. If response is wrong → ❌ Error (what you're seeing)

---

## ✅ Fix Method 1: Update Existing Workflow (Recommended)

### Step 1: Modify WhatsApp Webhook Node

Open the "WhatsApp Webhook" node in n8n:

```
Authentication: None
HTTP Method: ALL  ← CHANGE THIS from POST to ALL
Path: webhook-whatsapp
Response Mode: responseNode
```

### Step 2: Add Code Node After Webhook

Add a new **Code** node right after the webhook:

**Node Name:** Handle Verification

**JavaScript Code:**

```javascript
// Check if this is a verification request from Meta
const query = $input.item.json.query || {};
const body = $input.item.json.body || {};

// Verification request from Meta
if (
  query["hub.mode"] === "subscribe" &&
  query["hub.verify_token"] === "salon_bot_ai_verify_2026"
) {
  // Return the challenge to verify the webhook
  return {
    json: {
      isVerification: true,
      challenge: query["hub.challenge"],
    },
  };
}

// Regular message from WhatsApp
if (body.entry && body.entry[0]?.changes?.[0]?.value?.messages) {
  return {
    json: {
      isVerification: false,
      message: body,
    },
  };
}

// Unknown request type
return {
  json: {
    isVerification: false,
    error: "Unknown request type",
  },
};
```

### Step 3: Add IF Node

Add **IF** node after the Code node:

**Node Name:** Is Verification?

**Condition:**

```
{{ $json.isVerification }} equals true (Boolean)
```

### Step 4: Add Verification Response

**TRUE branch** - Add "Respond to Webhook":

```
Response Code: 200
Response Body: {{ $json.challenge }}
Content-Type: text/plain
```

**FALSE branch** - Connect to your existing message processing

---

## ✅ Fix Method 2: Simple Code-Only Approach

Replace your entire webhook handling with this simplified version:

### Updated Webhook Node + Code Node

**1. Webhook Node:**

```
HTTP Method: ALL
Path: webhook-whatsapp
Response Mode: responseNode
```

**2. Add Code Node:**

```javascript
// Get request data
const method = $input.item.json.method || "POST";
const query = $input.item.json.query || {};
const body = $input.item.json.body || {};

// Handle GET request (verification from Meta)
if (method === "GET") {
  const mode = query["hub.mode"];
  const token = query["hub.verify_token"];
  const challenge = query["hub.challenge"];

  // Check verify token matches
  if (mode === "subscribe" && token === "salon_bot_ai_verify_2026") {
    return [
      {
        json: {
          type: "verification",
          status: 200,
          body: challenge,
        },
      },
    ];
  } else {
    return [
      {
        json: {
          type: "verification_failed",
          status: 403,
          body: "Verification token mismatch",
        },
      },
    ];
  }
}

// Handle POST request (actual messages)
if (method === "POST") {
  return [
    {
      json: {
        type: "message",
        status: 200,
        data: body,
      },
    },
  ];
}
```

**3. Add IF node to route:**

```
Condition: {{ $json.type }} equals "verification"
```

**4. Verification Response:**

```
Response Code: {{ $json.status }}
Response Body: {{ $json.body }}
```

---

## 🎯 Minimal Working Example

Here's the absolute minimum you need:

### Complete Simple Workflow

```
┌─────────────────┐
│  Webhook (ALL)  │
└────────┬────────┘
         │
┌────────▼────────────┐
│  Code: Route        │
│  - GET → verify     │
│  - POST → process   │
└────────┬────────────┘
         │
┌────────▼────────┐
│  IF: Type?      │
└───┬─────────┬───┘
    │         │
   GET       POST
    │         │
┌───▼────┐  ┌▼──────────┐
│Respond │  │Process Msg│
│Challenge│  │   Flow    │
└────────┘  └───────────┘
```

---

## 📝 Step-by-Step Implementation

### What to Do Right Now:

1. **Open n8n** → Your WhatsApp workflow

2. **Click on "WhatsApp Webhook" node**

3. **Change HTTP Method:**
   - Current: POST
   - New: **ALL**
   - Save

4. **Add new Code node** after webhook:
   - Copy the code from "Fix Method 2" above
   - Save

5. **Add IF node** after Code:
   - Condition: `{{ $json.type }} equals "verification"`
   - Save

6. **Add "Respond to Webhook" on TRUE branch:**
   - Response Code: `{{ $json.status }}`
   - Response Body: `{{ $json.body }}`
   - Save

7. **Connect FALSE branch** to your existing message processing

8. **Save & Activate workflow**

9. **Go back to Meta Developer Console**

10. **Click "Verify and Save" again**

---

## 🧪 Test Your Webhook

### Manual Test (Before Meta Verification)

Test the verification endpoint:

```bash
# Your webhook URL
WEBHOOK_URL="https://primary-production-f64c.up.railway.app/webhook/webhook-whatsapp"

# Test verification
curl -X GET "${WEBHOOK_URL}?hub.mode=subscribe&hub.verify_token=salon_bot_ai_verify_2026&hub.challenge=test123"

# Should return: test123
```

If you get `test123` back → ✅ Your webhook is ready!

### What Meta Does:

Meta sends the exact same request when you click "Verify and Save":

```
GET https://your-webhook-url?hub.mode=subscribe&hub.verify_token=salon_bot_ai_verify_2026&hub.challenge=RANDOM_NUMBER
```

Your webhook must return that `RANDOM_NUMBER`.

---

## 🔍 Debugging

### Check n8n Execution Log

1. Go to **Executions** in n8n
2. Find the verification request
3. Check what was received:

**Should see:**

```json
{
  "query": {
    "hub.mode": "subscribe",
    "hub.verify_token": "salon_bot_ai_verify_2026",
    "hub.challenge": "123456789"
  }
}
```

**Should respond:**

```
123456789
```

### Common Issues

**Issue 1: Still getting error**

- Make sure webhook is ACTIVE (toggle in top right)
- Check HTTP Method is "ALL" not "POST"
- Verify the verify token matches EXACTLY

**Issue 2: Webhook not receiving requests**

- Check n8n workflow is saved and active
- Try the test URL instead of production URL
- Check firewall/network settings

**Issue 3: Returns wrong value**

- Make sure response is `{{ $json.challenge }}` not the whole object
- Check Content-Type is text/plain

---

## 📋 Verification Checklist

Before clicking "Verify and Save" in Meta:

- [ ] n8n workflow is ACTIVE (green toggle)
- [ ] Webhook HTTP Method is "ALL"
- [ ] Code node handles GET requests
- [ ] Verification response returns challenge value
- [ ] Verify token matches: `salon_bot_ai_verify_2026`
- [ ] Callback URL is correct (from n8n webhook node)
- [ ] No trailing slashes in URL
- [ ] Test URL works (curl test above)

---

## 🎯 Exact Values for Meta Console

```
Callback URL:
https://primary-production-f64c.up.railway.app/webhook-test/webhook-whatsapp

Verify Token:
salon_bot_ai_verify_2026

⚠️ Make sure there are NO SPACES before or after these values!
```

---

## 🆘 Still Not Working?

### Share These Details:

1. **n8n execution log** (from Executions tab)
2. **Exact error message** from Meta
3. **Your webhook URL** (from n8n)
4. **Verification token** you're using

### Quick Debug:

```bash
# Test your webhook manually
curl -v "https://primary-production-f64c.up.railway.app/webhook-test/webhook-whatsapp?hub.mode=subscribe&hub.verify_token=salon_bot_ai_verify_2026&hub.challenge=12345"

# Should return: 12345
# If it returns anything else or errors, that's the problem
```

---

## 💡 Understanding the Verify Token

**What is it?**

- Just a secret string YOU choose
- Meta sends it back during verification
- Your webhook checks if it matches
- Prevents unauthorized webhook setup

**Where it's used:**

1. ✅ You put it in n8n code: `'salon_bot_ai_verify_2026'`
2. ✅ You put it in Meta Console: `salon_bot_ai_verify_2026`
3. ❌ You DON'T put it in .env (it's hardcoded in workflow)

**Can you change it?**

- Yes! Just make sure both places match:
  - n8n code
  - Meta Console

---

Let me know if you get stuck at any step and I'll help debug!
