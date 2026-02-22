require('dotenv').config();
const Airtable = require('airtable');

const airtable = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY });
const base = airtable.base(process.env.AIRTABLE_BASE_ID);

async function test() {
  try {
    console.log('Testing Airtable connection...');
    const records = await base('Services').select({ maxRecords: 1 }).firstPage();
    console.log('✅ Success! Found', records.length, 'record(s)');
    console.log('First service:', records[0]?.fields);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

test();