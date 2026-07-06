import express from 'express';
import { db } from '../config/db.js';

const router = express.Router();

/**
 * POST /api/feedback
 * Body: { query, answer, rating (0|1), comment? }
 */
router.post('/', async (req, res) => {
  try {
    const { query, answer, rating, comment = '' } = req.body;
    if (!query || !answer || rating === undefined) {
      return res.status(400).json({ error: 'query, answer, and rating are required' });
    }
    await db.addFeedback({ query, answer, rating, comment });
    res.json({ success: true });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

/**
 * GET /api/feedback/stats
 * Returns: { total, positive, negative }
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await db.getFeedbackStats();
    res.json(stats);
  } catch (error) {
    console.error('Feedback stats error:', error);
    res.status(500).json({ error: 'Failed to get feedback stats' });
  }
});

export default router;
