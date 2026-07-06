import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

export const TOPIC_CATEGORIES = {
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
};

export default function TopicChips({ onSelectQuestion }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(Object.keys(TOPIC_CATEGORIES)[0]);

  return (
    <div className="expander">
      <div className="expander-header" onClick={() => setIsOpen(!isOpen)}>
        <span>📂 Browse by Topic</span>
        {isOpen ? <FaChevronUp /> : <FaChevronDown />}
      </div>

      {isOpen && (
        <div className="expander-content">
          <div style={{ marginBottom: '0.8rem' }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field"
              style={{ padding: '0.4rem 0.8rem' }}
            >
              {Object.keys(TOPIC_CATEGORIES).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="topic-row">
            {TOPIC_CATEGORIES[selectedCategory].map((q, idx) => (
              <button
                key={idx}
                onClick={() => onSelectQuestion(q)}
                className="topic-chip"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
