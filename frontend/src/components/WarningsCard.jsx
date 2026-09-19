import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function WarningsCard({ warnings = [], language = 'en' }) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="warning-card">
      <div className="card-title-row" style={{ marginBottom: '0.5rem' }}>
        <ShieldAlert size={20} color="#b91c1c" />
        <h3 className="card-title">
          {language === 'ta' ? 'முக்கிய எச்சரிக்கைகள் & மோசடி தடுப்பு' : 'Crucial Warnings & Fraud Prevention'}
        </h3>
      </div>

      <ul className="warning-list">
        {warnings.map((warn, idx) => (
          <li key={idx}>{warn}</li>
        ))}
      </ul>
    </div>
  );
}
