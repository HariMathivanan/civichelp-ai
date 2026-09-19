import React from 'react';
import { FileText } from 'lucide-react';

export default function DocumentsCard({ documents = [], language = 'en' }) {
  if (!documents || documents.length === 0) return null;

  return (
    <div className="info-card">
      <div className="card-title-row">
        <FileText size={20} className="card-icon" />
        <h3 className="card-title">
          {language === 'ta' ? 'தேவையான ஆவணங்கள்' : 'Required Verified Documents'}
        </h3>
      </div>

      <ul style={{ paddingLeft: '1.25rem', color: 'var(--color-text-main)', fontSize: '0.95rem' }}>
        {documents.map((doc, idx) => (
          <li key={idx} style={{ marginBottom: '0.5rem', lineHeight: 1.5 }}>
            {doc}
          </li>
        ))}
      </ul>
    </div>
  );
}
