import express from 'express';
import { pool } from '../db/connection.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get guide sections (authenticated)
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    let query = 'SELECT * FROM guide_sections WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (req.userRole !== 'super_admin') {
      query += ` AND hotel_id = $${paramCount}`;
      params.push(req.hotelId);
      paramCount++;
    } else if (req.query.hotelId) {
      query += ` AND hotel_id = $${paramCount}`;
      params.push(req.query.hotelId);
      paramCount++;
    }

    query += ' ORDER BY order_index ASC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      sections: result.rows
    });
  } catch (error) {
    next(error);
  }
});

// Create guide section
router.post('/', authenticate, requireRole('admin', 'staff', 'super_admin'), async (req: AuthRequest, res, next) => {
  try {
    const { title, icon, content, order_index, section_type, hotelId } = req.body;

    if (!title) {
      throw new AppError('Title is required', 400);
    }

    const targetHotelId = hotelId || req.hotelId;

    if (!targetHotelId) {
      throw new AppError('Hotel ID is required', 400);
    }

    // Check access
    if (req.userRole !== 'super_admin' && req.hotelId !== targetHotelId) {
      throw new AppError('Access denied', 403);
    }

    const result = await pool.query(
      `INSERT INTO guide_sections (hotel_id, title, icon, content, order_index, section_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [targetHotelId, title, icon || null, content || null, order_index || 0, section_type || 'custom']
    );

    res.status(201).json({
      success: true,
      section: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Update guide section
router.put('/:id', authenticate, requireRole('admin', 'staff', 'super_admin'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { title, icon, content, order_index, is_enabled } = req.body;

    // Get existing section to check access
    const existing = await pool.query('SELECT hotel_id FROM guide_sections WHERE id = $1', [id]);

    if (existing.rows.length === 0) {
      throw new AppError('Section not found', 404);
    }

    if (req.userRole !== 'super_admin' && req.hotelId !== existing.rows[0].hotel_id) {
      throw new AppError('Access denied', 403);
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount}`);
      values.push(title);
      paramCount++;
    }
    if (icon !== undefined) {
      updates.push(`icon = $${paramCount}`);
      values.push(icon);
      paramCount++;
    }
    if (content !== undefined) {
      updates.push(`content = $${paramCount}`);
      values.push(content);
      paramCount++;
    }
    if (order_index !== undefined) {
      updates.push(`order_index = $${paramCount}`);
      values.push(order_index);
      paramCount++;
    }
    if (is_enabled !== undefined) {
      updates.push(`is_enabled = $${paramCount}`);
      values.push(is_enabled);
      paramCount++;
    }

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE guide_sections
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      section: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Delete guide section
router.delete('/:id', authenticate, requireRole('admin', 'super_admin'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    // Get existing section to check access
    const existing = await pool.query('SELECT hotel_id FROM guide_sections WHERE id = $1', [id]);

    if (existing.rows.length === 0) {
      throw new AppError('Section not found', 404);
    }

    if (req.userRole !== 'super_admin' && req.hotelId !== existing.rows[0].hotel_id) {
      throw new AppError('Access denied', 403);
    }

    await pool.query('DELETE FROM guide_sections WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Section deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

