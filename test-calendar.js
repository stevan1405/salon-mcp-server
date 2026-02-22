// test-calendar.js
require('dotenv').config();
const { google } = require('googleapis');

async function test() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  
  auth.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });
  
  const calendar = google.calendar({ version: 'v3', auth });
  
  const events = await calendar.events.list({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    maxResults: 5
  });
  
  console.log('✅ Success! Found', events.data.items.length, 'events');
}

test().catch(err => console.error('❌ Error:', err.message));