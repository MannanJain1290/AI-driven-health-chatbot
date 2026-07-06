import React from 'react';

export default function ChatInput({
  query,
  setQuery,
  onSubmit,
  onClearChat,
  isLoading,
  hasHistory,
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: '0.6rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>
        💬 Ask a Health Question
      </h3>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g. What are the symptoms of diabetes? Can I mix ibuprofen with paracetamol?"
        className="input-field"
        rows={3}
        disabled={isLoading}
        style={{ width: '100%', marginBottom: '0.8rem' }}
      />
      <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
        <button
          onClick={onSubmit}
          disabled={isLoading || !query.trim()}
          className="btn btn-primary"
          style={{ minWidth: '150px' }}
        >
          {isLoading ? (
            <div className="spinner">
              <div className="spinner-dot" />
              <div className="spinner-dot" />
              <div className="spinner-dot" />
            </div>
          ) : (
            '🔍 Get Answer'
          )}
        </button>
        {hasHistory && (
          <button onClick={onClearChat} className="btn btn-secondary">
            🗑️ Clear Chat
          </button>
        )}
      </div>
    </div>
  );
}
