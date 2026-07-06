import express from 'express';
import multer from 'multer';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import { db } from '../config/db.js';
import { generateEmbeddings } from '../services/geminiService.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

/**
 * POST /api/pdf/upload
 * Accepts a PDF file, extracts text, chunks it, embeds and stores in the DB.
 */
router.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const filename = req.file.originalname || 'upload.pdf';

    // Parse PDF
    const data = await pdf(req.file.buffer);
    const fullText = data.text;

    if (!fullText || fullText.trim().length < 50) {
      return res.status(400).json({ error: 'PDF contains too little text' });
    }

    // Chunk text (~400 chars with 50-char overlap)
    const chunkSize = 400;
    const overlap = 50;
    const chunks = [];
    let start = 0;

    while (start < fullText.length) {
      const end = Math.min(start + chunkSize, fullText.length);
      const chunk = fullText.slice(start, end).trim();
      if (chunk.length > 30) {
        chunks.push(chunk);
      }
      start += chunkSize - overlap;
    }

    if (chunks.length === 0) {
      return res.status(400).json({ error: 'No valid text chunks extracted from PDF' });
    }

    // Generate embeddings in batches of 20
    const BATCH_SIZE = 20;
    const allEmbeddings = [];
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const batchEmbeddings = await generateEmbeddings(batch);
      allEmbeddings.push(...batchEmbeddings);
    }

    // Store in DB (MongoDB or fallback local JSON)
    const docs = chunks.map((text, i) => ({
      text,
      embedding: allEmbeddings[i],
      source: filename,
      chunkIndex: i,
    }));

    await db.addChunks(docs);

    res.json({ chunksAdded: chunks.length, filename });
  } catch (error) {
    console.error('PDF upload error:', error);
    res.status(500).json({ error: 'Failed to process PDF', details: error.message });
  }
});

export default router;
