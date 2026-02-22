// Simplified Airtable Setup - No MCP Dependencies Required
require('dotenv').config();
const Airtable = require('airtable');

class AirtableSetup {
  constructor() {
    console.log('🔍 Checking environment variables...\n');
    
    if (!process.env.AIRTABLE_API_KEY) {
      throw new Error('❌ AIRTABLE_API_KEY not found in .env file');
    }
    
    if (!process.env.AIRTABLE_BASE_ID) {
      throw new Error('❌ AIRTABLE_BASE_ID not found in .env file');
    }
    
    console.log('✅ Environment variables found');
    console.log('   API Key:', process.env.AIRTABLE_API_KEY.substring(0, 10) + '...');
    console.log('   Base ID:', process.env.AIRTABLE_BASE_ID);
    console.log('');
    
    this.airtable = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY });
    this.base = this.airtable.base(process.env.AIRTABLE_BASE_ID);
  }

  async setup() {
    console.log('🚀 Starting Airtable database setup...\n');

    try {
      await this.testConnection();
      await this.addDefaultServices();
      await this.addDefaultSettings();

      console.log('\n✅ Database setup complete!');
      console.log('📊 Your Airtable base is ready to use.');
      
    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
      console.log('\n💡 Create tables manually in Airtable first, then run this again.');
      this.printTableSchemas();
      process.exit(1);
    }
  }

  async testConnection() {
    console.log('🔌 Testing Airtable connection...');
    
    try {
      await this.base('Services').select({ maxRecords: 1 }).firstPage();
      console.log('✅ Connection successful - Services table found');
    } catch (error) {
      if (error.message.includes('NOT_FOUND')) {
        console.log('⚠️  Tables not found - please create them manually first');
        throw new Error('Tables need to be created in Airtable');
      } else {
        throw new Error(`Connection failed: ${error.message}`);
      }
    }
  }

  async addDefaultServices() {
    console.log('\n📦 Adding default services...');

    const defaultServices = [
      { name: 'Classic Manicure', description: 'Traditional nail care with polish', duration: 45, price: 30, category: 'Nails', archived: false },
      { name: 'Gel Manicure', description: 'Long-lasting gel polish manicure', duration: 60, price: 45, category: 'Nails', archived: false },
      { name: 'Classic Pedicure', description: 'Relaxing foot care with polish', duration: 60, price: 40, category: 'Nails', archived: false },
      { name: 'Gel Pedicure', description: 'Long-lasting gel polish pedicure', duration: 75, price: 55, category: 'Nails', archived: false },
      { name: 'Acrylic Full Set', description: 'Full set of acrylic nails', duration: 120, price: 65, category: 'Nails', archived: false },
      { name: 'Acrylic Fill', description: 'Acrylic nail fill maintenance', duration: 90, price: 45, category: 'Nails', archived: false },
      { name: 'Nail Art (per nail)', description: 'Custom nail art design', duration: 10, price: 5, category: 'Nails', archived: false }
    ];

    try {
      const existing = await this.base('Services').select({ maxRecords: 1 }).firstPage();
      if (existing.length > 0) {
        console.log('ℹ️  Services already exist, skipping...');
        return;
      }

      for (const service of defaultServices) {
        await this.base('Services').create(service);
        console.log(`  ✓ Added: ${service.name} - $${service.price} (${service.duration} min)`);
      }
      console.log('✅ Default services added successfully');
    } catch (error) {
      console.log('⚠️  Could not add services:', error.message);
    }
  }

  async addDefaultSettings() {
    console.log('\n⚙️  Adding default business settings...');

    const defaultSettings = {
      business_name: 'Your Salon Name',
      business_hours: 'Mon-Fri: 9:00 AM - 6:00 PM\nSat: 10:00 AM - 5:00 PM\nSun: Closed',
      business_hours_json: JSON.stringify({
        Monday: { open: '09:00', close: '18:00' },
        Tuesday: { open: '09:00', close: '18:00' },
        Wednesday: { open: '09:00', close: '18:00' },
        Thursday: { open: '09:00', close: '18:00' },
        Friday: { open: '09:00', close: '18:00' },
        Saturday: { open: '10:00', close: '17:00' },
        Sunday: { closed: true }
      }),
      booking_limit: 6,
      timezone: 'America/New_York',
      rate_limit: 30
    };

    try {
      const existing = await this.base('BusinessSettings').select({ maxRecords: 1 }).firstPage();
      if (existing.length > 0) {
        console.log('ℹ️  Business settings already exist');
        return;
      }

      await this.base('BusinessSettings').create(defaultSettings);
      console.log('✅ Default business settings added');
    } catch (error) {
      console.log('⚠️  Could not add settings:', error.message);
    }
  }

  printTableSchemas() {
    console.log('\n📋 CREATE THESE 4 TABLES IN AIRTABLE:\n');
    console.log('TABLE 1: Services');
    console.log('  - name (Single line text)');
    console.log('  - description (Long text)');
    console.log('  - duration (Number)');
    console.log('  - price (Currency $)');
    console.log('  - category (Single select: Nails, Hair, etc.)');
    console.log('  - archived (Checkbox)\n');
    
    console.log('TABLE 2: Customers');
    console.log('  - name (Single line text)');
    console.log('  - phone_number (Phone number)');
    console.log('  - total_bookings (Number)');
    console.log('  - last_booking_date (Date)\n');
    
    console.log('TABLE 3: Bookings');
    console.log('  - customer_name (Single line text)');
    console.log('  - customer_phone (Phone number)');
    console.log('  - service (Single line text)');
    console.log('  - date_time (Date with time)');
    console.log('  - duration (Number)');
    console.log('  - price (Currency $)');
    console.log('  - status (Single select: confirmed, cancelled, completed)');
    console.log('  - google_event_id (Single line text)\n');
    
    console.log('TABLE 4: BusinessSettings');
    console.log('  - business_name (Single line text)');
    console.log('  - business_hours (Long text)');
    console.log('  - business_hours_json (Long text)');
    console.log('  - booking_limit (Number)');
    console.log('  - timezone (Single line text)');
    console.log('  - rate_limit (Number)\n');
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Salon WhatsApp Bot - Airtable Setup                 ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const setup = new AirtableSetup();
  await setup.setup();
}

if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = AirtableSetup;