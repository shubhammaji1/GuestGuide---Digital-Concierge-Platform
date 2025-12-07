import { pool } from './connection.js';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // Create demo hotel
    const hotelResult = await pool.query(
      `INSERT INTO hotels (
        name, slug, description, address, phone, email, website,
        primary_color, secondary_color, wifi_ssid, wifi_password,
        check_in_time, check_out_time, breakfast_time_start, breakfast_time_end,
        emergency_contact
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (slug) DO NOTHING
      RETURNING id`,
      [
        'Demo Hotel',
        'demo',
        'A beautiful hotel in the heart of the city',
        '123 Main Street, City, Country',
        '+1 234 567 8900',
        'info@demohotel.com',
        'https://demohotel.com',
        '#3B82F6',
        '#1E40AF',
        'DemoHotel-WiFi',
        'password123',
        '15:00',
        '11:00',
        '07:00',
        '10:00',
        '+1 234 567 8900'
      ]
    );

    const hotelId = hotelResult.rows[0]?.id || (await pool.query('SELECT id FROM hotels WHERE slug = $1', ['demo'])).rows[0].id;

    // Create admin user for demo hotel
    const passwordHash = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO users (email, password_hash, name, hotel_id, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING`,
      ['admin@demohotel.com', passwordHash, 'Admin User', hotelId, 'admin']
    );

    // Create Taj Hotel (example)
    const tajResult = await pool.query(
      `INSERT INTO hotels (
        name, slug, description, address, phone, email, website,
        primary_color, secondary_color, wifi_ssid, wifi_password,
        check_in_time, check_out_time, breakfast_time_start, breakfast_time_end,
        emergency_contact
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (slug) DO NOTHING
      RETURNING id`,
      [
        'Taj Hotel',
        'taj',
        'Luxury hotel in the heart of the city',
        '123 Taj Street, Mumbai, India',
        '+91 22 1234 5678',
        'info@tajhotel.com',
        'https://tajhotels.com',
        '#8B4513',
        '#654321',
        'TajHotel-WiFi',
        'tajwifi2024',
        '14:00',
        '12:00',
        '07:00',
        '11:00',
        '+91 22 1234 5678'
      ]
    );

    const tajHotelId = tajResult.rows[0]?.id || (await pool.query('SELECT id FROM hotels WHERE slug = $1', ['taj'])).rows[0]?.id;

    if (tajHotelId) {
      // Create admin user for Taj
      const tajPasswordHash = await bcrypt.hash('admin123', 10);
      await pool.query(
        `INSERT INTO users (email, password_hash, name, hotel_id, role)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO NOTHING`,
        ['admin@tajhotel.com', tajPasswordHash, 'Taj Admin', tajHotelId, 'admin']
      );
    }

    // Create sample FAQs
    const sampleFAQs = [
      {
        question: 'What is the WiFi password?',
        answer: 'The WiFi password is password123. The network name is DemoHotel-WiFi.',
        category: 'WiFi'
      },
      {
        question: 'What time is check-in?',
        answer: 'Check-in time is 3:00 PM. Early check-in may be available upon request.',
        category: 'Check-in'
      },
      {
        question: 'What time is check-out?',
        answer: 'Check-out time is 11:00 AM. Late check-out may be available upon request.',
        category: 'Check-out'
      },
      {
        question: 'What time is breakfast served?',
        answer: 'Breakfast is served from 7:00 AM to 10:00 AM daily in the main dining room.',
        category: 'Dining'
      },
      {
        question: 'Is there parking available?',
        answer: 'Yes, we offer complimentary parking for all guests. The parking lot is located behind the hotel.',
        category: 'Services'
      }
    ];

    for (const faq of sampleFAQs) {
      await pool.query(
        `INSERT INTO faqs (hotel_id, question, answer, category, order_index)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [hotelId, faq.question, faq.answer, faq.category, sampleFAQs.indexOf(faq)]
      );
    }

    // Create sample guide sections
    const guideSections = [
      {
        title: 'WiFi Information',
        icon: 'wifi',
        content: 'Network: DemoHotel-WiFi\nPassword: password123\nFree WiFi is available throughout the hotel.',
        section_type: 'wifi',
        order_index: 0
      },
      {
        title: 'Check-in & Check-out',
        icon: 'clock',
        content: 'Check-in: 3:00 PM\nCheck-out: 11:00 AM\nEarly check-in and late check-out available upon request.',
        section_type: 'checkin',
        order_index: 1
      },
      {
        title: 'Dining',
        icon: 'breakfast',
        content: 'Breakfast: 7:00 AM - 10:00 AM\nRoom service available 24/7\nRestaurant hours: 6:00 AM - 11:00 PM',
        section_type: 'dining',
        order_index: 2
      },
      {
        title: 'Emergency Contact',
        icon: 'phone',
        content: 'Emergency: +1 234 567 8900\nFront Desk: +1 234 567 8901\nFor any emergencies, please contact the front desk immediately.',
        section_type: 'emergency',
        order_index: 3
      }
    ];

    for (const section of guideSections) {
      await pool.query(
        `INSERT INTO guide_sections (hotel_id, title, icon, content, section_type, order_index)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [hotelId, section.title, section.icon, section.content, section.section_type, section.order_index]
      );
    }

    console.log('✅ Database seeded successfully!');
    console.log('📧 Admin login: admin@demohotel.com / admin123');
    console.log('🏨 Hotel slug: demo');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();

