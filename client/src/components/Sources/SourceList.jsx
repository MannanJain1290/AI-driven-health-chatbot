import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

export default function SourceList({ sources }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="expander" style={{ marginTop: '0.8rem' }}>
      <div className="expander-header" onClick={() => setIsOpen(!isOpen)}>
        <span>📚 Retrieved Sources ({sources.length})</span>
        {isOpen ? <FaChevronUp /> : <FaChevronDown />}
      </div>

      {isOpen && (
        <div className="expander-content" style={{ maxHeight: '250px', overflowY: 'auto' }}>
          {sources.map((src, index) => {
            const matchPct = Math.round(src.similarity * 100);
            return (
              <div key={index} className="source-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <strong>Source {index + 1}</strong>
                  <span className="sim-badge">🎯 {matchPct}% match</span>
                </div>
                <hr style={{ margin: '0.3rem 0', borderColor: 'rgba(56, 189, 248, 0.1)' }} />
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                  {src.text.slice(0, 350)}{src.text.length > 350 ? '...' : ''}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
