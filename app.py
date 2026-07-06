# pyrefly: ignore [missing-import]
import streamlit as st
import os
import time
import datetime
import json

# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
load_dotenv()

# pyrefly: ignore [missing-import]
import streamlit.components.v1 as components

# ─── Page Config ──────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="AI Health Assistant",
    page_icon="🩺",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ─── CSS ──────────────────────────────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

* { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
h1, h2, h3, .hero-title { font-family: 'Syne', sans-serif; }

.stApp {
    background: #080c14;
    background-image:
        radial-gradient(ellipse 80% 50% at 20% 10%, rgba(56,189,248,0.07) 0%, transparent 60%),
        radial-gradient(ellipse 60% 40% at 80% 80%, rgba(52,211,153,0.06) 0%, transparent 50%);
    min-height: 100vh;
}

.main .block-container { padding-top: 1.5rem; padding-bottom: 4rem; max-width: 920px; }

/* ── Sidebar ── */
[data-testid="stSidebar"] {
    background: linear-gradient(180deg, #0a0f1a 0%, #0d1520 100%);
    border-right: 1px solid rgba(56,189,248,0.12);
}
[data-testid="stSidebar"] * { color: #94a3b8 !important; }
[data-testid="stSidebar"] h1,
[data-testid="stSidebar"] h2,
[data-testid="stSidebar"] h3 { color: #7dd3fc !important; font-family: 'Syne', sans-serif !important; }
[data-testid="stSidebar"] .stSuccess > div { background: rgba(52,211,153,0.1) !important; border: 1px solid rgba(52,211,153,0.3) !important; color: #34d399 !important; }
[data-testid="stSidebar"] .stError > div { background: rgba(239,68,68,0.1) !important; border: 1px solid rgba(239,68,68,0.3) !important; }

/* ── Hero ── */
.hero-wrap {
    text-align: center;
    padding: 2.5rem 1rem 1.5rem;
    position: relative;
}
.hero-title {
    font-size: 3rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    background: linear-gradient(120deg, #38bdf8 0%, #34d399 45%, #818cf8 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: gradShift 4s ease infinite;
    margin-bottom: 0.4rem;
    line-height: 1.1;
}
@keyframes gradShift { 0%,100%{background-position:0% center} 50%{background-position:100% center} }
.hero-sub { color: #64748b; font-size: 1rem; font-weight: 300; letter-spacing: 0.01em; }
.hero-badge {
    display: inline-block;
    margin-top: 0.8rem;
    padding: 0.3rem 0.9rem;
    background: rgba(56,189,248,0.08);
    border: 1px solid rgba(56,189,248,0.2);
    border-radius: 20px;
    font-size: 0.78rem;
    color: #7dd3fc;
    letter-spacing: 0.05em;
}

/* ── Cards ── */
.card {
    background: rgba(15,23,42,0.7);
    border: 1px solid rgba(56,189,248,0.12);
    border-radius: 16px;
    padding: 1.6rem 1.8rem;
    margin-bottom: 1.2rem;
    backdrop-filter: blur(12px);
}
.card-green {
    border-color: rgba(52,211,153,0.2);
    border-left: 3px solid #34d399;
}
.card-red {
    background: rgba(20,10,10,0.8);
    border: 2px solid #ef4444;
    border-radius: 14px;
    padding: 1.2rem 1.5rem;
    margin-bottom: 1rem;
    animation: pulseRed 1.8s ease infinite;
}
@keyframes pulseRed {
    0%,100%{box-shadow: 0 0 0 0 rgba(239,68,68,0.35)}
    50%{box-shadow: 0 0 16px 4px rgba(239,68,68,0.15)}
}

/* ── Chat bubbles ── */
.chat-container { display: flex; flex-direction: column; gap: 0.9rem; margin-bottom: 1.5rem; }
.bubble-wrap { display: flex; align-items: flex-start; gap: 0.7rem; }
.bubble-wrap.user { flex-direction: row-reverse; }
.avatar {
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.9rem; flex-shrink: 0; margin-top: 2px;
}
.avatar-user { background: linear-gradient(135deg,#2563eb,#0ea5e9); }
.avatar-bot  { background: linear-gradient(135deg,#059669,#34d399); }
.bubble {
    max-width: 75%;
    padding: 0.75rem 1.1rem;
    border-radius: 16px;
    line-height: 1.65;
    font-size: 0.93rem;
}
.bubble-user {
    background: linear-gradient(135deg, rgba(37,99,235,0.25), rgba(14,165,233,0.15));
    border: 1px solid rgba(37,99,235,0.3);
    color: #e2e8f0;
    border-bottom-right-radius: 4px;
}
.bubble-bot {
    background: rgba(15,23,42,0.9);
    border: 1px solid rgba(52,211,153,0.2);
    color: #cbd5e1;
    border-bottom-left-radius: 4px;
}
.bubble-time { font-size: 0.7rem; color: #475569; margin-top: 0.25rem; text-align: right; }

/* ── Topic chips ── */
.topic-row { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0.8rem 0 1.2rem; }
.topic-chip {
    padding: 0.35rem 0.9rem;
    border-radius: 20px;
    font-size: 0.82rem;
    cursor: pointer;
    border: 1px solid;
    transition: all 0.2s;
    white-space: nowrap;
}

/* ── Stat chips ── */
.stat-chip {
    display: inline-block;
    background: rgba(56,189,248,0.08);
    border: 1px solid rgba(56,189,248,0.2);
    border-radius: 20px;
    padding: 0.25rem 0.8rem;
    font-size: 0.8rem;
    color: #7dd3fc;
    margin-right: 0.4rem;
    margin-bottom: 0.4rem;
}

/* ── Source items ── */
.source-item {
    background: rgba(15,23,42,0.6);
    border: 1px solid rgba(56,189,248,0.12);
    border-radius: 10px;
    padding: 0.8rem 1rem;
    margin-bottom: 0.5rem;
    font-size: 0.85rem;
    color: #94a3b8;
}
.sim-badge {
    display: inline-block;
    background: rgba(52,211,153,0.12);
    border: 1px solid rgba(52,211,153,0.35);
    border-radius: 10px;
    padding: 0.1rem 0.55rem;
    font-size: 0.75rem;
    color: #34d399;
    margin-left: 0.5rem;
}

/* ── Disclaimer ── */
.disclaimer {
    background: rgba(251,191,36,0.06);
    border: 1px solid rgba(251,191,36,0.25);
    border-radius: 10px;
    padding: 0.9rem 1.2rem;
    margin-top: 1.2rem;
    font-size: 0.83rem;
    color: #fbbf24;
}

/* ── Symptom tag ── */
.symptom-tag {
    display: inline-block;
    background: rgba(129,140,248,0.1);
    border: 1px solid rgba(129,140,248,0.3);
    border-radius: 14px;
    padding: 0.2rem 0.7rem;
    font-size: 0.8rem;
    color: #a5b4fc;
    margin: 0.2rem;
}

/* ── Inputs ── */
.stTextArea textarea, .stTextInput input {
    background: rgba(10,15,26,0.95) !important;
    border: 1px solid rgba(56,189,248,0.2) !important;
    border-radius: 10px !important;
    color: #e2e8f0 !important;
    font-size: 0.97rem !important;
    font-family: 'DM Sans', sans-serif !important;
}
.stTextArea textarea:focus, .stTextInput input:focus {
    border-color: #38bdf8 !important;
    box-shadow: 0 0 0 3px rgba(56,189,248,0.1) !important;
}

/* ── Buttons ── */
.stButton > button {
    background: linear-gradient(135deg,#2563eb,#0ea5e9) !important;
    color: white !important;
    border: none !important;
    border-radius: 10px !important;
    padding: 0.6rem 2rem !important;
    font-size: 0.95rem !important;
    font-weight: 600 !important;
    font-family: 'Syne', sans-serif !important;
    letter-spacing: 0.02em !important;
    transition: all 0.2s ease !important;
}
.stButton > button:hover {
    background: linear-gradient(135deg,#1d4ed8,#0284c7) !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 6px 20px rgba(37,99,235,0.4) !important;
}

/* ── File uploader ── */
[data-testid="stFileUploader"] {
    background: rgba(10,15,26,0.6) !important;
    border: 1px dashed rgba(56,189,248,0.25) !important;
    border-radius: 12px !important;
}

/* ── Expander ── */
[data-testid="stExpander"] {
    background: rgba(10,15,26,0.5) !important;
    border: 1px solid rgba(56,189,248,0.12) !important;
    border-radius: 10px !important;
}
[data-testid="stExpander"] summary { color: #94a3b8 !important; }

/* ── Tabs ── */
[data-testid="stTabs"] button { color: #64748b !important; font-family: 'Syne', sans-serif !important; }
[data-testid="stTabs"] button[aria-selected="true"] { color: #38bdf8 !important; border-bottom-color: #38bdf8 !important; }

hr { border-color: rgba(56,189,248,0.08) !important; }

/* ── Scrollbar ── */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #080c14; }
::-webkit-scrollbar-thumb { background: rgba(56,189,248,0.2); border-radius: 3px; }

/* ── TTS button ── */
.tts-btn {
    display: inline-block;
    cursor: pointer;
    background: rgba(56,189,248,0.08);
    border: 1px solid rgba(56,189,248,0.2);
    border-radius: 8px;
    padding: 0.2rem 0.6rem;
    font-size: 0.8rem;
    color: #7dd3fc;
    margin-left: 0.5rem;
    transition: all 0.2s;
}
.tts-btn:hover { background: rgba(56,189,248,0.15); }

/* ── Progress bar ── */
.stProgress > div > div { background: linear-gradient(90deg,#38bdf8,#34d399) !important; border-radius: 4px; }
</style>
""", unsafe_allow_html=True)

# ─── TTS JS injection ─────────────────────────────────────────────────────────
st.markdown("""
<script>
function speakText(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        utt.rate = 0.95;
        utt.pitch = 1;
        window.speechSynthesis.speak(utt);
    } else {
        alert('Text-to-speech not supported in this browser.');
    }
}
</script>
""", unsafe_allow_html=True)

# ─── Session State Defaults ───────────────────────────────────────────────────
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []          # [{role, content, time}]
if "symptom_log" not in st.session_state:
    st.session_state.symptom_log = []           # [{symptom, date}]
if "last_result" not in st.session_state:
    st.session_state.last_result = None
if "last_query" not in st.session_state:
    st.session_state.last_query = ""
if "pending_query" not in st.session_state:
    st.session_state.pending_query = ""
if "pdf_ingested" not in st.session_state:
    st.session_state.pdf_ingested = []
if "feedback_given" not in st.session_state:
    st.session_state.feedback_given = set()
if "active_lang" not in st.session_state:
    st.session_state.active_lang = "en"

# ─── Load chatbot ─────────────────────────────────────────────────────────────
@st.cache_resource(show_spinner=False)
def load_chatbot():
    try:
        from chatbot import answer_query, _get_embedding_model, _get_collection
        _get_embedding_model()
        _get_collection()
        return answer_query
    except Exception as e:
        return str(e)

# ─── Sidebar ──────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("## 🩺 Health Assistant")
    st.markdown("---")

    # API Key status
    st.markdown("### 🔑 API Status")
    if os.getenv("GROQ_API_KEY"):
        st.success("✅ Groq API key detected")
    else:
        st.error("❌ GROQ_API_KEY not set")

    st.markdown("---")

    # ── PDF Upload ──
    st.markdown("### 📁 Upload Medical Document")
    st.caption("Upload a PDF (lab report, research, etc.) to ask questions about it.")
    pdf_file = st.file_uploader("Choose PDF", type=["pdf"], label_visibility="collapsed")
    if pdf_file is not None and pdf_file.name not in st.session_state.pdf_ingested:
        with st.spinner("🔄 Ingesting PDF into knowledge base…"):
            try:
                from chatbot import ingest_pdf_bytes
                chunks = ingest_pdf_bytes(pdf_file.read(), pdf_file.name)
                st.session_state.pdf_ingested.append(pdf_file.name)
                st.success(f"✅ Ingested {chunks} chunks from **{pdf_file.name}**")
            except ImportError:
                st.warning("⚠️ PyMuPDF not installed. Run: `pip install pymupdf`")
            except Exception as ex:
                st.error(f"❌ Error: {ex}")

    if st.session_state.pdf_ingested:
        st.caption(f"📄 Active docs: {', '.join(st.session_state.pdf_ingested)}")

    st.markdown("---")

    # ── Symptom Tracker ──
    st.markdown("### 📋 Symptom Tracker")
    sym_input = st.text_input("Log a symptom", placeholder="e.g. headache, fatigue…",
                               label_visibility="collapsed", key="sym_input")
    if st.button("➕ Add Symptom", use_container_width=True):
        if sym_input.strip():
            st.session_state.symptom_log.append({
                "symptom": sym_input.strip(),
                "date": datetime.datetime.now().strftime("%d %b, %H:%M")
            })

    if st.session_state.symptom_log:
        st.markdown("**Your Symptoms:**")
        for item in reversed(st.session_state.symptom_log[-8:]):
            st.markdown(
                f'<span class="symptom-tag">🔸 {item["symptom"]}</span>'
                f'<span style="font-size:0.7rem;color:#475569;"> {item["date"]}</span>',
                unsafe_allow_html=True
            )
        if st.button("🗑️ Clear Symptoms", use_container_width=True):
            st.session_state.symptom_log = []
            st.rerun()

    st.markdown("---")

    # ── Chat Export ──
    st.markdown("### 💾 Export Chat")
    if st.session_state.chat_history:
        lines = [f"AI Health Assistant — Chat Export\n{'='*50}\n"]
        for msg in st.session_state.chat_history:
            role = "You" if msg["role"] == "user" else "Assistant"
            lines.append(f"[{msg.get('time','')}] {role}:\n{msg['content']}\n")
        export_text = "\n".join(lines)
        st.download_button(
            label="📥 Download as TXT",
            data=export_text,
            file_name=f"health_chat_{datetime.datetime.now().strftime('%Y%m%d_%H%M')}.txt",
            mime="text/plain",
            use_container_width=True,
        )
    else:
        st.caption("No conversation to export yet.")

    st.markdown("---")

    # ── System Info ──
    st.markdown("### ⚙️ System Info")
    st.markdown("""
- **Embeddings:** `all-MiniLM-L6-v2`
- **Vector DB:** ChromaDB (local)
- **LLM:** Groq LLaMA-3.3-70b
- **Memory:** Last 6 turns
- **Languages:** Auto-detect
    """)

    # ── Feedback stats ──
    st.markdown("---")
    try:
        from chatbot import get_feedback_stats
        stats = get_feedback_stats()
        if stats["total"] > 0:
            st.markdown("### 📊 Feedback Stats")
            pct = int((stats["positive"] / stats["total"]) * 100)
            st.progress(pct / 100)
            st.caption(f"👍 {stats['positive']} positive  |  👎 {stats['negative']} negative  |  Total: {stats['total']}")
    except Exception:
        pass

    st.markdown("---")
    st.markdown(
        "<div style='font-size:0.72rem;color:#334155;text-align:center;'>"
        "🩺 AI Health Assistant v2.0<br>Streamlit · ChromaDB · Groq · RAG"
        "</div>", unsafe_allow_html=True
    )

# ─── Hero ─────────────────────────────────────────────────────────────────────
st.markdown("""
<div class="hero-wrap">
    <div class="hero-title">🩺 AI Health Assistant</div>
    <p class="hero-sub">Context-aware health answers · Multi-turn memory · PDF analysis · 50+ languages</p>
    <span class="hero-badge">🔒 EDUCATIONAL USE ONLY — NOT MEDICAL ADVICE</span>
</div>
""", unsafe_allow_html=True)

# ─── Load chatbot ─────────────────────────────────────────────────────────────
with st.spinner("🔄 Loading knowledge base…"):
    answer_query = load_chatbot()

if isinstance(answer_query, str):
    st.error(f"❌ **Failed to load chatbot.** Run `python ingest.py` first.\n\n**Error:** {answer_query}")
    st.stop()

# ─── Tabs ─────────────────────────────────────────────────────────────────────
tab_chat, tab_tracker = st.tabs(["💬 Chat", "📋 Symptom Log"])

# ══════════════════════════════════════════════════════════════════════════════
# TAB 1 — CHAT
# ══════════════════════════════════════════════════════════════════════════════
with tab_chat:

    # ── Topic Category Chips ──
    TOPIC_CATEGORIES = {
        "❤️ Heart Health": [
            "Symptoms of heart attack?",
            "How to lower blood pressure?",
            "What causes chest pain?",
        ],
        "🩸 Diabetes": [
            "Symptoms of diabetes?",
            "How to control blood sugar naturally?",
            "Difference between Type 1 and Type 2?",
        ],
        "🧠 Mental Health": [
            "Signs of depression?",
            "How to manage anxiety?",
            "What is PTSD?",
        ],
        "🫁 Respiratory": [
            "What triggers asthma?",
            "COPD symptoms and treatment?",
            "Difference between flu and cold?",
        ],
        "🍎 Nutrition": [
            "Foods to avoid with high cholesterol?",
            "Best diet for kidney disease?",
            "What vitamins boost immunity?",
        ],
        "🚑 First Aid": [
            "How to treat a burn?",
            "What to do for a fracture?",
            "Signs of severe allergic reaction?",
        ],
    }

    with st.expander("📂 Browse by Topic", expanded=False):
        sel_topic = st.selectbox(
            "Choose a topic",
            options=list(TOPIC_CATEGORIES.keys()),
            label_visibility="collapsed",
        )
        st.markdown('<div class="topic-row">', unsafe_allow_html=True)
        cols = st.columns(len(TOPIC_CATEGORIES[sel_topic]))
        for i, q in enumerate(TOPIC_CATEGORIES[sel_topic]):
            with cols[i]:
                if st.button(q, key=f"topic_{sel_topic}_{i}", use_container_width=True):
                    st.session_state.pending_query = q

    # ── Chat History Display ──
    if st.session_state.chat_history:
        st.markdown('<div class="chat-container">', unsafe_allow_html=True)
        for idx, msg in enumerate(st.session_state.chat_history):
            role = msg["role"]
            content = msg["content"]
            ts = msg.get("time", "")
            avatar = "🧑" if role == "user" else "🤖"
            av_cls = "avatar-user" if role == "user" else "avatar-bot"
            bub_cls = "bubble-user" if role == "user" else "bubble-bot"
            wrap_cls = "bubble-wrap user" if role == "user" else "bubble-wrap"

            # Render bubble
            safe_content = content.replace("<", "&lt;").replace(">", "&gt;")
            st.markdown(f"""
            <div class="{wrap_cls}">
                <div class="avatar {av_cls}">{avatar}</div>
                <div>
                    <div class="bubble {bub_cls}">{safe_content}</div>
                    <div class="bubble-time">{ts}</div>
                </div>
            </div>
            """, unsafe_allow_html=True)

            # TTS button for bot messages
            # TTS button for bot messages
        if role == "assistant":
            clean_for_tts = content.replace('\n', ' ')[:500]
            tts_html = f"""
            <button onclick="(function(){{
                window.speechSynthesis.cancel();
                var u = new SpeechSynthesisUtterance('{clean_for_tts}');
                u.rate = 0.95;
                window.speechSynthesis.speak(u);
            }})()" style="
                background: rgba(56,189,248,0.08);
                border: 1px solid rgba(56,189,248,0.2);
                border-radius: 8px;
                padding: 4px 12px;
                color: #7dd3fc;
                cursor: pointer;
                font-size: 13px;
                margin-top: 4px;
            ">🔊 Read aloud</button>
            """
            st.components.v1.html(tts_html, height=40)

        st.markdown('</div>', unsafe_allow_html=True)
        st.markdown("---")

    # ── Input Box ──
    st.markdown('<div class="card">', unsafe_allow_html=True)
    st.markdown("### 💬 Ask a Health Question")

    default_val = st.session_state.pending_query
    if default_val:
        st.session_state.pending_query = ""

    query = st.text_area(
        "Question",
        value=default_val,
        placeholder="e.g. What are the symptoms of diabetes? Can I mix ibuprofen with paracetamol?",
        height=100,
        label_visibility="collapsed",
        key="query_input",
    )

    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        ask_clicked = st.button("🔍 Get Answer", use_container_width=True)

    if st.session_state.chat_history:
        col_a, col_b = st.columns(2)
        with col_a:
            if st.button("🗑️ Clear Chat", use_container_width=True):
                st.session_state.chat_history = []
                st.session_state.last_result = None
                st.session_state.last_query = ""
                st.session_state.active_lang = "en"
                st.rerun()
    st.markdown('</div>', unsafe_allow_html=True)

    # ── Process Query ──
    if ask_clicked:
        if not query or not query.strip():
            st.warning("⚠️ Please enter a question first.")
            st.stop()

        # Multi-language: detect + translate
        try:
            from chatbot import detect_and_translate_to_english, translate_to_language
            en_query, detected_lang = detect_and_translate_to_english(query.strip())
            st.session_state.active_lang = detected_lang
        except Exception:
            en_query = query.strip()
            detected_lang = "en"

        if detected_lang != "en":
            st.info(f"🌐 Detected language: **{detected_lang.upper()}** — translating to English for search…")

        # Build history for LLM (last N turns)
        history_for_llm = [
            {"role": m["role"], "content": m["content"]}
            for m in st.session_state.chat_history
        ]

        with st.spinner("🔄 Searching knowledge base and generating answer…"):
            start = time.time()
            result = answer_query(en_query, chat_history=history_for_llm)
            elapsed = time.time() - start

        answer_text = result["answer"]

        # Translate answer back if needed
        if detected_lang != "en":
            try:
                answer_text = translate_to_language(answer_text, detected_lang)
            except Exception:
                pass

        # Save to history
        now = datetime.datetime.now().strftime("%H:%M")
        st.session_state.chat_history.append({"role": "user", "content": query.strip(), "time": now})
        st.session_state.chat_history.append({"role": "assistant", "content": answer_text, "time": now})
        st.session_state.last_result = result
        st.session_state.last_query = query.strip()

        st.rerun()

    # ── Show result details (emergency, sources, feedback) ──
    if st.session_state.last_result:
        result = st.session_state.last_result

        # Emergency banner
        if result["is_emergency"]:
            st.markdown("""
            <div class="card-red">
                <strong>🚨 EMERGENCY DETECTED</strong><br>
                Your query may indicate a medical emergency.
                <strong>Call 112 (India) / 911 (US) immediately or go to the nearest ER.</strong>
            </div>
            """, unsafe_allow_html=True)

        # Stats
        num_src = len(result["sources"])
        st.markdown(
            f'<span class="stat-chip">📄 {num_src} source(s)</span>'
            f'<span class="stat-chip">🔒 No data stored</span>'
            f'<span class="stat-chip">🌐 Lang: {st.session_state.active_lang.upper()}</span>',
            unsafe_allow_html=True
        )

        # Sources
        if result["sources"]:
            with st.expander(f"📚 Retrieved Sources ({num_src})", expanded=False):
                for i, src in enumerate(result["sources"], 1):
                    snippet = src["text"][:350] + ("…" if len(src["text"]) > 350 else "")
                    pct = int(src["similarity"] * 100)
                    st.markdown(f"""
                    <div class="source-item">
                        <strong>Source {i}</strong>
                        <span class="sim-badge">🎯 {pct}% match</span>
                        <hr style="margin:0.4rem 0;border-color:rgba(56,189,248,0.1)">
                        {snippet}
                    </div>
                    """, unsafe_allow_html=True)

        # ── Feedback ──
        last_q = st.session_state.last_query
        if last_q and last_q not in st.session_state.feedback_given:
            st.markdown("**Was this answer helpful?**")
            fb_col1, fb_col2, fb_col3 = st.columns([1, 1, 4])
            with fb_col1:
                if st.button("👍 Yes", key="fb_up"):
                    try:
                        from chatbot import save_feedback
                        save_feedback(last_q, result["answer"], 1)
                    except Exception:
                        pass
                    st.session_state.feedback_given.add(last_q)
                    st.success("Thanks for your feedback!")
            with fb_col2:
                if st.button("👎 No", key="fb_down"):
                    try:
                        from chatbot import save_feedback
                        save_feedback(last_q, result["answer"], 0)
                    except Exception:
                        pass
                    st.session_state.feedback_given.add(last_q)
                    st.info("Thanks! We'll work to improve.")

        # Disclaimer
        st.markdown(
            '<div class="disclaimer">⚠️ <strong>Medical Disclaimer:</strong> '
            'This information is for educational purposes only. '
            'It is NOT a substitute for professional medical advice, diagnosis, or treatment. '
            'Always consult a qualified healthcare professional.</div>',
            unsafe_allow_html=True
        )

# ══════════════════════════════════════════════════════════════════════════════
# TAB 2 — SYMPTOM LOG
# ══════════════════════════════════════════════════════════════════════════════
with tab_tracker:
    st.markdown("### 📋 Symptom Log")
    st.caption("Track your symptoms over time. Use the sidebar to add new ones.")

    if not st.session_state.symptom_log:
        st.markdown("""
        <div class="card" style="text-align:center;padding:3rem;">
            <div style="font-size:2rem;margin-bottom:0.5rem;">📝</div>
            <div style="color:#475569;">No symptoms logged yet.</div>
            <div style="color:#334155;font-size:0.85rem;margin-top:0.4rem;">
                Use the sidebar to add symptoms.
            </div>
        </div>
        """, unsafe_allow_html=True)
    else:
        # Group by date
        from collections import defaultdict
        by_date = defaultdict(list)
        for item in st.session_state.symptom_log:
            day = item["date"].split(",")[0]
            by_date[day].append(item)

        for day, items in reversed(list(by_date.items())):
            st.markdown(f"**📅 {day}**")
            st.markdown('<div class="card" style="padding:1rem;">', unsafe_allow_html=True)
            for item in items:
                time_str = item["date"].split(",")[-1].strip() if "," in item["date"] else ""
                st.markdown(
                    f'<span class="symptom-tag">🔸 {item["symptom"]}</span>'
                    f'<span style="font-size:0.72rem;color:#475569;"> at {time_str}</span>',
                    unsafe_allow_html=True
                )
            st.markdown('</div>', unsafe_allow_html=True)

        # Ask about symptoms button
        if st.button("🔍 Ask AI about my symptoms", use_container_width=False):
            symptoms_str = ", ".join([s["symptom"] for s in st.session_state.symptom_log])
            st.session_state.pending_query = f"I have these symptoms: {symptoms_str}. What could this indicate?"
            st.rerun()

# ─── Footer ───────────────────────────────────────────────────────────────────
st.markdown("---")
st.markdown("""
<div style="text-align:center;color:#1e293b;font-size:0.78rem;padding:1rem 0;">
    🩺 <strong style="color:#334155;">AI Health Assistant v2.0</strong> —
    Educational use only. Not a substitute for professional medical advice.<br>
    Built with Streamlit · ChromaDB · Groq · sentence-transformers · RAG
</div>
""", unsafe_allow_html=True)