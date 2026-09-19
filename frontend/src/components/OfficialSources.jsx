import React from 'react';
import { ShieldCheck, ExternalLink } from 'lucide-react';

export default function OfficialSources({ sources = [], language = 'en' }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="sources-card">
      <div className="card-title-row" style={{ marginBottom: '0.5rem' }}>
        <ShieldCheck size={20} color="#059669" />
        <h3 className="card-title">
          {language === 'ta' ? 'அங்கீகரிக்கப்பட்ட அதிகாரப்பூர்வ மூலங்கள்' : 'Verified Official Government Sources Cited'}
        </h3>
      </div>
      <p style={{ fontSize: '0.825rem', color: '#065f46', marginBottom: '0.75rem' }}>
        {language === 'ta'
          ? 'இந்த வழிகாட்டுதல் கீழ்க்கண்ட சரிபார்க்கப்பட்ட அரசு இணையதளங்கள் மூலம் தயாரிக்கப்பட்டது:'
          : 'This guidance was synthesized strictly from the following authoritative portals:'}
      </p>

      <div>
        {sources.map((src, idx) => (
          <a
            key={idx}
            href={src.official_url}
            target="_blank"
            rel="noopener noreferrer"
            className="source-item"
            title={`Open official portal: ${src.official_url}`}
          >
            <div className="source-info">
              <span className="source-name">{src.title}</span>
              <span className="source-url">{src.official_url}</span>
              <span style={{ fontSize: '0.75rem', color: '#047857', marginTop: '2px' }}>
                Authority: {src.authority} • Verified: {src.last_verified_at || '2026-09-18'}
              </span>
            </div>
            <ExternalLink size={16} color="#059669" style={{ flexShrink: 0 }} />
          </a>
        ))}
      </div>
    </div>
  );
}
