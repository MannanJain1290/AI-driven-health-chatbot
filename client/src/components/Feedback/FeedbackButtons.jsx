import React, { useState } from 'react';

export default function FeedbackButtons({ onSubmitFeedback }) {
  const [submitted, setSubmitted] = useState(false);
  const [sentiment, setSentiment] = useState(null);

  const handleFeedback = (rating) => {
    setSentiment(rating);
    onSubmitFeedback(rating);
    setSubmitted(true);
  };

  return (
    <div style={{ marginTop: '0.8rem', padding: '0.5rem 0' }}>
      {!submitted ? (
        <div className="feedback-row">
          <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Was this answer helpful?
          </span>
          <button onClick={() => handleFeedback(1)} className="btn-feedback">
            👍 Yes
          </button>
          <button onClick={() => handleFeedback(0)} className="btn-feedback">
            👎 No
          </button>
        </div>
      ) : (
        <div style={{ fontSize: '0.85rem', color: 'var(--accent-blue-light)' }}>
          {sentiment === 1
            ? '✅ Thanks for your feedback!'
            : "ℹ️ Thanks! We'll work to improve."}
        </div>
      )}
    </div>
  );
}
