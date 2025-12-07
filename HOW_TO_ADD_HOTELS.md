# How to Add Hotels to GuestGuide

## Understanding the Route

The route `/hotel/:slug` works correctly, but it requires hotels to be **registered in the database first**.

- ✅ Route works: `/hotel/demo` → Shows Demo Hotel (exists in DB)
- ❌ Route works but hotel missing: `/hotel/Taj` → Error (Taj not in DB)

## Method 1: Add Hotel via Admin Dashboard (Recommended)

1. **Login to Admin Dashboard**:
   - Go to: `http://localhost:5173/admin/login`
   - Email: `admin@demohotel.com`
   - Password: `admin123`

2. **Go to Settings**:
   - Click "Settings" in the sidebar
   - You can update the existing hotel or create a new one

3. **Note**: Currently, the admin dashboard only allows editing the logged-in user's hotel. To add multiple hotels, use Method 2 or 3.

## Method 2: Add Hotel via Database (SQL)

1. **Connect to your Supabase database**

2. **Run this SQL**:
```sql
INSERT INTO hotels (
  name, slug, description, address, phone, email, website,
  primary_color, secondary_color, wifi_ssid, wifi_password,
  check_in_time, check_out_time, breakfast_time_start, breakfast_time_end,
  emergency_contact, is_active
)
VALUES (
  'Taj Hotel',
  'taj',  -- This is the slug used in URL: /hotel/taj
  'Luxury hotel in the heart of the city',
  '123 Taj Street, Mumbai, India',
  '+91 22 1234 5678',
  'info@tajhotel.com',
  'https://tajhotels.com',
  '#8B4513',  -- Brown color
  '#654321',  -- Dark brown
  'TajHotel-WiFi',
  'tajwifi2024',
  '14:00',
  '12:00',
  '07:00',
  '11:00',
  '+91 22 1234 5678',
  true
)
RETURNING id;
```

3. **Create an admin user for this hotel**:
```sql
-- Get the hotel ID from the previous query
INSERT INTO users (email, password_hash, name, hotel_id, role)
VALUES (
  'admin@tajhotel.com',
  '$2a$10$YourHashedPasswordHere',  -- Hash 'admin123' with bcrypt
  'Taj Admin',
  (SELECT id FROM hotels WHERE slug = 'taj'),
  'admin'
);
```

4. **Now access**: `http://localhost:5173/hotel/taj`

## Method 3: Update Seed Script

1. **Edit**: `backend/src/db/seed.ts`

2. **Add Taj Hotel**:
```typescript
// After creating demo hotel, add:
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

const tajHotelId = tajResult.rows[0]?.id || (await pool.query('SELECT id FROM hotels WHERE slug = $1', ['taj'])).rows[0].id;

// Create admin for Taj
const tajPasswordHash = await bcrypt.hash('admin123', 10);
await pool.query(
  `INSERT INTO users (email, password_hash, name, hotel_id, role)
   VALUES ($1, $2, $3, $4, $5)
   ON CONFLICT (email) DO NOTHING`,
  ['admin@tajhotel.com', tajPasswordHash, 'Taj Admin', tajHotelId, 'admin']
);
```

3. **Run seed again**:
```bash
cd backend
npm run seed
```

## Method 4: Create Hotel via API (Programmatic)

You can create hotels via API if you have super_admin access:

```bash
curl -X POST http://localhost:3001/api/hotels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -d '{
    "name": "Taj Hotel",
    "slug": "taj",
    "description": "Luxury hotel",
    "address": "123 Taj Street, Mumbai",
    "phone": "+91 22 1234 5678",
    "email": "info@tajhotel.com",
    "wifi_ssid": "TajHotel-WiFi",
    "wifi_password": "tajwifi2024",
    "check_in_time": "14:00",
    "check_out_time": "12:00"
  }'
```

## Testing After Adding Hotel

1. **Access the hotel**:
   ```
   http://localhost:5173/hotel/taj
   ```

2. **Should see**:
   - ✅ Taj Hotel header
   - ✅ Hotel-specific information
   - ✅ Chat interface
   - ✅ Guide sections

## Current Hotels in Database

To check which hotels exist:

```sql
SELECT id, name, slug, is_active FROM hotels;
```

Or check via API (if authenticated):
```
GET http://localhost:3001/api/hotels
```

## Important Notes

1. **Slug must be unique**: Each hotel needs a unique slug
2. **Slug format**: Use lowercase, hyphens for spaces (e.g., `taj-hotel`, `grand-hotel`)
3. **Active status**: Set `is_active = true` for hotels to be accessible
4. **URL format**: `/hotel/{slug}` where slug matches database

## Quick Test

After adding Taj hotel:
- ✅ `http://localhost:5173/hotel/taj` → Should work
- ✅ `http://localhost:5173/hotel/demo` → Should still work
- ❌ `http://localhost:5173/hotel/nonexistent` → Will show error (expected)

