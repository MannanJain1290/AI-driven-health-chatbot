import React, { useState, useEffect } from 'react';
import { FaCloudUploadAlt, FaPlus, FaTrashAlt, FaDownload } from 'react-icons/fa';
import apiClient from '../../api/apiClient';
import { exportChatToTxt } from '../../utils/exportChat';

export default function Sidebar({
  sessionId,
  chatHistory,
  clearChat,
  onAddSymptom,
  symptoms,
  clearSymptoms,
  feedbackStats,
}) {
  const [apiStatus, setApiStatus] = useState('loading');
  const [pdfUploadStatus, setPdfUploadStatus] = useState('');
  const [pdfIngested, setPdfIngested] = useState([]);
  const [symptomInput, setSymptomInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Perform API health check
    apiClient.get('/health')
      .then((res) => {
        if (res.data.status === 'ok') {
          setApiStatus('ok');
        } else {
          setApiStatus('error');
        }
      })
      .catch(() => setApiStatus('error'));
  }, []);

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setPdfUploadStatus('Ingesting PDF...');
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const res = await apiClient.post('/pdf/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPdfIngested(prev => [...prev, file.name]);
      setPdfUploadStatus(`✅ Ingested ${res.data.chunksAdded} chunks`);
    } catch (err) {
      setPdfUploadStatus(`❌ Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddSymptom = (e) => {
    e.preventDefault();
    if (!symptomInput.trim()) return;
    onAddSymptom(symptomInput.trim());
    setSymptomInput('');
  };

  return (
    <aside className="sidebar">
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        🩺 Health Assistant
      </h2>
      <div className="sidebar-divider" />

      {/* API Key Status */}
      <h3>🔑 API Status</h3>
      {apiStatus === 'ok' ? (
        <div className="status-success">✅ Gemini API active</div>
      ) : apiStatus === 'error' ? (
        <div className="status-error">❌ GEMINI_API_KEY not set</div>
      ) : (
        <div className="status-info">🔄 Checking api connection...</div>
      )}

      <div className="sidebar-divider" />

      {/* PDF Upload */}
      <h3>📁 Upload Medical Document</h3>
      <span className="sidebar-caption">
        Upload a PDF (lab report, research) to inject it into the knowledge base.
      </span>
      <label className="file-upload" style={{ marginTop: '0.5rem', display: 'block' }}>
        <FaCloudUploadAlt style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }} />
        <div>{isUploading ? 'Ingesting...' : 'Choose PDF file'}</div>
        <input type="file" accept=".pdf" onChange={handlePdfUpload} disabled={isUploading} />
      </label>
      {pdfUploadStatus && (
        <div style={{ fontSize: '0.8rem', marginTop: '0.4rem', color: pdfUploadStatus.startsWith('❌') ? 'var(--accent-red)' : 'var(--accent-green)' }}>
          {pdfUploadStatus}
        </div>
      )}
      {pdfIngested.length > 0 && (
        <div className="sidebar-caption" style={{ marginTop: '0.3rem', color: 'var(--accent-blue-light)' }}>
          📄 Active docs: {pdfIngested.join(', ')}
        </div>
      )}

      <div className="sidebar-divider" />

      {/* Symptom Tracker */}
      <h3>📋 Symptom Tracker</h3>
      <form onSubmit={handleAddSymptom} style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
        <input
          type="text"
          value={symptomInput}
          onChange={(e) => setSymptomInput(e.target.value)}
          placeholder="headache, fatigue..."
          className="input-field"
          style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
        />
        <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '0 0.8rem' }}>
          <FaPlus />
        </button>
      </form>

      {symptoms.length > 0 && (
        <div style={{ marginTop: '0.8rem' }}>
          <span className="sidebar-caption" style={{ fontWeight: 'bold' }}>Logged Symptoms:</span>
          <div style={{ maxHeight: '150px', overflowY: 'auto', marginTop: '0.4rem' }}>
            {symptoms.slice(0, 8).map((item) => (
              <div key={item._id || Math.random()} style={{ marginBottom: '0.3rem' }}>
                <span className="symptom-tag">🔸 {item.symptom}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}> {item.date}</span>
              </div>
            ))}
          </div>
          <button onClick={clearSymptoms} className="btn btn-danger btn-sm btn-full" style={{ marginTop: '0.5rem', padding: '0.3rem' }}>
            <FaTrashAlt /> Clear Symptoms
          </button>
        </div>
      )}

      <div className="sidebar-divider" />

      {/* Chat Export */}
      <h3>💾 Export Chat</h3>
      {chatHistory.length > 0 ? (
        <button onClick={() => exportChatToTxt(chatHistory)} className="btn btn-secondary btn-sm btn-full">
          <FaDownload /> Download as TXT
        </button>
      ) : (
        <span className="sidebar-caption">No conversation to export yet.</span>
      )}

      {/* Feedback Stats */}
      {feedbackStats && feedbackStats.total > 0 && (
        <>
          <div className="sidebar-divider" />
          <h3>📊 Feedback Stats</h3>
          <div style={{ fontSize: '0.82rem', marginBottom: '0.3rem' }}>
            👍 {feedbackStats.positive} positive | 👎 {feedbackStats.negative} negative
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${Math.round((feedbackStats.positive / feedbackStats.total) * 100)}%` }}
            />
          </div>
        </>
      )}

      <div className="sidebar-footer">
        🩺 AI Health Assistant v2.5<br />
        React · MongoDB · Gemini · RAG
      </div>
    </aside>
  );
}
