# 🩺 AI Health Assistant (MERN Stack)

> A production-grade, RAG-powered health chatbot with multi-turn memory, PDF analysis, 50+ language support, and a polished dark UI — built with MongoDB, Express.js, React, Node.js, and Google Gemini API.

## ✨ Features

- 💬 **Multi-turn Chat**: Remembers the conversation history for contextual follow-ups.
- 📁 **PDF Upload & Q&A**: Upload medical reports or research papers and ask questions.
- 🌐 **50+ Languages**: Auto-detects language, answers from the knowledge base, and translates back.
- 📋 **Symptom Tracker**: Log symptoms by date, view logged history, and ask AI to analyze them.
- 📂 **Topic Categories**: Quick-select common health questions.
- 🔊 **Text-to-Speech**: Listen to assistant answers using the browser speech synthesis API.
- ⭐ **Feedback System**: Rate answers with thumbs up/down; logs metrics to MongoDB.
- 💾 **Chat Export**: Export history to a formatted text file.
- 🚨 **Emergency Detection**: Scans inputs for critical keywords and prompts urgent local emergency services.

---

## 🏗️ Architecture

```
User Query
    │
    ▼
┌─────────────────────────────────┐
│ Language Detection (franc)      │
│ Translation → English           │
└────────────────┬────────────────┘
                 │
    ┌────────────▼────────────┐
    │ Gemini Embedding API   │
    │ (text-embedding-004)    │
    └────────────┬────────────┘
                 │
    ┌────────────▼────────────┐
    │ MongoDB Similarity Search│  ← PDF chunks + pre-ingested KB
    └────────────┬────────────┘
                 │
    ┌────────────▼────────────┐
    │ RAG Prompt Construction │
    │ + Chat History (N turns)│
    └────────────┬────────────┘
                 │
    ┌────────────▼────────────┐
    │ Gemini 1.5 Flash        │
    └────────────┬────────────┘
                 │
    ┌────────────▼────────────┐
    │ Translate back → User   │
    └─────────────────────────┘
```

---

## ⚡ Setup & Ingestion

### Prerequisites
- **Node.js**: v18+
- **MongoDB**: A running local MongoDB instance (`mongodb://localhost:27017`) or a MongoDB Atlas connection URI.
- **Gemini API Key**: Obtain a key from [Google AI Studio](https://aistudio.google.com/).

### Backend Installation

1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set your environment variables in a `.env` file inside `/server`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   MONGODB_URI=mongodb://localhost:27017/healthchatbot
   PORT=5000
   ```
4. Ingest the health knowledge base into MongoDB:
   ```bash
   npm run ingest
   ```

### Frontend Installation

1. Navigate to the client folder:
   ```bash
   cd ../client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

Open your browser at `http://localhost:5173`.