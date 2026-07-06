import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

// ─── JSON File Paths ─────────────────────────────────────────────────────────
const DB_DIR = path.join(process.cwd(), 'local_db');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const CHUNKS_FILE = path.join(DB_DIR, 'chunks.json');
const FEEDBACK_FILE = path.join(DB_DIR, 'feedback.json');
const SYMPTOMS_FILE = path.join(DB_DIR, 'symptoms.json');

// Initialize JSON files
if (!fs.existsSync(CHUNKS_FILE)) fs.writeFileSync(CHUNKS_FILE, '[]');
if (!fs.existsSync(FEEDBACK_FILE)) fs.writeFileSync(FEEDBACK_FILE, '[]');
if (!fs.existsSync(SYMPTOMS_FILE)) fs.writeFileSync(SYMPTOMS_FILE, '[]');

let useMongo = false;

// ─── MongoDB Models ──────────────────────────────────────────────────────────
const knowledgeChunkSchema = new mongoose.Schema({
  text: String,
  embedding: [Number],
  source: String,
  chunkIndex: Number,
}, { timestamps: true });

const feedbackSchema = new mongoose.Schema({
  query: String,
  answer: String,
  rating: { type: Number, enum: [0, 1] },
  comment: String,
}, { timestamps: true });

const symptomSchema = new mongoose.Schema({
  symptom: String,
  sessionId: String,
  date: String,
}, { timestamps: true });

let KnowledgeChunkModel, FeedbackModel, SymptomModel;

try {
  KnowledgeChunkModel = mongoose.model('KnowledgeChunk', knowledgeChunkSchema);
  FeedbackModel = mongoose.model('Feedback', feedbackSchema);
  SymptomModel = mongoose.model('Symptom', symptomSchema);
} catch {
  KnowledgeChunkModel = mongoose.model('KnowledgeChunk');
  FeedbackModel = mongoose.model('Feedback');
  SymptomModel = mongoose.model('Symptom');
}

// ─── Connection Function ──────────────────────────────────────────────────────
const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthchatbot';
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log('✅ MongoDB connected successfully');
    useMongo = true;
  } catch (error) {
    console.warn(`⚠️ MongoDB connection failed (${error.message}).`);
    console.warn(`ℹ️ Falling back to JSON database files in: ${DB_DIR}`);
    useMongo = false;
  }
};

// Helper to read/write JSON files safely
function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return [];
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

// ─── Database Operations API ──────────────────────────────────────────────────

export const db = {
  // Knowledge Chunks
  clearChunks: async () => {
    if (useMongo) {
      await KnowledgeChunkModel.deleteMany({});
    } else {
      writeJSON(CHUNKS_FILE, []);
    }
  },

  addChunks: async (chunks) => {
    if (useMongo) {
      await KnowledgeChunkModel.insertMany(chunks);
    } else {
      const dbChunks = readJSON(CHUNKS_FILE);
      const newChunks = chunks.map((c, i) => ({
        _id: `chunk_${Date.now()}_${i}`,
        ...c,
        createdAt: new Date().toISOString(),
      }));
      writeJSON(CHUNKS_FILE, [...dbChunks, ...newChunks]);
    }
  },

  getAllChunks: async () => {
    if (useMongo) {
      return await KnowledgeChunkModel.find({}).lean();
    } else {
      return readJSON(CHUNKS_FILE);
    }
  },

  // Feedback
  addFeedback: async (feedback) => {
    if (useMongo) {
      await FeedbackModel.create(feedback);
    } else {
      const dbFeedback = readJSON(FEEDBACK_FILE);
      const newFeedback = {
        _id: `feedback_${Date.now()}`,
        ...feedback,
        createdAt: new Date().toISOString(),
      };
      dbFeedback.push(newFeedback);
      writeJSON(FEEDBACK_FILE, dbFeedback);
    }
  },

  getFeedbackStats: async () => {
    if (useMongo) {
      const total = await FeedbackModel.countDocuments();
      const positive = await FeedbackModel.countDocuments({ rating: 1 });
      return { total, positive, negative: total - positive };
    } else {
      const dbFeedback = readJSON(FEEDBACK_FILE);
      const total = dbFeedback.length;
      const positive = dbFeedback.filter((f) => f.rating === 1).length;
      return { total, positive, negative: total - positive };
    }
  },

  // Symptoms
  addSymptom: async (symptomData) => {
    if (useMongo) {
      return await SymptomModel.create(symptomData);
    } else {
      const dbSymptoms = readJSON(SYMPTOMS_FILE);
      const newSymptom = {
        _id: `symptom_${Date.now()}`,
        ...symptomData,
        createdAt: new Date().toISOString(),
      };
      dbSymptoms.push(newSymptom);
      writeJSON(SYMPTOMS_FILE, dbSymptoms);
      return newSymptom;
    }
  },

  getSymptoms: async (sessionId) => {
    if (useMongo) {
      return await SymptomModel.find({ sessionId }).sort({ createdAt: -1 }).lean();
    } else {
      const dbSymptoms = readJSON(SYMPTOMS_FILE);
      return dbSymptoms
        .filter((s) => s.sessionId === sessionId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  },

  clearSymptoms: async (sessionId) => {
    if (useMongo) {
      await SymptomModel.deleteMany({ sessionId });
    } else {
      const dbSymptoms = readJSON(SYMPTOMS_FILE);
      const filtered = dbSymptoms.filter((s) => s.sessionId !== sessionId);
      writeJSON(SYMPTOMS_FILE, filtered);
    }
  },
};

export default connectDB;
export { useMongo };
