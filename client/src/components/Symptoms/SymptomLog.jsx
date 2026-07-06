import React from 'react';

export default function SymptomLog({ symptoms, onAskAboutSymptoms }) {
  if (!symptoms || symptoms.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📝</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>No symptoms logged yet.</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.4rem' }}>
          Use the sidebar inputs to start tracking symptoms.
        </div>
      </div>
    );
  }

  // Group symptoms by date (day part)
  const grouped = symptoms.reduce((acc, item) => {
    const day = item.date.split(',')[0].trim();
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
        <h3 style={{ fontSize: '1.1rem' }}>📋 Logged History</h3>
        <button onClick={onAskAboutSymptoms} className="btn btn-secondary btn-sm">
          🔍 Ask AI about my symptoms
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {Object.entries(grouped).map(([day, items]) => (
          <div key={day}>
            <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              📅 {day}
            </div>
            <div className="card" style={{ padding: '1rem', margin: 0 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {items.map((item, idx) => {
                  const time = item.date.includes(',') ? item.date.split(',')[1].trim() : '';
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="symptom-tag">🔸 {item.symptom}</span>
                      {time && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '0.1rem', marginRight: '0.6rem' }}>
                          at {time}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
