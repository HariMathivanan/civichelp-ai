import React, { useState } from 'react';
import { CheckSquare, Check, Sparkles } from 'lucide-react';

export default function ActionChecklist({ items = [], language = 'en' }) {
  const [checkedState, setCheckedState] = useState({});

  if (!items || items.length === 0) return null;

  const toggleCheck = (index) => {
    setCheckedState(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const total = items.length;
  const completed = Object.values(checkedState).filter(Boolean).length;
  const progressPercent = Math.round((completed / total) * 100);

  return (
    <div className="info-card">
      <div className="card-title-row" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckSquare size={20} className="card-icon" />
          <h3 className="card-title">
            {language === 'ta' ? 'குடிமக்கள் சரிபார்ப்புப் பட்டியல்' : 'Interactive Citizen Action Checklist'}
          </h3>
        </div>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)' }}>
          {completed} / {total} {language === 'ta' ? 'நிறைவு' : 'Ready'} ({progressPercent}%)
        </span>
      </div>

      {/* Progress Bar */}
      <div style={{ height: '6px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
        <div 
          style={{ 
            height: '100%', 
            width: `${progressPercent}%`, 
            backgroundColor: progressPercent === 100 ? 'var(--color-verified)' : 'var(--color-primary)',
            transition: 'width 0.3s ease, background-color 0.3s ease'
          }} 
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {items.map((item, idx) => {
          const isChecked = Boolean(checkedState[idx]);
          return (
            <div
              key={idx}
              className={`checklist-item ${isChecked ? 'checked' : ''}`}
              onClick={() => toggleCheck(idx)}
              role="checkbox"
              aria-checked={isChecked}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleCheck(idx); } }}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => {}} // handled by parent div
                className="checklist-checkbox"
                tabIndex={-1}
              />
              <span className="checklist-text" style={{ fontSize: '0.95rem', flex: 1 }}>
                {item}
              </span>
            </div>
          );
        })}
      </div>

      {progressPercent === 100 && (
        <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: 'var(--color-verified-light)', borderRadius: '6px', color: '#065f46', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
          <Sparkles size={16} />
          <span>{language === 'ta' ? 'அனைத்து ஆவணங்களும் தயார்! இப்போது விண்ணப்பிக்கலாம்.' : 'All items checked! You are ready to proceed.'}</span>
        </div>
      )}
    </div>
  );
}
