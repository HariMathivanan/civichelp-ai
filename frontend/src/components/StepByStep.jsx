import React from 'react';
import { ListOrdered } from 'lucide-react';

export default function StepByStep({ steps = [], language = 'en' }) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="info-card">
      <div className="card-title-row">
        <ListOrdered size={20} className="card-icon" />
        <h3 className="card-title">
          {language === 'ta' ? 'படிமுறை வழிகாட்டுதல்' : 'Step-by-Step Official Procedure'}
        </h3>
      </div>

      <div className="steps-list">
        {steps.map((step, index) => (
          <div key={index} className="step-item">
            <div className="step-num">{index + 1}</div>
            <div className="step-text">{step}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
