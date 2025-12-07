import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { pool } from '../db/connection.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.js';
import { processDocument } from '../services/documentProcessor.js';

const router = express.Router();

// Configure multer for file uploads
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.doc', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid file type. Only PDF, DOCX, DOC, and TXT are allowed.', 400));
    }
  }
});

// Get documents for a hotel
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    let query = 'SELECT * FROM documents WHERE 1=1';
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

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      documents: result.rows
    });
  } catch (error) {
    next(error);
  }
});

// Upload document
router.post('/', authenticate, requireRole('admin', 'staff', 'super_admin'), upload.single('file'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const { name } = req.body;
    // Use the authenticated user's hotelId (don't trust client-provided hotelId)
    const targetHotelId = req.hotelId;

    // Super admin can upload without hotel association, but regular users need a hotel
    if (req.userRole !== 'super_admin' && !targetHotelId) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      throw new AppError('Hotel ID is required. Your account is not associated with a hotel. Please contact support.', 400);
    }

    // Process document (extract text, create embeddings)
    const { contentText, embeddingId } = await processDocument(req.file.path, req.file.mimetype);

    // Save to database
    const result = await pool.query(
      `INSERT INTO documents (hotel_id, name, file_path, file_type, file_size, content_text, embedding_id, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        targetHotelId,
        name || req.file.originalname,
        req.file.path,
        req.file.mimetype,
        req.file.size,
        contentText,
        embeddingId,
        req.userId
      ]
    );

    res.status(201).json({
      success: true,
      document: result.rows[0]
    });
  } catch (error) {
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
});

// Delete document
router.delete('/:id', authenticate, requireRole('admin', 'super_admin'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    // Get existing document to check access and get file path
    const existing = await pool.query('SELECT hotel_id, file_path FROM documents WHERE id = $1', [id]);

    if (existing.rows.length === 0) {
      throw new AppError('Document not found', 404);
    }

    if (req.userRole !== 'super_admin' && req.hotelId !== existing.rows[0].hotel_id) {
      throw new AppError('Access denied', 403);
    }

    // Delete file
    if (fs.existsSync(existing.rows[0].file_path)) {
      fs.unlinkSync(existing.rows[0].file_path);
    }

    // Delete from database
    await pool.query('DELETE FROM documents WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

