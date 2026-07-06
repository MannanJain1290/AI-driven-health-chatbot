import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/db.js';

// Route imports
import chatRoutes from './routes/chat.js';
import feedbackRoutes from './routes/feedback.js';
import symptomRoutes from './routes/symptoms.js';
import pdfRoutes from './routes/pdf.js';
import exportRoutes from './routes/export.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/chat', chatRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/symptoms', symptomRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/export', exportRoutes);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// ─── Start Server ────────────────────────────────────────────────────────────
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\n🩺 Health Chatbot API running on http://localhost:${PORT}`);
    console.log(`   GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`   MongoDB: ${process.env.MONGODB_URI || 'localhost:27017'}\n`);
  });
}

start().catch((err) => {
  console.error('❌ Server startup failed:', err);
  process.exit(1);
});
