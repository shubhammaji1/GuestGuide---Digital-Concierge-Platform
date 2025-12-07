import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';
import { pool } from '../db/connection.js';

export interface AuthRequest extends Request {
  userId?: number;
  hotelId?: number;
  userRole?: string;
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      userId: number;
      hotelId: number;
      role: string;
    };

    // Verify user still exists and is active
    const result = await pool.query(
      'SELECT id, hotel_id, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      throw new AppError('User not found or inactive', 401);
    }

    const user = result.rows[0];

    req.userId = decoded.userId;
    // Use hotel_id from database (more reliable than JWT)
    req.hotelId = user.hotel_id || decoded.hotelId || null;
    req.userRole = user.role || decoded.role;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else {
      next(error);
    }
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
}

export function requireHotelAccess(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  // Super admin can access any hotel
  if (req.userRole === 'super_admin') {
    return next();
  }

  // Staff/admin can only access their own hotel
  const requestedHotelId = parseInt(req.params.hotelId || req.body.hotelId || '0');
  
  if (requestedHotelId && req.hotelId !== requestedHotelId) {
    return next(new AppError('Access denied to this hotel', 403));
  }

  next();
}

