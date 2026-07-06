"""
ingest.py — Load, chunk, embed, and store health knowledge in ChromaDB.
Run once before launching the app: python ingest.py
"""

import os
import sys
# pyrefly: ignore [missing-import]
import chromadb
# pyrefly: ignore [missing-import]
from sentence_transformers import SentenceTransformer
# pyrefly: ignore [missing-import]
from langchain_text_splitters import RecursiveCharacterTextSplitter

# ─── Configuration ────────────────────────────────────────────────────────────
DATA_FILE = os.path.join(os.path.dirname(__file__), "data", "health_knowledge.txt")
CHROMA_PATH = os.path.join(os.path.dirname(__file__), "chroma_db")
COLLECTION_NAME = "health_kb"
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
CHUNK_SIZE = 400          # characters per chunk
CHUNK_OVERLAP = 60        # overlapping characters between chunks
# ──────────────────────────────────────────────────────────────────────────────


def load_text(filepath: str) -> str:
    """Load the raw health knowledge text file."""
    if not os.path.exists(filepath):
        print(f"❌  Data file not found: {filepath}")
        sys.exit(1)
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()


def chunk_text(text: str) -> list[str]:
    """Split text into overlapping chunks for better retrieval coverage."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_text(text)
    # Filter out very short/empty chunks
    chunks = [c.strip() for c in chunks if len(c.strip()) > 50]
    return chunks


def embed_and_store(chunks: list[str]) -> None:
    """Generate embeddings and store them in ChromaDB."""
    print(f"🔄  Loading embedding model: {EMBEDDING_MODEL}")
    model = SentenceTransformer(EMBEDDING_MODEL)

    print(f"🔄  Connecting to ChromaDB at: {CHROMA_PATH}")
    client = chromadb.PersistentClient(path=CHROMA_PATH)

    # Delete existing collection if it exists (fresh ingest)
    existing = [c.name for c in client.list_collections()]
    if COLLECTION_NAME in existing:
        print(f"ℹ️   Existing collection '{COLLECTION_NAME}' found — recreating for fresh ingest.")
        client.delete_collection(COLLECTION_NAME)

    collection = client.create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},   # cosine similarity
    )

    print(f"🔄  Generating embeddings for {len(chunks)} chunks…")
    embeddings = model.encode(chunks, show_progress_bar=True, batch_size=32).tolist()

    ids = [f"chunk_{i}" for i in range(len(chunks))]
    metadatas = [{"source": "health_knowledge.txt", "chunk_index": i} for i in range(len(chunks))]

    # Batch upsert
    BATCH = 100
    for start in range(0, len(chunks), BATCH):
        end = min(start + BATCH, len(chunks))
        collection.add(
            ids=ids[start:end],
            documents=chunks[start:end],
            embeddings=embeddings[start:end],
            metadatas=metadatas[start:end],
        )

    print(f"\n✅  Ingestion complete!")
    print(f"    • Total chunks stored : {len(chunks)}")
    print(f"    • Collection name     : {COLLECTION_NAME}")
    print(f"    • ChromaDB path       : {CHROMA_PATH}")


def main():
    print("=" * 55)
    print("  🏥  Health Chatbot — Knowledge Base Ingestion")
    print("=" * 55)

    print(f"\n📂  Loading data from: {DATA_FILE}")
    raw_text = load_text(DATA_FILE)
    print(f"    • File size: {len(raw_text):,} characters")

    print(f"\n✂️   Chunking text (size={CHUNK_SIZE}, overlap={CHUNK_OVERLAP})…")
    chunks = chunk_text(raw_text)
    print(f"    • Total chunks: {len(chunks)}")
    print(f"    • Sample chunk:\n      '{chunks[0][:120]}…'\n")

    embed_and_store(chunks)


if __name__ == "__main__":
    main()
