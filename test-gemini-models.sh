

API_KEY="AIzaSyAVu5zJA6BRg-LuT_8NyQoJQ_UQpViQPDM"

echo "╔════════════════════════════════════════════════════════╗"
echo "║         Testing Gemini API Models                     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

echo "🔍 Listing available models..."
echo ""

curl -s "https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}" | jq '.models[] | {name: .name, displayName: .displayName, supportedGenerationMethods: .supportedGenerationMethods}'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Testing recommended models:"
echo ""

# Test with gemini-1.5-flash (most common)
echo "1️⃣ Testing gemini-1.5-flash..."
RESPONSE1=$(curl -s "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{"text": "Say hello in one word"}]
    }]
  }')

if echo "$RESPONSE1" | grep -q "error"; then
  echo "❌ gemini-1.5-flash failed"
  echo "$RESPONSE1" | jq '.error'
else
  echo "✅ gemini-1.5-flash works!"
  echo "$RESPONSE1" | jq '.candidates[0].content.parts[0].text'
fi

echo ""

# Test with gemini-pro (fallback)
echo "2️⃣ Testing gemini-pro..."
RESPONSE2=$(curl -s "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{"text": "Say hello in one word"}]
    }]
  }')

if echo "$RESPONSE2" | grep -q "error"; then
  echo "❌ gemini-pro failed"
  echo "$RESPONSE2" | jq '.error'
else
  echo "✅ gemini-pro works!"
  echo "$RESPONSE2" | jq '.candidates[0].content.parts[0].text'
fi

echo ""

# Test with gemini-1.5-pro
echo "3️⃣ Testing gemini-1.5-pro..."
RESPONSE3=$(curl -s "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{"text": "Say hello in one word"}]
    }]
  }')

if echo "$RESPONSE3" | grep -q "error"; then
  echo "❌ gemini-1.5-pro failed"
  echo "$RESPONSE3" | jq '.error'
else
  echo "✅ gemini-1.5-pro works!"
  echo "$RESPONSE3" | jq '.candidates[0].content.parts[0].text'
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Test complete!"