import React from 'react';

export default function EmergencyBanner() {
  return (
    <div className="card-red">
      <strong>🚨 EMERGENCY DETECTED</strong>
      <br />
      Your query may indicate a medical emergency.
      <strong> Call 112 (India) / 911 (US) immediately or go to the nearest ER.</strong>
    </div>
  );
}
