import Groq from 'groq-sdk';

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const MAX_TOKENS = 800;

let groqClient = null;

function getClient() {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY not set in environment');
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

/**
 * Generate an answer from the Groq LLM.
 * @param {Array} messages - Array of {role, content} message objects
 * @returns {string} The LLM response text
 */
export async function generateAnswer(messages) {
  const client = getClient();
  const response = await client.chat.completions.create({
    model: GROQ_MODEL,
    messages,
    max_tokens: MAX_TOKENS,
    temperature: 0.2,
  });
  return response.choices[0]?.message?.content?.trim() || '';
}

/**
 * Generate embeddings using Groq's embedding endpoint.
 * Falls back to a simple TF-IDF-like approach if unavailable.
 */
export async function generateEmbedding(text) {
  // Use the HuggingFace inference API for embeddings
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

    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.status}`);
    }

    const embedding = await response.json();
    return Array.isArray(embedding[0]) ? embedding[0] : embedding;
  } catch (error) {
    console.error('Embedding API error, using fallback:', error.message);
    return fallbackEmbedding(text);
  }
}

/**
 * Generate embeddings for multiple texts (batch).
 */
export async function generateEmbeddings(texts) {
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

    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Batch embedding API error, using fallback:', error.message);
    return texts.map((t) => fallbackEmbedding(t));
  }
}

/**
 * Simple fallback embedding using character-level hashing.
 * This is only used if the HuggingFace API is unavailable.
 */
function fallbackEmbedding(text, dim = 384) {
  const embedding = new Array(dim).fill(0);
  const normalized = text.toLowerCase();
  for (let i = 0; i < normalized.length; i++) {
    const idx = (normalized.charCodeAt(i) * (i + 1)) % dim;
    embedding[idx] += 1;
  }
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0)) || 1;
  return embedding.map((v) => v / magnitude);
}
