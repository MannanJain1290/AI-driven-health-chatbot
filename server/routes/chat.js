import express from 'express';
import { answerQuery } from '../services/ragService.js';
import { detectLanguage, translateToEnglish, translateFromEnglish } from '../services/translationService.js';

const router = express.Router();

/**
 * POST /api/chat
 * Body: { query: string, chatHistory: [{role, content}] }
 * Returns: { answer, sources, isEmergency, disclaimer, detectedLang }
 */
router.post('/', async (req, res) => {
  try {
    const { query, chatHistory = [] } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Detect language and translate to English if needed
    const detectedLang = detectLanguage(query.trim());
    let englishQuery = query.trim();

    if (detectedLang !== 'en') {
      englishQuery = await translateToEnglish(query.trim(), detectedLang);
    }

    // Run RAG pipeline
    const result = await answerQuery(englishQuery, chatHistory);

    // Translate answer back if needed
    let answer = result.answer;
    if (detectedLang !== 'en') {
      answer = await translateFromEnglish(answer, detectedLang);
    }

    res.json({
      answer,
      sources: result.sources,
      isEmergency: result.isEmergency,
      disclaimer: result.disclaimer,
      detectedLang,
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process query', details: error.message });
  }
});

export default router;
