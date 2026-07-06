# 🩺 AI Health Assistant

> A production-grade, RAG-powered health chatbot with multi-turn memory, PDF analysis, 50+ language support, and a polished dark UI — built with Streamlit, ChromaDB, and Groq.

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white)
![Streamlit](https://img.shields.io/badge/Streamlit-1.35%2B-FF4B4B?logo=streamlit&logoColor=white)
![ChromaDB](https://img.shields.io/badge/Vector_DB-ChromaDB-8B5CF6)
![Groq](https://img.shields.io/badge/LLM-Groq_LLaMA_3.3-orange)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

| Feature | Description |
|---|---|
| 💬 **Multi-turn Chat** | Remembers the last 6 conversation turns for contextual follow-ups |
| 📁 **PDF Upload & Q&A** | Upload lab reports, research papers, or prescriptions and ask questions |
| 🌐 **50+ Languages** | Auto-detects your language, answers in English, translates back |
| 📋 **Symptom Tracker** | Log symptoms by date and ask AI about them in one click |
| 📂 **Topic Categories** | Quick-select questions across Heart Health, Diabetes, Mental Health, and more |
| 🔊 **Text-to-Speech** | Read any answer aloud via browser speech synthesis |
| ⭐ **Feedback System** | Rate answers; feedback saved to SQLite and shown as aggregate stats |
| 💾 **Chat Export** | Download your full conversation as a `.txt` file |
| 🚨 **Emergency Detection** | Keyword-based detection of life-threatening queries with urgent banners |
| ⚡ **RAG Architecture** | Retrieval-Augmented Generation — answers grounded in your knowledge base |

---

## 🏗️ Architecture

```
User Query
    │
    ▼
┌─────────────────────────────────┐
│  Language Detection (langdetect) │
│  Translation → English           │
└────────────────┬────────────────┘
                 │
    ┌────────────▼────────────┐
    │   Embedding (MiniLM-L6)  │
    └────────────┬────────────┘
                 │
    ┌────────────▼────────────┐
    │  ChromaDB Vector Search  │  ← PDF chunks + pre-ingested KB
    │  Top-K cosine retrieval  │
    └────────────┬────────────┘
                 │
    ┌────────────▼────────────┐
    │  RAG Prompt Construction │
    │  + Chat History (N turns)│
    └────────────┬────────────┘
                 │
    ┌────────────▼────────────┐
    │  Groq LLaMA-3.3-70b     │
    └────────────┬────────────┘
                 │
    ┌────────────▼────────────┐
    │  Translate back → User   │
    │  Language (if needed)    │
    └────────────┬────────────┘
                 │
    ┌────────────▼────────────┐
    │  Streamlit UI + TTS +    │
    │  Feedback + Sources      │
    └─────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/Dhairyasummi/aihealthchatbot.git
cd aihealthchatbot
```

### 2. Create a virtual environment

```bash
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Set your API key

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Get a free Groq API key at [console.groq.com](https://console.groq.com).

### 5. Ingest the knowledge base

```bash
python ingest.py
```

### 6. Run the app

```bash
streamlit run app.py
```

Open [http://localhost:8501](http://localhost:8501) in your browser.

---

## 📁 Project Structure

```
aihealthchatbot/
│
├── app.py              # Streamlit UI (all pages, tabs, components)
├── chatbot.py          # RAG pipeline (retrieval, LLM, language, PDF, feedback)
├── ingest.py           # One-time script to embed & store health documents
├── requirements.txt    # All Python dependencies
├── .env                # Your API keys (DO NOT commit)
├── .env.example        # Template for environment variables
│
├── data/               # Raw health documents (txt, pdf, csv)
├── chroma_db/          # ChromaDB persistent vector store
└── feedback.db         # SQLite feedback database (auto-created)
```

---

## ⚙️ Configuration

All key parameters are at the top of `chatbot.py`:

| Variable | Default | Description |
|---|---|---|
| `TOP_K` | `5` | Number of documents to retrieve per query |
| `SIMILARITY_THRESHOLD` | `0.30` | Minimum cosine similarity to include a source |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Groq model to use |
| `MAX_TOKENS` | `800` | Max tokens in LLM response |
| `MAX_HISTORY_TURNS` | `6` | Number of past turns sent to the LLM |

---

## 🌐 Language Support

The chatbot auto-detects 50+ languages using `langdetect` and translates queries using `deep-translator` (Google Translate backend). Supported examples:

Hindi, Spanish, French, German, Arabic, Chinese, Japanese, Portuguese, Russian, Bengali, Tamil, Telugu, and more.

---

## 📄 PDF Upload

1. Use the **sidebar → Upload Medical Document** section.
2. Upload any PDF (lab reports, drug information sheets, clinical guidelines).
3. The text is automatically chunked, embedded, and added to ChromaDB.
4. Ask questions about the PDF content just like the pre-built knowledge base.

---

## 🔒 Disclaimer

> **This application is for educational purposes only.** It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for any medical concerns. In a medical emergency, call 112 (India) or 911 (US) immediately.

---

## 🛠️ Tech Stack

- **Frontend:** Streamlit with custom CSS (dark theme, animations)
- **Embeddings:** `sentence-transformers/all-MiniLM-L6-v2`
- **Vector Database:** ChromaDB (local persistent)
- **LLM:** Groq API — LLaMA 3.3 70B Versatile
- **PDF Parsing:** PyMuPDF (fitz)
- **Translation:** deep-translator + langdetect
- **Feedback Storage:** SQLite3 (stdlib)
- **TTS:** Browser Web Speech API (no server needed)

---

## 📬 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

---

## 📝 License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">Built with ❤️ using Streamlit · ChromaDB · Groq · RAG</p>