import express from 'express';
import { db } from '../config/db.js';

const router = express.Router();

/**
 * POST /api/symptoms
 * Body: { symptom, sessionId, date }
 */
router.post('/', async (req, res) => {
  try {
    const { symptom, sessionId, date } = req.body;
    if (!symptom || !sessionId) {
      return res.status(400).json({ error: 'symptom and sessionId are required' });
    }
    const formattedDate = date || new Date().toLocaleString('en-GB', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    }).replace(',', '');

    const newSymptom = await db.addSymptom({
      symptom,
      sessionId,
      date: formattedDate,
    });
    res.json(newSymptom);
  } catch (error) {
    console.error('Symptom add error:', error);
    res.status(500).json({ error: 'Failed to add symptom' });
  }
});

/**
 * GET /api/symptoms/:sessionId
 */
router.get('/:sessionId', async (req, res) => {
  try {
    const symptoms = await db.getSymptoms(req.params.sessionId);
    res.json(symptoms);
  } catch (error) {
    console.error('Symptom fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch symptoms' });
  }
});

/**
 * DELETE /api/symptoms/:sessionId
 */
router.delete('/:sessionId', async (req, res) => {
  try {
    await db.clearSymptoms(req.params.sessionId);
    res.json({ success: true });
  } catch (error) {
    console.error('Symptom delete error:', error);
    res.status(500).json({ error: 'Failed to delete symptoms' });
  }
});

export default router;
