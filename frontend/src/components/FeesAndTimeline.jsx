import React from 'react';
import { IndianRupee, Clock } from 'lucide-react';

export default function FeesAndTimeline({ fees, timeline, language = 'en' }) {
  if (!fees && !timeline) return null;

  return (
    <div className="meta-pills-grid">
      {fees && (
        <div className="meta-pill fee">
          <div className="meta-pill-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <IndianRupee size={14} />
            <span>{language === 'ta' ? 'அரசு கட்டணம்' : 'Official Government Fees'}</span>
          </div>
          <div className="meta-pill-val">{fees}</div>
        </div>
      )}

      {timeline && (
        <div className="meta-pill timeline">
          <div className="meta-pill-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={14} />
            <span>{language === 'ta' ? 'எதிர்பார்க்கப்படும் காலம்' : 'Processing Timeline'}</span>
          </div>
          <div className="meta-pill-val">{timeline}</div>
        </div>
      )}
    </div>
  );
}
