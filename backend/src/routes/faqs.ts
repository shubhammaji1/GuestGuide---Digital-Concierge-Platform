import express from 'express';
import { pool } from '../db/connection.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get FAQs for a hotel (public)
router.get('/hotel/:hotelId', async (req, res, next) => {
  try {
    const { hotelId } = req.params;

    const result = await pool.query(
      `SELECT id, question, answer, category, order_index
       FROM faqs
       WHERE hotel_id = $1 AND is_active = true
       ORDER BY order_index ASC, created_at ASC`,
      [hotelId]
    );

    res.json({
      success: true,
      faqs: result.rows
    });
  } catch (error) {
    next(error);
  }
});

// Get all FAQs (authenticated)
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    let query = 'SELECT * FROM faqs WHERE 1=1';
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

    query += ' ORDER BY order_index ASC, created_at ASC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      faqs: result.rows
    });
  } catch (error) {
    next(error);
  }
});

// Create FAQ
router.post('/', authenticate, requireRole('admin', 'staff', 'super_admin'), async (req: AuthRequest, res, next) => {
  try {
    const { question, answer, category, order_index, hotelId } = req.body;

    if (!question || !answer) {
      throw new AppError('Question and answer are required', 400);
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
      `INSERT INTO faqs (hotel_id, question, answer, category, order_index)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [targetHotelId, question, answer, category || null, order_index || 0]
    );

    res.status(201).json({
      success: true,
      faq: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Update FAQ
router.put('/:id', authenticate, requireRole('admin', 'staff', 'super_admin'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { question, answer, category, order_index, is_active } = req.body;

    // Get existing FAQ to check access
    const existing = await pool.query('SELECT hotel_id FROM faqs WHERE id = $1', [id]);

    if (existing.rows.length === 0) {
      throw new AppError('FAQ not found', 404);
    }

    if (req.userRole !== 'super_admin' && req.hotelId !== existing.rows[0].hotel_id) {
      throw new AppError('Access denied', 403);
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (question !== undefined) {
      updates.push(`question = $${paramCount}`);
      values.push(question);
      paramCount++;
    }
    if (answer !== undefined) {
      updates.push(`answer = $${paramCount}`);
      values.push(answer);
      paramCount++;
    }
    if (category !== undefined) {
      updates.push(`category = $${paramCount}`);
      values.push(category);
      paramCount++;
    }
    if (order_index !== undefined) {
      updates.push(`order_index = $${paramCount}`);
      values.push(order_index);
      paramCount++;
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE faqs
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      faq: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Delete FAQ
router.delete('/:id', authenticate, requireRole('admin', 'super_admin'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    // Get existing FAQ to check access
    const existing = await pool.query('SELECT hotel_id FROM faqs WHERE id = $1', [id]);

    if (existing.rows.length === 0) {
      throw new AppError('FAQ not found', 404);
    }

    if (req.userRole !== 'super_admin' && req.hotelId !== existing.rows[0].hotel_id) {
      throw new AppError('Access denied', 403);
    }

    await pool.query('DELETE FROM faqs WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'FAQ deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

