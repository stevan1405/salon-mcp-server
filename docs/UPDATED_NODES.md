# Updated n8n Nodes - WhatsApp Webhook Flow

## Node 1: WhatsApp Webhook POST

**Node Type:** Webhook
**Configuration:**

```json
{
  "parameters": {
    "httpMethod": "POST",
    "path": "webhook-whatsapp",
    "responseMode": "responseNode",
    "options": {}
  },
  "name": "WhatsApp Webhook POST",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 1.1,
  "position": [250, 300],
  "webhookId": "your-webhook-id"
}
```

**Settings:**

- HTTP Method: POST
- Path: webhook-whatsapp
- Authentication: None
- Response Mode: Using 'Respond to Webhook' Node

---

## Node 2: WhatsApp Webhook GET

**Node Type:** Webhook
**Configuration:**

```json
{
  "parameters": {
    "httpMethod": "GET",
    "path": "webhook-whatsapp",
    "responseMode": "responseNode",
    "options": {}
  },
  "name": "WhatsApp Webhook GET",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 1.1,
  "position": [250, 450],
  "webhookId": "your-webhook-id-get"
}
```

**Settings:**

- HTTP Method: GET
- Path: webhook-whatsapp (same path as POST!)
- Authentication: None
- Response Mode: Using 'Respond to Webhook' Node

---

## Node 3: Handle Verification (Code Node)

**Node Type:** Code
**Configuration:**

```javascript
// Handle both GET (verification) and POST (messages) requests
const query = $input.first().json.query || {};
const body = $input.first().json.body || {};
const method = $input.first().json.method || "POST";

// GET request = Meta verification
if (method === "GET" && query["hub.mode"] === "subscribe") {
  // Check if verify token matches
  if (query["hub.verify_token"] === "salon_bot_ai_verify_2026") {
    return [
      {
        json: {
          isVerification: true,
          challenge: query["hub.challenge"],
        },
      },
    ];
  } else {
    // Verification token doesn't match
    return [
      {
        json: {
          isVerification: false,
          error: "Verification token mismatch",
        },
      },
    ];
  }
}

// POST request = Actual WhatsApp message
if (method === "POST" && body.entry) {
  return [
    {
      json: {
        isVerification: false,
        messageData: body,
      },
    },
  ];
}

// Unknown request type
return [
  {
    json: {
      isVerification: false,
      error: "Unknown request type",
    },
  },
];
```

**n8n Node JSON:**

```json
{
  "parameters": {
    "jsCode": "// Handle both GET (verification) and POST (messages) requests\nconst query = $input.first().json.query || {};\nconst body = $input.first().json.body || {};\nconst method = $input.first().json.method || 'POST';\n\n// GET request = Meta verification\nif (method === 'GET' && query['hub.mode'] === 'subscribe') {\n  // Check if verify token matches\n  if (query['hub.verify_token'] === 'salon_bot_ai_verify_2026') {\n    return [{\n      json: {\n        isVerification: true,\n        challenge: query['hub.challenge']\n      }\n    }];\n  } else {\n    // Verification token doesn't match\n    return [{\n      json: {\n        isVerification: false,\n        error: 'Verification token mismatch'\n      }\n    }];\n  }\n}\n\n// POST request = Actual WhatsApp message\nif (method === 'POST' && body.entry) {\n  return [{\n    json: {\n      isVerification: false,\n      messageData: body\n    }\n  }];\n}\n\n// Unknown request type\nreturn [{\n  json: {\n    isVerification: false,\n    error: 'Unknown request type'\n  }\n}];"
  },
  "name": "Handle Verification",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [550, 375]
}
```

---

## Node 4: Is Verification? (IF Node)

**Node Type:** IF
**Configuration:**

**Conditions:**

- Type: Boolean
- Value 1: `{{ $json.isVerification }}`
- Operation: Equal
- Value 2: `true`

**n8n Node JSON:**

```json
{
  "parameters": {
    "conditions": {
      "boolean": [
        {
          "value1": "={{ $json.isVerification }}",
          "value2": true
        }
      ]
    }
  },
  "name": "Is Verification?",
  "type": "n8n-nodes-base.if",
  "typeVersion": 2,
  "position": [750, 375]
}
```

**Important Settings:**

- Continue on Fail: No
- Output: Continue on TRUE/FALSE

---

## Node 5: Verification Response

**Node Type:** Respond to Webhook
**Configuration:**

**Response:**

- Response Code: 200
- Response Body: `{{ $json.challenge }}`
- Content-Type: text/plain (optional)

**n8n Node JSON:**

```json
{
  "parameters": {
    "respondWith": "text",
    "responseBody": "={{ $json.challenge }}",
    "options": {
      "responseCode": 200
    }
  },
  "name": "Verification Response",
  "type": "n8n-nodes-base.respondToWebhook",
  "typeVersion": 1,
  "position": [1000, 250]
}
```

---

## Node 6: Filter Valid Messages (IF Node)

**Node Type:** IF
**Configuration:**

**Conditions:**

- Type: String (or Boolean)
- Value 1: `{{ $json.messageData }}`
- Operation: Is Not Empty

**Alternative (Better):**

- Type: Boolean
- Value 1: `{{ $json.messageData !== undefined && $json.messageData.entry !== undefined }}`
- Operation: Is True

**n8n Node JSON:**

```json
{
  "parameters": {
    "conditions": {
      "boolean": [
        {
          "value1": "={{ $json.messageData !== undefined }}",
          "value2": true
        }
      ]
    }
  },
  "name": "Filter Valid Messages",
  "type": "n8n-nodes-base.if",
  "typeVersion": 2,
  "position": [1000, 500]
}
```

---

## Node 7: Extract Message Data (Code Node)

**Node Type:** Code
**Configuration:**

```javascript
// Extract message data from WhatsApp webhook
// Data comes from messageData property (set by Handle Verification node)

const data = $input.first().json;

// Get webhook data
let webhookData = data.messageData;

// Validate we have the expected structure
if (!webhookData || typeof webhookData !== "object") {
  throw new Error("No webhook data object found");
}

if (!webhookData.entry || !Array.isArray(webhookData.entry)) {
  throw new Error("No entry array found in webhook data");
}

if (webhookData.entry.length === 0) {
  throw new Error("Entry array is empty");
}

// Extract the message details
const entry = webhookData.entry[0];
const changes = entry.changes || [];

if (changes.length === 0) {
  throw new Error("No changes found in entry");
}

const value = changes[0].value;

if (!value || !value.messages || value.messages.length === 0) {
  throw new Error("No messages found in webhook data");
}

const message = value.messages[0];
const contact = value.contacts ? value.contacts[0] : null;

// Return extracted and formatted data
return [
  {
    json: {
      phoneNumber: message.from,
      customerName: contact?.profile?.name || "Unknown",
      messageId: message.id,
      timestamp: message.timestamp,
      messageType: message.type,
      messageText: message.type === "text" ? message.text?.body || null : null,
      audioId: message.type === "audio" ? message.audio?.id || null : null,
      imageId: message.type === "image" ? message.image?.id || null : null,
      documentId:
        message.type === "document" ? message.document?.id || null : null,
      voiceId: message.type === "voice" ? message.voice?.id || null : null,
    },
  },
];
```

**n8n Node JSON:**

```json
{
  "parameters": {
    "jsCode": "// Extract message data from WhatsApp webhook\n// Data comes from messageData property (set by Handle Verification node)\n\nconst data = $input.first().json;\n\n// Get webhook data\nlet webhookData = data.messageData;\n\n// Validate we have the expected structure\nif (!webhookData || typeof webhookData !== 'object') {\n  throw new Error('No webhook data object found');\n}\n\nif (!webhookData.entry || !Array.isArray(webhookData.entry)) {\n  throw new Error('No entry array found in webhook data');\n}\n\nif (webhookData.entry.length === 0) {\n  throw new Error('Entry array is empty');\n}\n\n// Extract the message details\nconst entry = webhookData.entry[0];\nconst changes = entry.changes || [];\n\nif (changes.length === 0) {\n  throw new Error('No changes found in entry');\n}\n\nconst value = changes[0].value;\n\nif (!value || !value.messages || value.messages.length === 0) {\n  throw new Error('No messages found in webhook data');\n}\n\nconst message = value.messages[0];\nconst contact = value.contacts ? value.contacts[0] : null;\n\n// Return extracted and formatted data\nreturn [{\n  json: {\n    phoneNumber: message.from,\n    customerName: contact?.profile?.name || 'Unknown',\n    messageId: message.id,\n    timestamp: message.timestamp,\n    messageType: message.type,\n    messageText: message.type === 'text' ? (message.text?.body || null) : null,\n    audioId: message.type === 'audio' ? (message.audio?.id || null) : null,\n    imageId: message.type === 'image' ? (message.image?.id || null) : null,\n    documentId: message.type === 'document' ? (message.document?.id || null) : null,\n    voiceId: message.type === 'voice' ? (message.voice?.id || null) : null\n  }\n}];"
  },
  "name": "Extract Message Data",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [1250, 500]
}
```

---

## Complete Workflow Connections

```
WhatsApp Webhook POST ─┐
                       ├──→ Handle Verification ──→ Is Verification?
WhatsApp Webhook GET ──┘                                    │
                                                            │
                                    ┌───────────────────────┴────────────────────┐
                                    │                                            │
                                   TRUE                                        FALSE
                                    │                                            │
                                    ▼                                            ▼
                          Verification Response                     Filter Valid Messages
                                                                              │
                                                                             TRUE
                                                                              │
                                                                              ▼
                                                                   Extract Message Data
                                                                              │
                                                                              ▼
                                                                    [Continue to rest...]
```

---

## Complete Workflow JSON (All Nodes Together)

Use this to import all nodes at once:

```json
{
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "webhook-whatsapp",
        "responseMode": "responseNode"
      },
      "name": "WhatsApp Webhook POST",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1.1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "httpMethod": "GET",
        "path": "webhook-whatsapp",
        "responseMode": "responseNode"
      },
      "name": "WhatsApp Webhook GET",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1.1,
      "position": [250, 450]
    },
    {
      "parameters": {
        "jsCode": "const query = $input.first().json.query || {};\nconst body = $input.first().json.body || {};\nconst method = $input.first().json.method || 'POST';\n\nif (method === 'GET' && query['hub.mode'] === 'subscribe') {\n  if (query['hub.verify_token'] === 'salon_bot_ai_verify_2026') {\n    return [{ json: { isVerification: true, challenge: query['hub.challenge'] } }];\n  } else {\n    return [{ json: { isVerification: false, error: 'Verification token mismatch' } }];\n  }\n}\n\nif (method === 'POST' && body.entry) {\n  return [{ json: { isVerification: false, messageData: body } }];\n}\n\nreturn [{ json: { isVerification: false, error: 'Unknown request type' } }];"
      },
      "name": "Handle Verification",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [550, 375]
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{ $json.isVerification }}",
              "value2": true
            }
          ]
        }
      },
      "name": "Is Verification?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [750, 375]
    },
    {
      "parameters": {
        "respondWith": "text",
        "responseBody": "={{ $json.challenge }}",
        "options": {
          "responseCode": 200
        }
      },
      "name": "Verification Response",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1000, 250]
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{ $json.messageData !== undefined }}",
              "value2": true
            }
          ]
        }
      },
      "name": "Filter Valid Messages",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [1000, 500]
    },
    {
      "parameters": {
        "jsCode": "const data = $input.first().json;\nlet webhookData = data.messageData;\n\nif (!webhookData || typeof webhookData !== 'object') {\n  throw new Error('No webhook data object found');\n}\n\nif (!webhookData.entry || !Array.isArray(webhookData.entry)) {\n  throw new Error('No entry array found in webhook data');\n}\n\nif (webhookData.entry.length === 0) {\n  throw new Error('Entry array is empty');\n}\n\nconst entry = webhookData.entry[0];\nconst changes = entry.changes || [];\n\nif (changes.length === 0) {\n  throw new Error('No changes found in entry');\n}\n\nconst value = changes[0].value;\n\nif (!value || !value.messages || value.messages.length === 0) {\n  throw new Error('No messages found in webhook data');\n}\n\nconst message = value.messages[0];\nconst contact = value.contacts ? value.contacts[0] : null;\n\nreturn [{\n  json: {\n    phoneNumber: message.from,\n    customerName: contact?.profile?.name || 'Unknown',\n    messageId: message.id,\n    timestamp: message.timestamp,\n    messageType: message.type,\n    messageText: message.type === 'text' ? (message.text?.body || null) : null,\n    audioId: message.type === 'audio' ? (message.audio?.id || null) : null,\n    imageId: message.type === 'image' ? (message.image?.id || null) : null,\n    documentId: message.type === 'document' ? (message.document?.id || null) : null,\n    voiceId: message.type === 'voice' ? (message.voice?.id || null) : null\n  }\n}];"
      },
      "name": "Extract Message Data",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1250, 500]
    }
  ],
  "connections": {
    "WhatsApp Webhook POST": {
      "main": [[{ "node": "Handle Verification", "type": "main", "index": 0 }]]
    },
    "WhatsApp Webhook GET": {
      "main": [[{ "node": "Handle Verification", "type": "main", "index": 0 }]]
    },
    "Handle Verification": {
      "main": [[{ "node": "Is Verification?", "type": "main", "index": 0 }]]
    },
    "Is Verification?": {
      "main": [
        [{ "node": "Verification Response", "type": "main", "index": 0 }],
        [{ "node": "Filter Valid Messages", "type": "main", "index": 0 }]
      ]
    },
    "Filter Valid Messages": {
      "main": [[{ "node": "Extract Message Data", "type": "main", "index": 0 }]]
    }
  }
}
```

---

## How to Import

### Option 1: Import Individual Nodes

1. Open n8n
2. Click "+" to add new node
3. Search for node type (Webhook, Code, IF, etc.)
4. Copy the JavaScript code from above into the Code nodes
5. Set the parameters as shown for IF and Webhook nodes

### Option 2: Import Complete Workflow

1. Copy the "Complete Workflow JSON" section
2. In n8n, click menu (three dots) → "Import from File" or "Import from URL"
3. Paste the JSON
4. All nodes will be imported with connections!

---

## Testing Instructions

### Test 1: Verification (GET)

```bash
curl -X GET "https://your-n8n-url/webhook-test/webhook-whatsapp?hub.mode=subscribe&hub.verify_token=salon_bot_ai_verify_2026&hub.challenge=TEST123"

# Should return: TEST123
```

### Test 2: Message (POST)

```bash
curl -X POST "https://your-n8n-url/webhook-test/webhook-whatsapp" \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "contacts": [{"profile": {"name": "John"}, "wa_id": "123"}],
          "messages": [{
            "from": "123",
            "id": "msg1",
            "timestamp": "123456",
            "type": "text",
            "text": {"body": "Hello"}
          }]
        }
      }]
    }]
  }'

# Should process successfully
```

---

## Notes

- All code uses `$input.first()` (modern n8n syntax)
- Error handling included in all Code nodes
- Verify token: `salon_bot_ai_verify_2026` (change if needed)
- Both webhooks use same path: `webhook-whatsapp`
- No authentication required (as needed for WhatsApp)

---

Good luck! Import these and you should have a working verification flow! 🚀
