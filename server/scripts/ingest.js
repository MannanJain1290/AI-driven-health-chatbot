/**
 * ingest.js — Load, chunk, embed, and store health knowledge in MongoDB or local JSON.
 * Run once: node scripts/ingest.js
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB, { db } from '../config/db.js';
import { generateEmbeddings } from '../services/geminiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, '..', 'data', 'health_knowledge.txt');
const CHUNK_SIZE = 400;
const CHUNK_OVERLAP = 60;

/**
 * Split text into overlapping chunks.
 */
function chunkText(text) {
  const paragraphs = text.split(/\n\n+/);
  const rawChunks = [];

  let currentChunk = '';
  for (const para of paragraphs) {
    if (currentChunk.length + para.length > CHUNK_SIZE && currentChunk.length > 0) {
      rawChunks.push(currentChunk.trim());
      const overlapText = currentChunk.slice(-CHUNK_OVERLAP);
      currentChunk = overlapText + ' ' + para;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    }
  }
  if (currentChunk.trim().length > 50) {
    rawChunks.push(currentChunk.trim());
  }

  return rawChunks.filter((c) => c.length > 50);
}

async function main() {
  console.log('='.repeat(55));
  console.log('  🏥  Health Chatbot — Knowledge Base Ingestion');
  console.log('='.repeat(55));

  // Initialize DB (MongoDB or fallback)
  await connectDB();

  // Load data
  console.log(`\n📂 Loading data from: ${DATA_FILE}`);
  if (!fs.existsSync(DATA_FILE)) {
    console.error(`❌ Data file not found: ${DATA_FILE}`);
    process.exit(1);
  }
  const rawText = fs.readFileSync(DATA_FILE, 'utf-8');
  console.log(`   • File size: ${rawText.length.toLocaleString()} characters`);

  // Chunk
  console.log(`\n✂️  Chunking text (size=${CHUNK_SIZE}, overlap=${CHUNK_OVERLAP})…`);
  const chunks = chunkText(rawText);
  console.log(`   • Total chunks: ${chunks.length}`);
  console.log(`   • Sample chunk:\n     '${chunks[0].slice(0, 120)}…'\n`);

  // Clear existing chunks
  console.log('🗑️  Clearing existing knowledge base…');
  await db.clearChunks();

  // Generate embeddings in batches
  const BATCH_SIZE = 20;
  console.log(`\n🔄 Generating embeddings for ${chunks.length} chunks (batch size: ${BATCH_SIZE})…`);

  const allEmbeddings = [];
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    process.stdout.write(`   Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)}… `);
    const embeddings = await generateEmbeddings(batch);
    allEmbeddings.push(...embeddings);
    console.log('✅');

    // Small delay to avoid rate limiting
    if (i + BATCH_SIZE < chunks.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // Store in database
  console.log(`\n💾 Storing ${chunks.length} chunks in database…`);
  const docs = chunks.map((text, i) => ({
    text,
    embedding: allEmbeddings[i],
    source: 'health_knowledge.txt',
    chunkIndex: i,
  }));

  await db.addChunks(docs);

  console.log(`\n✅ Ingestion complete!`);
  console.log(`   • Total chunks stored : ${chunks.length}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Ingestion failed:', err);
  process.exit(1);
});
