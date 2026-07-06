import React from 'react';

export default function StatChips({ numSources, activeLang }) {
  return (
    <div className="stat-chips">
      <span className="stat-chip">📄 {numSources} source(s)</span>
      <span className="stat-chip">🔒 Encrypted locally</span>
      <span className="stat-chip">🌐 Lang: {activeLang.toUpperCase()}</span>
    </div>
  );
}
