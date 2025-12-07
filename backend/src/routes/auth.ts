import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/connection.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Register (for hotel admins)
router.post('/register', authRateLimiter, async (req, res, next) => {
  try {
    const { email, password, name, hotelId, role = 'staff' } = req.body;

    if (!email || !password || !name) {
      throw new AppError('Email, password, and name are required', 400);
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError('User already exists', 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, hotel_id, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, role, hotel_id, created_at`,
      [email, passwordHash, name, hotelId || null, role]
    );

    const user = result.rows[0];

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hotelId: user.hotel_id
      }
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', authRateLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    // Find user
    const result = await pool.query(
      `SELECT u.id, u.email, u.password_hash, u.name, u.role, u.hotel_id, u.is_active,
              h.name as hotel_name, h.slug as hotel_slug
       FROM users u
       LEFT JOIN hotels h ON u.hotel_id = h.id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid credentials', 401);
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new AppError('Account is inactive', 403);
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        hotelId: user.hotel_id,
        role: user.role
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hotelId: user.hotel_id,
        hotelName: user.hotel_name,
        hotelSlug: user.hotel_slug
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.role, u.hotel_id,
              h.name as hotel_name, h.slug as hotel_slug
       FROM users u
       LEFT JOIN hotels h ON u.hotel_id = h.id
       WHERE u.id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      user: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        name: result.rows[0].name,
        role: result.rows[0].role,
        hotelId: result.rows[0].hotel_id,
        hotelName: result.rows[0].hotel_name,
        hotelSlug: result.rows[0].hotel_slug
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

