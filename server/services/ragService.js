import { db } from '../config/db.js';
import { generateEmbedding, generateAnswer } from './geminiService.js';
import { isEmergency, EMERGENCY_MESSAGE, DISCLAIMER } from './emergencyService.js';

const TOP_K = 5;
const SIMILARITY_THRESHOLD = 0.30;
const MAX_HISTORY_TURNS = 6;

/**
 * Compute cosine similarity between two vectors.
 */
function cosineSimilarity(a, b) {
  if (a.length !== b.length) return 0;
  let dotProduct = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);
  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
}

/**
 * Retrieve relevant context documents from the knowledge base.
 */
async function retrieveContext(query) {
  const queryEmbedding = await generateEmbedding(query);
  const allChunks = await db.getAllChunks();

  if (allChunks.length === 0) {
    return [];
  }

  // Compute similarities
  const scored = allChunks.map((chunk) => ({
    text: chunk.text,
    similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  // Filter and sort
  return scored
    .filter((doc) => doc.similarity >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, TOP_K)
    .map((doc) => ({
      text: doc.text,
      similarity: Math.round(doc.similarity * 1000) / 1000,
    }));
}

/**
 * Build the RAG prompt with retrieved context.
 */
function buildPrompt(query, contextDocs) {
  let contextBlock;
  if (contextDocs.length > 0) {
    contextBlock = contextDocs
      .map((doc, i) => `[Source ${i + 1}] ${doc.text}`)
      .join('\n\n---\n\n');
  } else {
    contextBlock = 'No relevant health information was found in the knowledge base.';
  }

  return `You are a knowledgeable and compassionate health information assistant.
Answer STRICTLY based on the context provided. Do not add outside knowledge.
If context is insufficient, say so. Be concise but thorough. Use bullet points where helpful.
Always remind the user to consult a qualified healthcare professional.
Do NOT diagnose, prescribe, or provide personalised medical advice.

--- HEALTH KNOWLEDGE CONTEXT ---
${contextBlock}
--- END OF CONTEXT ---

User Question: ${query}

Answer:`;
}

/**
 * Main RAG entry point.
 * @param {string} query - The user's health question (in English)
 * @param {Array} chatHistory - Array of {role, content} objects
 * @returns {Object} { answer, sources, isEmergency, disclaimer }
 */
export async function answerQuery(query, chatHistory = []) {
  query = query.trim();
  if (!query) {
    return {
      answer: 'Please enter a health question.',
      sources: [],
      isEmergency: false,
      disclaimer: DISCLAIMER,
    };
  }

  const emergency = isEmergency(query);
  const contextDocs = await retrieveContext(query);
  const systemPrompt = buildPrompt(query, contextDocs);

  // Build messages array
  const messages = [
    {
      role: 'system',
      content:
        'You are a helpful health information assistant. ' +
        'Answer questions based ONLY on the provided context. ' +
        'Be factual, concise, and always recommend professional medical consultation.',
    },
  ];

  // Inject recent chat history
  if (chatHistory.length > 0) {
    const recentHistory = chatHistory.slice(-(MAX_HISTORY_TURNS * 2));
    for (const turn of recentHistory) {
      messages.push({ role: turn.role, content: turn.content });
    }
  }

  messages.push({ role: 'user', content: systemPrompt });

  let llmResponse = await generateAnswer(messages);

  if (emergency) {
    llmResponse = `${EMERGENCY_MESSAGE}\n\n---\n\n${llmResponse}`;
  }

  return {
    answer: llmResponse,
    sources: contextDocs,
    isEmergency: emergency,
    disclaimer: DISCLAIMER,
  };
}
