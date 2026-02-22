// MCP Server for Salon Booking System - Direct API Implementation
// This server provides booking tools that n8n can call
require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const Airtable = require('airtable');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(express.json());

// Initialize services
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'dummy-key-for-n8n-only'
});

const calendar = google.calendar({ 
  version: 'v3', 
  auth: getGoogleAuth() 
});

const airtable = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY });
const base = airtable.base(process.env.AIRTABLE_BASE_ID);

function getGoogleAuth() {
  // Use service account (production - never expires)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_FILE) {
    const path = require('path');
    const serviceAccountPath = path.resolve(__dirname, process.env.GOOGLE_SERVICE_ACCOUNT_FILE);
    
    const auth = new google.auth.GoogleAuth({
      keyFile: serviceAccountPath,
      scopes: ['https://www.googleapis.com/auth/calendar']
    });
    
    console.log('✅ Using Google Service Account (never expires)');
    return auth;
  }
  
  // Fallback to OAuth (development only)
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  
  auth.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });
  
  // Auto-refresh tokens and log for monitoring
  auth.on('tokens', (tokens) => {
    console.log('🔄 Google tokens refreshed automatically');
    if (tokens.refresh_token) {
      console.log('⚠️  New refresh token received. Update .env with:');
      console.log(`   GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    }
  });
  
  console.log('⚠️  Using OAuth (may expire - add GOOGLE_SERVICE_ACCOUNT_FILE to .env for production)');
  return auth;
}

// ============================================
// TOOL FUNCTIONS
// ============================================

async function checkCalendarAvailability({ date, service, duration }) {
  try {
    // Get service details from Airtable if duration not provided
    if (!duration) {
      try {
        const serviceRecord = await base('Services')
          .select({
            filterByFormula: `{name} = '${service}'`,
            maxRecords: 1
          })
          .firstPage();
        
        if (serviceRecord.length === 0) {
          return { error: 'Service not found' };
        }
        
        duration = serviceRecord[0].get('duration');
      } catch (airtableError) {
        console.error('Airtable service query error:', airtableError);
        return { error: `Airtable error: ${airtableError.message}` };
      }
    }

    // Get business hours from settings
    let businessHours;
    try {
      const settings = await base('BusinessSettings').select({ maxRecords: 1 }).firstPage();
      const businessHoursJson = settings[0].get('business_hours_json');
      businessHours = typeof businessHoursJson === 'string' 
        ? JSON.parse(businessHoursJson) 
        : businessHoursJson;
    } catch (airtableError) {
      console.error('Airtable settings query error:', airtableError);
      return { error: `Airtable error: ${airtableError.message}` };
    }

    // Parse business hours for the requested date
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    const hoursForDay = businessHours[dayOfWeek];

    if (!hoursForDay || hoursForDay.closed) {
      return { available: false, reason: 'Business closed on this day' };
    }

    // Get existing events from Google Calendar
    let events;
    try {
      events = await calendar.events.list({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        timeMin: new Date(`${date}T${hoursForDay.open}:00`).toISOString(),
        timeMax: new Date(`${date}T${hoursForDay.close}:00`).toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });
    } catch (calendarError) {
      console.error('Google Calendar error:', calendarError);
      return { error: `Calendar error: ${calendarError.message}` };
    }

    // Calculate available slots
    const availableSlots = calculateAvailableSlots(
      hoursForDay.open,
      hoursForDay.close,
      duration,
      events.data.items || []
    );

    return {
      available: availableSlots.length > 0,
      slots: availableSlots,
      date,
      service,
      duration
    };
  } catch (error) {
    console.error('Error checking calendar:', error);
    return { error: error.message };
  }
}

function calculateAvailableSlots(openTime, closeTime, duration, existingEvents) {
  const slots = [];
  const slotInterval = 30; // 30-minute intervals
  
  let currentTime = parseTime(openTime);
  const endTime = parseTime(closeTime);

  while (currentTime + duration <= endTime) {
    const slotEnd = currentTime + duration;
    
    // Check if this slot conflicts with existing events
    const hasConflict = existingEvents.some(event => {
      const eventStart = new Date(event.start.dateTime).getHours() * 60 + 
                        new Date(event.start.dateTime).getMinutes();
      const eventEnd = new Date(event.end.dateTime).getHours() * 60 + 
                      new Date(event.end.dateTime).getMinutes();
      
      return (currentTime < eventEnd && slotEnd > eventStart);
    });

    if (!hasConflict) {
      slots.push(formatTime(currentTime));
    }

    currentTime += slotInterval;
  }

  return slots;
}

function parseTime(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
  return `${displayHours}:${mins.toString().padStart(2, '0')} ${ampm}`;
}

async function createBooking(params) {
  try {
    const {
      customerName,
      customerPhone,
      service,
      dateTime,
      friendBooking = false,
      friendName,
      friendPhone
    } = params;

    // Get or create customer
    let customer = await getOrCreateCustomer(customerPhone, customerName);

    // Check booking limit
    const bookingCount = customer.get('total_bookings') || 0;
    const bookingLimit = await getBookingLimit();

    if (bookingCount >= bookingLimit) {
      return {
        success: false,
        error: `Booking limit reached (${bookingLimit} appointments per customer)`
      };
    }

    // Get service details
    const serviceRecord = await base('Services')
      .select({
        filterByFormula: `{name} = '${service}'`,
        maxRecords: 1
      })
      .firstPage();

    if (serviceRecord.length === 0) {
      return { success: false, error: 'Service not found' };
    }

    const serviceDetails = serviceRecord[0];
    const duration = serviceDetails.get('duration');
    const price = serviceDetails.get('price');

    // Create event in Google Calendar
    const eventStartTime = new Date(dateTime);
    const eventEndTime = new Date(eventStartTime.getTime() + duration * 60000);

    const calendarEvent = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      requestBody: {
        summary: `${service} - ${friendBooking ? friendName : customerName}`,
        description: `Service: ${service}\nCustomer: ${customerName}\nPhone: ${customerPhone}${
          friendBooking ? `\nFor: ${friendName} (${friendPhone})` : ''
        }\nPrice: $${price}`,
        start: {
          dateTime: eventStartTime.toISOString(),
          timeZone: 'America/New_York'
        },
        end: {
          dateTime: eventEndTime.toISOString(),
          timeZone: 'America/New_York'
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 1440 }, // 24 hours before
            { method: 'popup', minutes: 60 }
          ]
        }
      }
    });

    // Create booking record in Airtable
    const booking = await base('Bookings').create({
      customer_name: friendBooking ? friendName : customerName,
      customer_phone: friendBooking ? friendPhone : customerPhone,
      service: service,
      date_time: dateTime,
      duration: duration,
      price: price,
      status: 'confirmed',
      google_event_id: calendarEvent.data.id
    });

    // Update customer booking count
    await base('Customers').update(customer.id, {
      total_bookings: bookingCount + 1,
      last_booking_date: dateTime
    });

    return {
      success: true,
      bookingId: booking.id,
      message: `✅ Booking confirmed!\n\n📅 ${service}\n🕐 ${eventStartTime.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })}\n💰 $${price}${friendBooking ? `\n👤 For: ${friendName}` : ''}\n\nYou'll receive a reminder 24 hours before.`
    };
  } catch (error) {
    console.error('Error creating booking:', error);
    return { success: false, error: error.message };
  }
}

async function getOrCreateCustomer(phone, name) {
  const existing = await base('Customers')
    .select({
      filterByFormula: `{phone_number} = '${phone}'`,
      maxRecords: 1
    })
    .firstPage();

  if (existing.length > 0) {
    return existing[0];
  }

  return await base('Customers').create({
    name: name,
    phone_number: phone,
    total_bookings: 0
  });
}

async function getBookingLimit() {
  const settings = await base('BusinessSettings').select({ maxRecords: 1 }).firstPage();
  return settings[0].get('booking_limit') || 6;
}

async function getCustomerBookings({ phoneNumber, upcomingOnly = true }) {
  try {
    let formula = `{customer_phone} = '${phoneNumber}'`;
    
    if (upcomingOnly) {
      const now = new Date().toISOString();
      formula = `AND(${formula}, {date_time} >= '${now}', {status} != 'cancelled')`;
    }

    const bookings = await base('Bookings')
      .select({
        filterByFormula: formula,
        sort: [{ field: 'date_time', direction: 'asc' }]
      })
      .all();

    return {
      success: true,
      count: bookings.length,
      bookings: bookings.map(b => ({
        id: b.id,
        service: b.get('service'),
        dateTime: b.get('date_time'),
        price: b.get('price'),
        status: b.get('status')
      }))
    };
  } catch (error) {
    console.error('Error getting bookings:', error);
    return { success: false, error: error.message };
  }
}

async function cancelBooking({ bookingId, reason }) {
  try {
    const booking = await base('Bookings').find(bookingId);
    const googleEventId = booking.get('google_event_id');

    // Cancel in Google Calendar
    if (googleEventId) {
      await calendar.events.delete({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        eventId: googleEventId
      });
    }

    // Update booking status in Airtable
    await base('Bookings').update(bookingId, {
      status: 'cancelled',
      cancellation_reason: reason || 'Customer request'
    });

    return {
      success: true,
      message: 'Appointment cancelled successfully'
    };
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return { success: false, error: error.message };
  }
}

async function rescheduleBooking({ bookingId, newDateTime }) {
  try {
    // Get existing booking
    const booking = await base('Bookings').find(bookingId);
    const googleEventId = booking.get('google_event_id');
    const service = booking.get('service');
    const duration = booking.get('duration');
    const customerName = booking.get('customer_name');
    const customerPhone = booking.get('customer_phone');
    const price = booking.get('price');

    // Update in Google Calendar
    if (googleEventId) {
      const eventStartTime = new Date(newDateTime);
      const eventEndTime = new Date(eventStartTime.getTime() + duration * 60000);

      await calendar.events.update({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        eventId: googleEventId,
        requestBody: {
          summary: `${service} - ${customerName}`,
          description: `Service: ${service}\nCustomer: ${customerName}\nPhone: ${customerPhone}\nPrice: $${price}\n\nRescheduled from: ${booking.get('date_time')}`,
          start: {
            dateTime: eventStartTime.toISOString(),
            timeZone: 'America/New_York'
          },
          end: {
            dateTime: eventEndTime.toISOString(),
            timeZone: 'America/New_York'
          }
        }
      });
    }

    // Update booking in Airtable
    await base('Bookings').update(bookingId, {
      date_time: newDateTime,
      status: 'confirmed'
    });

    const newDate = new Date(newDateTime);
    return {
      success: true,
      message: `✅ Appointment rescheduled!\n\n📅 ${service}\n🕐 ${newDate.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })}\n💰 $${price}`
    };
  } catch (error) {
    console.error('Error rescheduling booking:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// API ENDPOINTS
// ============================================

// Individual tool endpoints (called by Execute Tools node)
app.post('/tools/check_calendar', async (req, res) => {
  try {
    const result = await checkCalendarAvailability(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/tools/create_booking', async (req, res) => {
  try {
    const result = await createBooking(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/tools/get_customer_bookings', async (req, res) => {
  try {
    const result = await getCustomerBookings(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/tools/cancel_booking', async (req, res) => {
  try {
    const result = await cancelBooking(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/tools/reschedule_booking', async (req, res) => {
  try {
    const result = await rescheduleBooking(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ↓↓↓ ADD MIDDLEWARE HERE ↓↓↓
app.use('/mcp', (req, res, next) => {
  const secret = req.headers['x-api-secret'];
  if (secret !== process.env.MCP_SECRET) {
    return res.status(401).json({ error: 'Unauthorised' });
  }
  next();
});

// Main Claude endpoint (called by Booking Agent node)
app.post('/mcp/claude', async (req, res) => {
  try {
    const { messages, system, tools } = req.body;

    // Define available tools for Claude
    const availableTools = [
      {
        name: 'check_calendar',
        description: 'Check available time slots in the salon calendar for a specific date and service',
        input_schema: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'The date to check availability (YYYY-MM-DD format)'
            },
            service: {
              type: 'string',
              description: 'The service name to book'
            },
            duration: {
              type: 'number',
              description: 'Duration in minutes (optional, will be looked up if not provided)'
            }
          },
          required: ['date', 'service']
        }
      },
      {
        name: 'create_booking',
        description: 'Create a new appointment booking in both Airtable and Google Calendar',
        input_schema: {
          type: 'object',
          properties: {
            customerName: { type: 'string', description: 'Customer name' },
            customerPhone: { type: 'string', description: 'Customer phone number' },
            service: { type: 'string', description: 'Service name' },
            dateTime: { type: 'string', description: 'Appointment date and time (ISO 8601 format)' },
            friendBooking: { type: 'boolean', description: 'Is this booking for a friend?' },
            friendName: { type: 'string', description: 'Friend name if booking for someone else' },
            friendPhone: { type: 'string', description: 'Friend phone if booking for someone else' }
          },
          required: ['customerName', 'customerPhone', 'service', 'dateTime']
        }
      },
      {
        name: 'get_customer_bookings',
        description: 'Retrieve all bookings for a specific customer',
        input_schema: {
          type: 'object',
          properties: {
            phoneNumber: { type: 'string', description: 'Customer phone number' },
            upcomingOnly: { type: 'boolean', description: 'Only return upcoming bookings' }
          },
          required: ['phoneNumber']
        }
      },
      {
        name: 'reschedule_booking',
        description: 'Reschedule an existing appointment to a new date and time',
        input_schema: {
          type: 'object',
          properties: {
            bookingId: { type: 'string', description: 'The booking ID to reschedule' },
            newDateTime: { type: 'string', description: 'New appointment date and time (ISO 8601 format)' }
          },
          required: ['bookingId', 'newDateTime']
        }
      }
    ];

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: system,
      messages: messages,
      tools: availableTools
    });

    res.json(response);
  } catch (error) {
    console.error('Error calling Claude:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'MCP Server is running' });
});

// Start server
const PORT = process.env.MCP_PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Salon Booking MCP Server running on port ${PORT}`);
  console.log(`📍 Endpoints:`);
  console.log(`   - POST /mcp/claude (Main Claude endpoint)`);
  console.log(`   - POST /tools/check_calendar`);
  console.log(`   - POST /tools/create_booking`);
  console.log(`   - POST /tools/get_customer_bookings`);
  console.log(`   - POST /tools/cancel_booking`);
  console.log(`   - POST /tools/reschedule_booking`);
  console.log(`   - GET /health`);
});

module.exports = app;