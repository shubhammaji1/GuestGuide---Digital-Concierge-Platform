import express from 'express';
import { pool } from '../db/connection.js';
import { AppError } from '../middleware/errorHandler.js';
import { chatRateLimiter } from '../middleware/rateLimiter.js';
import { getAIResponse } from '../services/aiService.js';
import { trackAnalyticsEvent } from '../services/analytics.js';

const router = express.Router();

// Chat endpoint (public, uses session)
router.post('/message', chatRateLimiter, async (req, res, next) => {
  try {
    const { hotelId, question, language = 'en', sessionId } = req.body;

    if (!hotelId || !question) {
      throw new AppError('Hotel ID and question are required', 400);
    }

    // Verify hotel exists and is active
    const hotelResult = await pool.query(
      'SELECT id, name FROM hotels WHERE id = $1 AND is_active = true',
      [hotelId]
    );

    if (hotelResult.rows.length === 0) {
      throw new AppError('Hotel not found', 404);
    }

    // Get AI response
    const aiResponse = await getAIResponse(hotelId, question, language);

    // Log chat interaction
    const sessionIdToUse = sessionId || req.sessionID || `guest-${Date.now()}`;
    
    await pool.query(
      `INSERT INTO chat_logs (hotel_id, session_id, question, answer, ai_confidence, was_ai_response, escalated_to_staff, language)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        hotelId,
        sessionIdToUse,
        question,
        aiResponse.answer,
        aiResponse.confidence,
        aiResponse.wasAIResponse,
        aiResponse.escalated,
        language
      ]
    );

    // Track analytics
    await trackAnalyticsEvent(hotelId, 'chat_message', {
      session_id: sessionIdToUse,
      question_length: question.length,
      ai_confidence: aiResponse.confidence,
      was_ai_response: aiResponse.wasAIResponse,
      escalated: aiResponse.escalated
    });

    res.json({
      success: true,
      answer: aiResponse.answer,
      confidence: aiResponse.confidence,
      escalated: aiResponse.escalated,
      sessionId: sessionIdToUse
    });
  } catch (error) {
    next(error);
  }
});

// Get chat history (for session)
router.get('/history/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { hotelId } = req.query;

    if (!hotelId) {
      throw new AppError('Hotel ID is required', 400);
    }

    const result = await pool.query(
      `SELECT id, question, answer, ai_confidence, was_ai_response, escalated_to_staff, created_at
       FROM chat_logs
       WHERE session_id = $1 AND hotel_id = $2
       ORDER BY created_at ASC
       LIMIT 50`,
      [sessionId, hotelId]
    );

    res.json({
      success: true,
      history: result.rows
    });
  } catch (error) {
    next(error);
  }
});

export default router;

