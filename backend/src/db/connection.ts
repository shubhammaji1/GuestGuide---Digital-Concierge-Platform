import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Supabase requires SSL connections
const getPoolConfig = () => {
  // If DATABASE_URL is provided, use it (recommended for Supabase)
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false } // Supabase requires SSL
    };
  }
  
  // Otherwise use individual connection parameters
  return {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false } // Supabase requires SSL
  };
};

export const pool = new Pool(getPoolConfig());

// Test connection
pool.on('connect', () => {
  console.log('📊 Supabase database connected');
});

pool.on('error', (err: Error) => {
  console.error('❌ Database connection error:', err);
});

export async function initializeDatabase() {
  try {
    // Test connection
    await pool.query('SELECT NOW()');
    
    // Run migrations
    await runMigrations();
    
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Create migrations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get executed migrations
    const executed = await client.query('SELECT name FROM migrations');
    const executedNames = executed.rows.map((r: { name: string }) => r.name);
    
    // Run pending migrations
    const migrations = [
      createHotelsTable,
      createUsersTable,
      createFAQsTable,
      createDocumentsTable,
      createChatLogsTable,
      createAnalyticsEventsTable,
      createGuideSectionsTable
    ];
    
    for (const migration of migrations) {
      const migrationName = migration.name;
      if (!executedNames.includes(migrationName)) {
        console.log(`Running migration: ${migrationName}`);
        await migration(client);
        await client.query('INSERT INTO migrations (name) VALUES ($1)', [migrationName]);
      }
    }
    
    await client.query('COMMIT');
    console.log('✅ Migrations completed');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Migration functions
async function createHotelsTable(client: pg.PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS hotels (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      address TEXT,
      phone VARCHAR(50),
      email VARCHAR(255),
      website VARCHAR(255),
      logo_url VARCHAR(500),
      primary_color VARCHAR(7) DEFAULT '#3B82F6',
      secondary_color VARCHAR(7) DEFAULT '#1E40AF',
      wifi_ssid VARCHAR(255),
      wifi_password VARCHAR(255),
      check_in_time TIME DEFAULT '15:00',
      check_out_time TIME DEFAULT '11:00',
      breakfast_time_start TIME DEFAULT '07:00',
      breakfast_time_end TIME DEFAULT '10:00',
      emergency_contact VARCHAR(255),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_hotels_slug ON hotels(slug);
    CREATE INDEX IF NOT EXISTS idx_hotels_active ON hotels(is_active);
  `);
}

async function createUsersTable(client: pg.PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'staff' CHECK (role IN ('admin', 'staff', 'super_admin')),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_hotel ON users(hotel_id);
  `);
}

async function createFAQsTable(client: pg.PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS faqs (
      id SERIAL PRIMARY KEY,
      hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      category VARCHAR(100),
      order_index INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_faqs_hotel ON faqs(hotel_id);
    CREATE INDEX IF NOT EXISTS idx_faqs_active ON faqs(is_active);
  `);
}

async function createDocumentsTable(client: pg.PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id SERIAL PRIMARY KEY,
      hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_type VARCHAR(50),
      file_size INTEGER,
      content_text TEXT,
      embedding_id VARCHAR(255),
      is_active BOOLEAN DEFAULT true,
      uploaded_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_documents_hotel ON documents(hotel_id);
    CREATE INDEX IF NOT EXISTS idx_documents_active ON documents(is_active);
  `);
}

async function createChatLogsTable(client: pg.PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS chat_logs (
      id SERIAL PRIMARY KEY,
      hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
      session_id VARCHAR(255),
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      ai_confidence DECIMAL(3,2),
      was_ai_response BOOLEAN DEFAULT true,
      escalated_to_staff BOOLEAN DEFAULT false,
      language VARCHAR(10) DEFAULT 'en',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_chat_logs_hotel ON chat_logs(hotel_id);
    CREATE INDEX IF NOT EXISTS idx_chat_logs_session ON chat_logs(session_id);
    CREATE INDEX IF NOT EXISTS idx_chat_logs_created ON chat_logs(created_at);
  `);
}

async function createAnalyticsEventsTable(client: pg.PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id SERIAL PRIMARY KEY,
      hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
      event_type VARCHAR(100) NOT NULL,
      event_data JSONB,
      session_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_analytics_hotel ON analytics_events(hotel_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);
  `);
}

async function createGuideSectionsTable(client: pg.PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS guide_sections (
      id SERIAL PRIMARY KEY,
      hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      icon VARCHAR(50),
      content TEXT,
      order_index INTEGER DEFAULT 0,
      is_enabled BOOLEAN DEFAULT true,
      section_type VARCHAR(50) DEFAULT 'custom',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_guide_sections_hotel ON guide_sections(hotel_id);
    CREATE INDEX IF NOT EXISTS idx_guide_sections_order ON guide_sections(hotel_id, order_index);
  `);
}

