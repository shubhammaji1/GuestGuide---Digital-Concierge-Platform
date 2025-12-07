import express from 'express';
import { pool } from '../db/connection.js';
import { AppError } from '../middleware/errorHandler.js';
import { trackAnalyticsEvent } from '../services/analytics.js';

const router = express.Router();

// Get hotel guide sections (public)
router.get('/guide/:hotelId', async (req, res, next) => {
  try {
    const { hotelId } = req.params;

    const result = await pool.query(
      `SELECT id, title, icon, content, order_index, section_type
       FROM guide_sections
       WHERE hotel_id = $1 AND is_enabled = true
       ORDER BY order_index ASC`,
      [hotelId]
    );

    // Track view
    await trackAnalyticsEvent(parseInt(hotelId), 'guide_viewed', {
      section_count: result.rows.length
    });

    res.json({
      success: true,
      sections: result.rows
    });
  } catch (error) {
    next(error);
  }
});

// Get hotel info for guest (public)
router.get('/hotel/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;

    const result = await pool.query(
      `SELECT id, name, slug, description, address, phone, email, website,
              logo_url, primary_color, secondary_color, wifi_ssid,
              check_in_time, check_out_time, breakfast_time_start, breakfast_time_end,
              emergency_contact
       FROM hotels
       WHERE slug = $1 AND is_active = true`,
      [slug]
    );

    if (result.rows.length === 0) {
      throw new AppError('Hotel not found', 404);
    }

    const hotel = result.rows[0];
    // Don't expose wifi password in public endpoint

    // Track view
    await trackAnalyticsEvent(hotel.id, 'hotel_page_viewed', {
      slug
    });

    res.json({
      success: true,
      hotel
    });
  } catch (error) {
    next(error);
  }
});

export default router;

