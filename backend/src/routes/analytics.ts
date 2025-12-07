import express from 'express';
import { pool } from '../db/connection.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get analytics dashboard data
router.get('/dashboard', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { hotelId, startDate, endDate } = req.query;
    const targetHotelId = hotelId ? parseInt(hotelId as string) : req.hotelId;

    if (!targetHotelId) {
      throw new AppError('Hotel ID is required', 400);
    }

    // Check access
    if (req.userRole !== 'super_admin' && req.hotelId !== targetHotelId) {
      throw new AppError('Access denied', 403);
    }

    const dateFilter = startDate && endDate
      ? `AND created_at BETWEEN $2 AND $3`
      : '';

    const params: any[] = [targetHotelId];
    if (startDate && endDate) {
      params.push(startDate, endDate);
    }

    // Total chat messages
    const chatCountResult = await pool.query(
      `SELECT COUNT(*) as total FROM chat_logs WHERE hotel_id = $1 ${dateFilter}`,
      params
    );

    // AI resolution rate
    const aiResolutionResult = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE was_ai_response = true AND escalated_to_staff = false) as resolved,
        COUNT(*) as total
       FROM chat_logs 
       WHERE hotel_id = $1 ${dateFilter}`,
      params
    );

    // Top questions
    const topQuestionsResult = await pool.query(
      `SELECT question, COUNT(*) as count
       FROM chat_logs
       WHERE hotel_id = $1 ${dateFilter}
       GROUP BY question
       ORDER BY count DESC
       LIMIT 10`,
      params
    );

    // Average confidence
    const avgConfidenceResult = await pool.query(
      `SELECT AVG(ai_confidence) as avg_confidence
       FROM chat_logs
       WHERE hotel_id = $1 AND was_ai_response = true ${dateFilter}`,
      params
    );

    // Escalation rate
    const escalationResult = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE escalated_to_staff = true) as escalated,
        COUNT(*) as total
       FROM chat_logs
       WHERE hotel_id = $1 ${dateFilter}`,
      params
    );

    // Daily activity
    const dailyActivityResult = await pool.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
       FROM chat_logs
       WHERE hotel_id = $1 ${dateFilter}
       GROUP BY DATE(created_at)
       ORDER BY date DESC
       LIMIT 30`,
      params
    );

    const total = chatCountResult.rows[0]?.total || 0;
    const resolved = aiResolutionResult.rows[0]?.resolved || 0;
    const aiTotal = aiResolutionResult.rows[0]?.total || 0;
    const escalated = escalationResult.rows[0]?.escalated || 0;
    const escalationTotal = escalationResult.rows[0]?.total || 0;

    res.json({
      success: true,
      analytics: {
        totalChatMessages: parseInt(total),
        aiResolutionRate: aiTotal > 0 ? (resolved / aiTotal) * 100 : 0,
        averageConfidence: parseFloat(avgConfidenceResult.rows[0]?.avg_confidence || '0'),
        escalationRate: escalationTotal > 0 ? (escalated / escalationTotal) * 100 : 0,
        topQuestions: topQuestionsResult.rows,
        dailyActivity: dailyActivityResult.rows,
        estimatedHoursSaved: Math.round((resolved * 0.1) / 60) // Assuming 6 minutes saved per resolved query
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get chat logs
router.get('/chat-logs', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { hotelId, limit = '50', offset = '0' } = req.query;
    const targetHotelId = hotelId ? parseInt(hotelId as string) : req.hotelId;

    if (!targetHotelId) {
      throw new AppError('Hotel ID is required', 400);
    }

    // Check access
    if (req.userRole !== 'super_admin' && req.hotelId !== targetHotelId) {
      throw new AppError('Access denied', 403);
    }

    const result = await pool.query(
      `SELECT id, session_id, question, answer, ai_confidence, was_ai_response, escalated_to_staff, language, created_at
       FROM chat_logs
       WHERE hotel_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [targetHotelId, parseInt(limit as string), parseInt(offset as string)]
    );

    res.json({
      success: true,
      logs: result.rows
    });
  } catch (error) {
    next(error);
  }
});

export default router;

