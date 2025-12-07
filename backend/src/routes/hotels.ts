import express from 'express';
import { pool } from '../db/connection.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get hotel by slug (public)
router.get('/slug/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;

    const result = await pool.query(
      `SELECT id, name, slug, description, address, phone, email, website,
              logo_url, primary_color, secondary_color, wifi_ssid, wifi_password,
              check_in_time, check_out_time, breakfast_time_start, breakfast_time_end,
              emergency_contact, is_active
       FROM hotels
       WHERE slug = $1 AND is_active = true`,
      [slug]
    );

    if (result.rows.length === 0) {
      throw new AppError('Hotel not found', 404);
    }

    const hotel = result.rows[0];
    // Don't expose wifi password in public endpoint
    delete hotel.wifi_password;

    res.json({
      success: true,
      hotel
    });
  } catch (error) {
    next(error);
  }
});

// Get hotel by ID (authenticated)
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    // Check access
    if (req.userRole !== 'super_admin' && req.hotelId !== parseInt(id)) {
      throw new AppError('Access denied', 403);
    }

    const result = await pool.query(
      'SELECT * FROM hotels WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Hotel not found', 404);
    }

    res.json({
      success: true,
      hotel: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Update hotel
router.put('/:id', authenticate, requireRole('admin', 'super_admin'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check access
    if (req.userRole !== 'super_admin' && req.hotelId !== parseInt(id)) {
      throw new AppError('Access denied', 403);
    }

    const allowedFields = [
      'name', 'description', 'address', 'phone', 'email', 'website',
      'logo_url', 'primary_color', 'secondary_color', 'wifi_ssid', 'wifi_password',
      'check_in_time', 'check_out_time', 'breakfast_time_start', 'breakfast_time_end',
      'emergency_contact', 'is_active'
    ];

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = $${paramCount}`);
        values.push(updates[field]);
        paramCount++;
      }
    }

    if (updateFields.length === 0) {
      throw new AppError('No valid fields to update', 400);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(parseInt(id));

    const query = `
      UPDATE hotels
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      hotel: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Create hotel (super admin only)
router.post('/', authenticate, requireRole('super_admin'), async (req, res, next) => {
  try {
    const {
      name, slug, description, address, phone, email, website,
      logo_url, primary_color, secondary_color, wifi_ssid, wifi_password,
      check_in_time, check_out_time, breakfast_time_start, breakfast_time_end,
      emergency_contact
    } = req.body;

    if (!name || !slug) {
      throw new AppError('Name and slug are required', 400);
    }

    const result = await pool.query(
      `INSERT INTO hotels (
        name, slug, description, address, phone, email, website,
        logo_url, primary_color, secondary_color, wifi_ssid, wifi_password,
        check_in_time, check_out_time, breakfast_time_start, breakfast_time_end,
        emergency_contact
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        name, slug, description, address, phone, email, website,
        logo_url, primary_color || '#3B82F6', secondary_color || '#1E40AF',
        wifi_ssid, wifi_password, check_in_time || '15:00', check_out_time || '11:00',
        breakfast_time_start || '07:00', breakfast_time_end || '10:00', emergency_contact
      ]
    );

    res.status(201).json({
      success: true,
      hotel: result.rows[0]
    });
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation
      next(new AppError('Hotel slug already exists', 409));
    } else {
      next(error);
    }
  }
});

export default router;

