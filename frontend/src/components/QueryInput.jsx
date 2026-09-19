import React, { useState } from 'react';
import { Search, Sparkles, AlertCircle } from 'lucide-react';

const EXAMPLE_QUERIES = [
  {
    label: '🆔 Lost Aadhaar Card',
    query: 'I lost my Aadhaar card and my registered mobile number is not working. What should I do to get a replacement PVC card?'
  },
  {
    label: '💳 Instant PAN Card',
    query: 'How to apply for an Instant e-PAN online for free using Aadhaar card?'
  },
  {
    label: '🛂 Tatkaal Passport Fees',
    query: 'What is the official fee, required documents, and timeline for Tatkaal fresh passport application?'
  },
  {
    label: '🚗 Driving Licence Renewal',
    query: 'My driving licence expired 6 months ago. What is the renewal procedure, forms, and fees on Parivahan?'
  },
  {
    label: '🗳️ New Voter ID (Form 6)',
    query: 'How can an 18-year-old citizen apply for a new voter ID card online on the Election Commission portal?'
  },
  {
    label: '📝 Update Aadhaar Address',
    query: 'What documents are required to update my home address in Aadhaar card online?'
  }
];

export default function QueryInput({ query, setQuery, onSubmit, isLoading, language }) {
  const [localError, setLocalError] = useState('');

  const handleTextChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (localError && val.trim().length > 0) {
      setLocalError('');
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();

    if (!trimmed) {
      setLocalError(language === 'ta' ? 'தயவுசெய்து உங்கள் கேள்வியை உள்ளிடவும்.' : 'Please enter your question.');
      return;
    }

    if (trimmed.length > 1000) {
      setLocalError(language === 'ta' ? 'கேள்வி 1000 எழுத்துகளுக்கு மிகாமல் இருக்க வேண்டும்.' : 'Query must be under 1000 characters.');
      return;
    }

    setLocalError('');
    onSubmit(trimmed);
  };

  const handleChipClick = (sampleQuery) => {
    setQuery(sampleQuery);
    setLocalError('');
    onSubmit(sampleQuery);
  };

  const isTamil = language === 'ta';

  return (
    <div className="query-card">
      <form onSubmit={handleFormSubmit}>
        <label htmlFor="civic-query-input" className="input-label">
          {isTamil ? 'அரசு சேவை பற்றிய உங்கள் கேள்வியைக் கேளுங்கள்:' : 'Ask any question about Indian government services:'}
        </label>

        <textarea
          id="civic-query-input"
          className="query-textarea"
          rows={3}
          placeholder={
            isTamil
              ? 'எடுத்துக்காட்டு: எனது ஆதார் அட்டை தொலைந்துவிட்டது, புதிய PVC அட்டை பெறுவது எப்படி?'
              : 'e.g., "I lost my Aadhaar card and don\'t have my registered mobile number. How to get a PVC card?"'
          }
          value={query}
          onChange={handleTextChange}
          disabled={isLoading}
          maxLength={1000}
        />

        {localError && (
          <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <AlertCircle size={14} />
            <span>{localError}</span>
          </div>
        )}

        <div className="query-footer">
          <span className="char-counter">
            {query.length} / 1000 {isTamil ? 'எழுத்துகள்' : 'characters'}
          </span>

          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading || query.trim().length === 0}
          >
            {isLoading ? (
              <span>{isTamil ? 'ஆராய்கிறது...' : 'Analyzing...'}</span>
            ) : (
              <>
                <Search size={18} />
                <span>{isTamil ? 'உதவி பெறுக' : 'Get Help'}</span>
              </>
            )}
          </button>
        </div>
      </form>

      <div className="chips-section">
        <div className="chips-label">
          <Sparkles size={13} style={{ display: 'inline', marginRight: '4px' }} />
          {isTamil ? 'பொதுவான கேள்விகள் (உடனடி உதவி):' : 'Frequently Asked Citizen Questions:'}
        </div>
        <div className="chips-grid">
          {EXAMPLE_QUERIES.map((item, idx) => (
            <button
              key={idx}
              type="button"
              className="chip-btn"
              onClick={() => handleChipClick(item.query)}
              disabled={isLoading}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
