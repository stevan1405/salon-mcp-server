require('dotenv').config();
const { google } = require('googleapis');

async function testAuth() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  
  auth.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });
  
  try {
    const calendar = google.calendar({ version: 'v3', auth });
    const response = await calendar.calendarList.list();
    console.log('✅ Auth works! Calendars:', response.data.items.map(c => c.summary));
  } catch (error) {
    console.error('❌ Auth failed:', error.message);
    console.error('Error details:', error.response?.data || error);
  }
}

testAuth();