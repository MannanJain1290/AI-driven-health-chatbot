"""
chatbot.py — Enhanced RAG pipeline for the AI Health Chatbot.
Supports: multi-turn memory, PDF ingestion, multi-language, feedback logging.
"""

from __future__ import annotations
import os
import re
import json
import sqlite3
import datetime
# pyrefly: ignore [missing-import]
import chromadb
# pyrefly: ignore [missing-import]
from sentence_transformers import SentenceTransformer
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
# pyrefly: ignore [missing-import]
from langchain_groq import ChatGroq
# pyrefly: ignore [missing-import]
from langchain_core.messages import SystemMessage, HumanMessage

load_dotenv()

# ─── Configuration ────────────────────────────────────────────────────────────
CHROMA_PATH       = os.path.join(os.path.dirname(__file__), "chroma_db")
COLLECTION_NAME   = "health_kb"
EMBEDDING_MODEL   = "sentence-transformers/all-MiniLM-L6-v2"
TOP_K             = 5
SIMILARITY_THRESHOLD = 0.30
GROQ_MODEL        = "llama-3.3-70b-versatile"
MAX_TOKENS        = 800
MAX_HISTORY_TURNS = 6          # last N user+assistant pairs sent to LLM
FEEDBACK_DB_PATH  = os.path.join(os.path.dirname(__file__), "feedback.db")

# ─── Emergency keywords ───────────────────────────────────────────────────────
EMERGENCY_KEYWORDS = [
    r"\bheart attack\b", r"\bstroke\b", r"\bcan'?t breathe\b",
    r"\bcannot breathe\b", r"\bdifficulty breathing\b", r"\bshortness of breath\b",
    r"\boverdose\b", r"\bsuicid\b", r"\bself.harm\b", r"\bkilling myself\b",
    r"\bchest pain\b", r"\bcollapsed\b", r"\bunconscious\b", r"\bseizure\b",
    r"\banaphylaxis\b", r"\bsevere bleeding\b", r"\bemergency\b",
    r"\b911\b", r"\bhelp me\b",
]

DISCLAIMER = (
    "⚠️ **Medical Disclaimer:** This information is for educational purposes only and is "
    "NOT a substitute for professional medical advice, diagnosis, or treatment. "
    "Always consult a qualified healthcare professional for medical concerns."
)

EMERGENCY_MESSAGE = (
    "🚨 **EMERGENCY ALERT**: Your query suggests a potentially life-threatening situation. "
    "**Please call your local emergency number (e.g., 112 in India / 911 in the US) immediately "
    "or go to the nearest emergency room.** Do not rely on this chatbot in an emergency."
)

# ─── Lazy-loaded singletons ───────────────────────────────────────────────────
_embedding_model = None
_chroma_collection = None


def _get_embedding_model() -> SentenceTransformer:
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = SentenceTransformer(EMBEDDING_MODEL)
    return _embedding_model


def _get_collection():
    global _chroma_collection
    if _chroma_collection is None:
        client = chromadb.PersistentClient(path=CHROMA_PATH)
        _chroma_collection = client.get_or_create_collection(name=COLLECTION_NAME)
    return _chroma_collection


# ─── Feedback DB ──────────────────────────────────────────────────────────────
def _init_feedback_db():
    conn = sqlite3.connect(FEEDBACK_DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS feedback (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            query     TEXT,
            answer    TEXT,
            rating    INTEGER,
            comment   TEXT
        )
    """)
    conn.commit()
    conn.close()


def save_feedback(query: str, answer: str, rating: int, comment: str = ""):
    """Persist user feedback (thumbs up=1, thumbs down=0) to SQLite."""
    _init_feedback_db()
    conn = sqlite3.connect(FEEDBACK_DB_PATH)
    conn.execute(
        "INSERT INTO feedback (timestamp, query, answer, rating, comment) VALUES (?,?,?,?,?)",
        (datetime.datetime.utcnow().isoformat(), query, answer, rating, comment),
    )
    conn.commit()
    conn.close()


def get_feedback_stats() -> dict:
    """Return aggregate feedback statistics."""
    _init_feedback_db()
    conn = sqlite3.connect(FEEDBACK_DB_PATH)
    cur = conn.execute("SELECT COUNT(*), SUM(rating) FROM feedback")
    row = cur.fetchone()
    conn.close()
    total = row[0] or 0
    positive = int(row[1] or 0)
    return {"total": total, "positive": positive, "negative": total - positive}


# ─── Language Detection & Translation ─────────────────────────────────────────
def detect_and_translate_to_english(text: str) -> tuple[str, str]:
    """
    Detect language and translate to English if needed.
    Returns (translated_text, detected_language_code).
    Falls back gracefully if deep-translator is not installed.
    """
    try:
        # pyrefly: ignore [missing-import]
        from deep_translator import GoogleTranslator
        # pyrefly: ignore [missing-import]
        from langdetect import detect as langdetect_detect

        lang = langdetect_detect(text)
        if lang == "en":
            return text, "en"
        translated = GoogleTranslator(source="auto", target="en").translate(text)
        return translated, lang
    except Exception:
        return text, "en"


def translate_to_language(text: str, target_lang: str) -> str:
    """Translate text back to target language. Falls back gracefully."""
    if target_lang == "en":
        return text
    try:
        # pyrefly: ignore [missing-import]
        from deep_translator import GoogleTranslator
        return GoogleTranslator(source="en", target=target_lang).translate(text)
    except Exception:
        return text


# ─── PDF ingestion (on-the-fly) ───────────────────────────────────────────────
def ingest_pdf_bytes(pdf_bytes: bytes, filename: str = "upload.pdf") -> int:
    """
    Extract text from an in-memory PDF, chunk it, embed and upsert into ChromaDB.
    Returns the number of chunks added.
    """
    try:
        # pyrefly: ignore [missing-import]
        import fitz  # PyMuPDF
    except ImportError:
        raise ImportError("PyMuPDF is required for PDF ingestion. Run: pip install pymupdf")

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    full_text = "\n".join(page.get_text() for page in doc)
    doc.close()

    # Chunk by ~400 chars with 50-char overlap
    chunk_size, overlap = 400, 50
    chunks = []
    start = 0
    while start < len(full_text):
        end = min(start + chunk_size, len(full_text))
        chunks.append(full_text[start:end].strip())
        start += chunk_size - overlap

    chunks = [c for c in chunks if len(c) > 30]

    model = _get_embedding_model()
    collection = _get_collection()
    embeddings = model.encode(chunks).tolist()

    ids = [f"pdf_{filename}_{i}" for i in range(len(chunks))]
    collection.upsert(documents=chunks, embeddings=embeddings, ids=ids)
    return len(chunks)


# ─── Core RAG functions ───────────────────────────────────────────────────────
def is_emergency(query: str) -> bool:
    query_lower = query.lower()
    return any(re.search(p, query_lower) for p in EMERGENCY_KEYWORDS)


def retrieve_context(query: str) -> list[dict]:
    model = _get_embedding_model()
    collection = _get_collection()
    query_embedding = model.encode([query]).tolist()

    results = collection.query(
        query_embeddings=query_embedding,
        n_results=TOP_K,
        include=["documents", "distances"],
    )

    docs = []
    if results and results["documents"]:
        for doc, dist in zip(results["documents"][0], results["distances"][0]):
            similarity = 1.0 - (dist / 2.0)
            if similarity >= SIMILARITY_THRESHOLD:
                docs.append({"text": doc, "similarity": round(similarity, 3)})
    return docs


def build_prompt(query: str, context_docs: list[dict]) -> str:
    if context_docs:
        context_block = "\n\n---\n\n".join(
            f"[Source {i+1}] {doc['text']}" for i, doc in enumerate(context_docs)
        )
    else:
        context_block = "No relevant health information was found in the knowledge base."

    return f"""You are a knowledgeable and compassionate health information assistant.
Answer STRICTLY based on the context provided. Do not add outside knowledge.
If context is insufficient, say so. Be concise but thorough. Use bullet points where helpful.
Always remind the user to consult a qualified healthcare professional.
Do NOT diagnose, prescribe, or provide personalised medical advice.

--- HEALTH KNOWLEDGE CONTEXT ---
{context_block}
--- END OF CONTEXT ---

User Question: {query}

Answer:"""


def answer_query(
    query: str,
    chat_history: list[dict] | None = None,
) -> dict:
    """
    Main RAG entry point.

    Args:
        query: The user's health question (already translated to English if needed).
        chat_history: List of {"role": "user"|"assistant", "content": str} dicts.

    Returns:
        dict with: answer, sources, is_emergency, disclaimer
    """
    query = query.strip()
    if not query:
        return {"answer": "Please enter a health question.", "sources": [],
                "is_emergency": False, "disclaimer": DISCLAIMER}

    emergency = is_emergency(query)
    context_docs = retrieve_context(query)
    system_prompt = build_prompt(query, context_docs)

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return {
            "answer": "⚠️ Groq API key not found. Please set `GROQ_API_KEY` in your `.env` file.",
            "sources": context_docs,
            "is_emergency": emergency,
            "disclaimer": DISCLAIMER,
        }

    client = ChatGroq(api_key=api_key, model=GROQ_MODEL, max_tokens=MAX_TOKENS, temperature=0.2)

    # Build message list with history
    messages = [SystemMessage(content=(
        "You are a helpful health information assistant. "
        "Answer questions based ONLY on the provided context. "
        "Be factual, concise, and always recommend professional medical consultation."
    ))]

    # Inject recent history
    if chat_history:
        for turn in chat_history[-(MAX_HISTORY_TURNS * 2):]:
            if turn["role"] == "user":
                messages.append(HumanMessage(content=turn["content"]))
            else:
                # pyrefly: ignore [missing-import]
                from langchain_core.messages import AIMessage
                messages.append(AIMessage(content=turn["content"]))

    messages.append(HumanMessage(content=system_prompt))

    response = client.invoke(messages)
    llm_response = response.content.strip()

    if emergency:
        llm_response = f"{EMERGENCY_MESSAGE}\n\n---\n\n{llm_response}"

    return {
        "answer": llm_response,
        "sources": context_docs,
        "is_emergency": emergency,
        "disclaimer": DISCLAIMER,
    }


# ─── CLI test ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    test_queries = ["What are the symptoms of diabetes?", "How is hypertension treated?"]
    for q in test_queries:
        print(f"\n{'='*60}\nQ: {q}")
        result = answer_query(q)
        print(f"💬 Answer:\n{result['answer']}")