import React, { useState, useEffect } from 'react';
import Sidebar from './components/Layout/Sidebar';
import Hero from './components/Layout/Hero';
import ChatContainer from './components/Chat/ChatContainer';
import TopicChips from './components/Chat/TopicChips';
import ChatInput from './components/Chat/ChatInput';
import EmergencyBanner from './components/common/EmergencyBanner';
import Disclaimer from './components/common/Disclaimer';
import StatChips from './components/common/StatChips';
import SourceList from './components/Sources/SourceList';
import FeedbackButtons from './components/Feedback/FeedbackButtons';
import SymptomLog from './components/Symptoms/SymptomLog';
import apiClient from './api/apiClient';

export default function App() {
  const [sessionId, setSessionId] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [symptoms, setSymptoms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [activeLang, setActiveLang] = useState('en');

  // Initialize Session
  useEffect(() => {
    let id = localStorage.getItem('health_chat_session');
    if (!id) {
      id = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('health_chat_session', id);
    }
    setSessionId(id);
    fetchSymptoms(id);
    fetchFeedbackStats();
  }, []);

  const fetchSymptoms = async (sid) => {
    try {
      const res = await apiClient.get(`/symptoms/${sid}`);
      setSymptoms(res.data);
    } catch (err) {
      console.error('Failed to fetch symptoms:', err);
    }
  };

  const fetchFeedbackStats = async () => {
    try {
      const res = await apiClient.get('/feedback/stats');
      setFeedbackStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleAddSymptom = async (symptomText) => {
    try {
      const res = await apiClient.post('/symptoms', {
        symptom: symptomText,
        sessionId,
      });
      setSymptoms((prev) => [res.data, ...prev]);
    } catch (err) {
      console.error('Failed to add symptom:', err);
    }
  };

  const handleClearSymptoms = async () => {
    try {
      await apiClient.delete(`/symptoms/${sessionId}`);
      setSymptoms([]);
    } catch (err) {
      console.error('Failed to clear symptoms:', err);
    }
  };

  const handleClearChat = () => {
    setChatHistory([]);
    setLastResult(null);
    setQuery('');
    setActiveLang('en');
  };

  const handleSubmitQuery = async (customQuery = null) => {
    const textToSubmit = customQuery || query;
    if (!textToSubmit.trim()) return;

    setIsLoading(true);
    setQuery('');

    // Format chat history for backend context
    const historyPayload = chatHistory.map((h) => ({
      role: h.role,
      content: h.content,
    }));

    try {
      const res = await apiClient.post('/chat', {
        query: textToSubmit.trim(),
        chatHistory: historyPayload,
      });

      const now = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      setChatHistory((prev) => [
        ...prev,
        { role: 'user', content: textToSubmit.trim(), time: now },
        { role: 'assistant', content: res.data.answer, time: now },
      ]);

      setLastResult(res.data);
      setActiveLang(res.data.detectedLang || 'en');
    } catch (err) {
      console.error('Failed to get chatbot response:', err);
      const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      setChatHistory((prev) => [
        ...prev,
        { role: 'user', content: textToSubmit.trim(), time: now },
        { role: 'assistant', content: '❌ Failed to connect to server. Please try again.', time: now },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitFeedback = async (rating) => {
    if (!lastResult) return;
    try {
      const lastUserMsg = chatHistory[chatHistory.length - 2]?.content || '';
      await apiClient.post('/feedback', {
        query: lastUserMsg,
        answer: lastResult.answer,
        rating,
      });
      fetchFeedbackStats();
    } catch (err) {
      console.error('Failed to save feedback:', err);
    }
  };

  const handleAskAboutSymptoms = () => {
    if (symptoms.length === 0) return;
    const list = symptoms.map((s) => s.symptom).join(', ');
    const prompt = `I am experiencing the following symptoms: ${list}. What could they indicate and what steps should I take?`;
    setActiveTab('chat');
    handleSubmitQuery(prompt);
  };

  return (
    <div className="app-layout">
      <Sidebar
        sessionId={sessionId}
        chatHistory={chatHistory}
        clearChat={handleClearChat}
        onAddSymptom={handleAddSymptom}
        symptoms={symptoms}
        clearSymptoms={handleClearSymptoms}
        feedbackStats={feedbackStats}
      />

      <main className="main-content">
        <Hero />

        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            💬 Chat
          </button>
          <button
            className={`tab-btn ${activeTab === 'tracker' ? 'active' : ''}`}
            onClick={() => setActiveTab('tracker')}
          >
            📋 Symptom Log
          </button>
        </div>

        {activeTab === 'chat' && (
          <div>
            <TopicChips onSelectQuestion={(q) => handleSubmitQuery(q)} />

            {chatHistory.length > 0 && <ChatContainer chatHistory={chatHistory} />}

            <ChatInput
              query={query}
              setQuery={setQuery}
              onSubmit={() => handleSubmitQuery()}
              onClearChat={handleClearChat}
              isLoading={isLoading}
              hasHistory={chatHistory.length > 0}
            />

            {lastResult && (
              <div style={{ marginTop: '1rem' }}>
                {lastResult.isEmergency && <EmergencyBanner />}
                <StatChips numSources={lastResult.sources.length} activeLang={activeLang} />
                <SourceList sources={lastResult.sources} />
                <FeedbackButtons onSubmitFeedback={handleSubmitFeedback} />
                <Disclaimer />
              </div>
            )}
          </div>
        )}

        {activeTab === 'tracker' && (
          <SymptomLog symptoms={symptoms} onAskAboutSymptoms={handleAskAboutSymptoms} />
        )}

        <hr />
        <footer className="footer">
          🩺 <strong>AI Health Assistant v2.5</strong> — Educational use only. Not a substitute for professional medical advice.
          <br />
          Built with React · MongoDB · Gemini · sentence-transformers · RAG
        </footer>
      </main>
    </div>
  );
}
