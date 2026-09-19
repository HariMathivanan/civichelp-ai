import React, { useState, useEffect } from 'react';
import { Search, Database, Sparkles, Check } from 'lucide-react';

const STEPS = [
  { text: 'Sanitizing query & protecting privacy...', delay: 0 },
  { text: 'Searching verified Indian government knowledge vault...', delay: 600 },
  { text: 'Retrieving official rules, fees & procedures...', delay: 1400 },
  { text: 'Synthesizing plain-language actionable plan...', delay: 2200 }
];

export default function LoadingState({ language = 'en' }) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timers = STEPS.map((step, idx) => {
      return setTimeout(() => {
        setCurrentStep(idx);
      }, step.delay);
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  const isTamil = language === 'ta';

  return (
    <div className="loading-card">
      <div className="spinner" />
      <h3 className="loading-title">
        {isTamil ? 'அரசு வழிகாட்டுதல் தயாரிக்கப்படுகிறது...' : 'Synthesizing Grounded Citizen Guidance...'}
      </h3>
      <p style={{ color: 'var(--color-text-subtle)', fontSize: '0.9rem' }}>
        {isTamil ? 'அதிகாரப்பூர்வ ஆவணங்களிலிருந்து சரிபார்க்கப்படுகிறது' : 'Cross-referencing verified government knowledge base'}
      </p>

      <div className="loading-steps">
        {STEPS.map((s, idx) => {
          const isDone = currentStep > idx;
          const isCurrent = currentStep === idx;
          return (
            <div
              key={idx}
              className="loading-step-item"
              style={{
                opacity: isCurrent || isDone ? 1 : 0.35,
                fontWeight: isCurrent ? 600 : 400,
                color: isDone ? 'var(--color-verified)' : isCurrent ? 'var(--color-primary)' : 'var(--color-text-subtle)'
              }}
            >
              {isDone ? (
                <Check size={16} color="var(--color-verified)" />
              ) : isCurrent ? (
                <Sparkles size={16} color="var(--color-primary)" className="spin-slow" />
              ) : (
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid #cbd5e1' }} />
              )}
              <span>{s.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
