import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_EMBEDDING_MODEL = 'text-embedding-004';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const MAX_TOKENS = 800;

let genAI = null;
let groqClient = null;

function getActiveProvider() {
  if (process.env.GEMINI_API_KEY) {
    if (!genAI) {
      genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return { name: 'gemini', client: genAI };
  } else if (process.env.GROQ_API_KEY) {
    if (!groqClient) {
      groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return { name: 'groq', client: groqClient };
  } else {
    throw new Error('Neither GEMINI_API_KEY nor GROQ_API_KEY is set in environment or .env file');
  }
}

/**
 * Generate a response using the active AI model (Gemini or Groq LLaMA fallback).
 */
export async function generateAnswer(messages) {
  const provider = getActiveProvider();

  if (provider.name === 'gemini') {
    const systemMessage = messages.find((m) => m.role === 'system');
    const otherMessages = messages.filter((m) => m.role !== 'system');

    const modelOptions = { model: GEMINI_MODEL };
    if (systemMessage) {
      modelOptions.systemInstruction = systemMessage.content;
    }

    const model = provider.client.getGenerativeModel(modelOptions);

    const contents = otherMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await model.generateContent({ contents });
    return response.response.text().trim();
  } else {
    // Groq fallback
    const response = await provider.client.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      max_tokens: MAX_TOKENS,
      temperature: 0.2,
    });
    return response.choices[0]?.message?.content?.trim() || '';
  }
}

/**
 * Generate embedding for a single text chunk.
 * If using Gemini: uses Gemini's text-embedding-004.
 * If using Groq: uses HuggingFace free inference API (all-MiniLM-L6-v2) or fallback hash.
 */
export async function generateEmbedding(text) {
  let provider;
  try {
    provider = getActiveProvider();
  } catch {
    return fallbackEmbedding(text);
  }

  if (provider.name === 'gemini') {
    const model = provider.client.getGenerativeModel({ model: GEMINI_EMBEDDING_MODEL });
    try {
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.warn(`text-embedding-004 failed: ${error.message}. Trying gemini-embedding-001...`);
      const fallbackModel = provider.client.getGenerativeModel({ model: 'gemini-embedding-001' });
      const result = await fallbackModel.embedContent(text);
      return result.embedding.values;
    }
  } else {
    // HuggingFace embedding fallback for Groq mode
    return await hfEmbedding(text);
  }
}

/**
 * Generate embeddings in batch.
 */
export async function generateEmbeddings(texts) {
  let provider;
  try {
    provider = getActiveProvider();
  } catch {
    return texts.map((t) => fallbackEmbedding(t));
  }

  if (provider.name === 'gemini') {
    const model = provider.client.getGenerativeModel({ model: GEMINI_EMBEDDING_MODEL });
    try {
      const requests = texts.map((text) => ({
        content: { parts: [{ text }] },
      }));
      const result = await model.batchEmbedContents({ requests });
      return result.embeddings.map((e) => e.values);
    } catch (error) {
      console.warn(`Batch embedding with text-embedding-004 failed: ${error.message}. Fallback to individual...`);
      return Promise.all(texts.map((text) => generateEmbedding(text)));
    }
  } else {
    // HuggingFace batch embedding fallback for Groq mode
    return await hfEmbeddings(texts);
  }
}

// ─── Fallback Utilities ──────────────────────────────────────────────────────

async function hfEmbedding(text) {
  const HF_TOKEN = process.env.HF_API_TOKEN;
  const MODEL = 'sentence-transformers/all-MiniLM-L6-v2';

  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/pipeline/feature-extraction/${MODEL}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(HF_TOKEN ? { Authorization: `Bearer ${HF_TOKEN}` } : {}),
        },
        body: JSON.stringify({
          inputs: text,
          options: { wait_for_model: true },
        }),
      }
    );

    if (!response.ok) throw new Error(`HF error: ${response.status}`);
    const embedding = await response.json();
    return Array.isArray(embedding[0]) ? embedding[0] : embedding;
  } catch (error) {
    console.error('Embedding API error, using character fallback:', error.message);
    return fallbackEmbedding(text);
  }
}

async function hfEmbeddings(texts) {
  const HF_TOKEN = process.env.HF_API_TOKEN;
  const MODEL = 'sentence-transformers/all-MiniLM-L6-v2';

  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/pipeline/feature-extraction/${MODEL}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(HF_TOKEN ? { Authorization: `Bearer ${HF_TOKEN}` } : {}),
        },
        body: JSON.stringify({
          inputs: texts,
          options: { wait_for_model: true },
        }),
      }
    );

    if (!response.ok) throw new Error(`HF error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Batch embedding API error, using character fallback:', error.message);
    return texts.map((t) => fallbackEmbedding(t));
  }
}

function fallbackEmbedding(text, dim = 384) {
  const embedding = new Array(dim).fill(0);
  const normalized = text.toLowerCase();
  for (let i = 0; i < normalized.length; i++) {
    const idx = (normalized.charCodeAt(i) * (i + 1)) % dim;
    embedding[idx] += 1;
  }
  const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0)) || 1;
  return embedding.map((v) => v / magnitude);
}
