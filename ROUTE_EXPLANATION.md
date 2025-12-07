# Route Explanation: `/hotel/:slug`

## Purpose

The route `<Route path="/hotel/:slug" element={<GuestApp />} />` serves as the **public guest access point** for hotels.

### How It Works:

1. **URL Parameter (`:slug`)**: 
   - The `:slug` is a dynamic URL parameter
   - Example: `/hotel/demo` → `slug = "demo"`
   - Example: `/hotel/grand-hotel` → `slug = "grand-hotel"`

2. **Guest Access**:
   - **No login required** - anyone can access
   - Perfect for QR codes placed in hotel rooms
   - Each hotel gets a unique URL based on their slug

3. **What It Does**:
   - Loads hotel information from the database using the slug
   - Displays the hotel's digital concierge interface
   - Shows hotel branding, WiFi info, chat, and guide sections

## How to Test It

### Method 1: Direct URL Access

1. **Start your frontend server** (if not running):
   ```bash
   cd frontend
   npm run dev
   ```

2. **Open your browser** and navigate to:
   ```
   http://localhost:5173/hotel/demo
   ```

3. **Expected Result**:
   - ✅ Should show "Demo Hotel" header
   - ✅ Should display chat interface
   - ✅ Should show guide sections
   - ✅ No login required

### Method 2: Test Different Slugs

If you have multiple hotels in your database:

```
http://localhost:5173/hotel/demo          → Demo Hotel
http://localhost:5173/hotel/grand-hotel   → Grand Hotel (if exists)
http://localhost:5173/hotel/beach-resort  → Beach Resort (if exists)
```

### Method 3: Check Browser Console

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Navigate to `/hotel/demo`
4. Check for:
   - ✅ No errors
   - ✅ API call to `/api/guest/hotel/demo` succeeds
   - ✅ Hotel data loads

### Method 4: Network Tab

1. Open DevTools → **Network** tab
2. Navigate to `/hotel/demo`
3. Look for:
   - ✅ `GET /api/guest/hotel/demo` → Status 200
   - ✅ Response contains hotel data

## Troubleshooting

### ❌ "Hotel not found" Error

**Cause**: Hotel with that slug doesn't exist in database

**Fix**: 
- Check if hotel exists: Run seed script `npm run seed` in backend
- Verify slug in database matches URL

### ❌ 404 Not Found

**Cause**: Route not matching

**Fix**:
- Check URL spelling: `/hotel/demo` (not `/hotels/demo`)
- Ensure frontend server is running
- Check React Router is configured correctly

### ❌ Blank Page / Loading Forever

**Cause**: API call failing

**Fix**:
- Check backend is running on port 3001
- Check API URL in browser console
- Verify CORS is configured correctly

## Real-World Usage

### QR Code Implementation:

1. **Hotel creates account** → Gets unique slug (e.g., "grand-hotel")
2. **Hotel prints QR code** with URL: `https://yourdomain.com/hotel/grand-hotel`
3. **Guest scans QR code** → Opens guest app for that specific hotel
4. **Guest uses chat/guide** → All data is hotel-specific

### Example URLs:

```
Production:
https://guestguide.com/hotel/demo
https://guestguide.com/hotel/marriott-downtown
https://guestguide.com/hotel/hilton-beach-resort

Development:
http://localhost:5173/hotel/demo
```

## Code Flow

```
1. User visits: /hotel/demo
   ↓
2. React Router matches route: /hotel/:slug
   ↓
3. Renders: <GuestApp />
   ↓
4. GuestApp extracts: slug = "demo"
   ↓
5. Makes API call: GET /api/guest/hotel/demo
   ↓
6. Backend returns: Hotel data for "demo"
   ↓
7. GuestApp displays: Hotel-specific UI
```

## Related Routes

- `/` → Also renders GuestApp (defaults to "demo" hotel)
- `/admin/login` → Admin authentication
- `/admin/*` → Admin dashboard (protected)

