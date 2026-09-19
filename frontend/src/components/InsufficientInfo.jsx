import React from 'react';
import { HelpCircle, ExternalLink, ShieldCheck } from 'lucide-react';

export default function InsufficientInfo({ data, onOpenDirectory, language = 'en' }) {
  const isTamil = language === 'ta';

  return (
    <div className="out-of-scope-card">
      <div className="out-of-scope-icon">
        <HelpCircle size={32} />
      </div>

      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.6rem' }}>
        {isTamil ? 'சரிபார்க்கப்பட்ட அதிகாரப்பூர்வ தகவல் இல்லை' : 'Insufficient Verified Official Information'}
      </h3>

      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.975rem', maxWidth: '560px', margin: '0 auto 1.25rem' }}>
        {data.summary || (isTamil
          ? 'தவறான தகவல்களைத் தவிர்க்க CivicHelp AI அதிகாரப்பூர்வ ஆதாரங்களிலிருந்து மட்டுமே பதிலளிக்கிறது.'
          : 'CivicHelp AI strictly avoids hallucinating or guessing government regulations when authoritative sources are not present in our verified knowledge base.')}
      </p>

      <div style={{ backgroundColor: 'var(--color-bg-subtle)', borderRadius: '8px', padding: '1rem', maxWidth: '500px', margin: '0 auto 1.5rem', textAlign: 'left' }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>
          {isTamil ? 'பரிந்துரைக்கப்பட்ட அடுத்த படிகள்:' : 'Recommended Next Steps:'}
        </div>
        <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          <li>{isTamil ? 'இந்திய அரசின் அதிகாரப்பூர்வ போர்டல்களை (india.gov.in அல்லது மாநில போர்டல்) நேரடியாகப் பார்வையிடவும்.' : 'Visit official Indian national portal (india.gov.in) or state portals directly.'}</li>
          <li>{isTamil ? 'எங்கள் சரிபார்க்கப்பட்ட 6 முக்கிய சேவைகளில் உள்ளதா எனப் பார்க்கவும்.' : 'Browse our curated list of 6 verified core citizen services.'}</li>
        </ul>
      </div>

      <button
        type="button"
        className="btn-primary"
        onClick={onOpenDirectory}
        style={{ margin: '0 auto' }}
      >
        <ShieldCheck size={18} />
        <span>{isTamil ? 'சரிபார்க்கப்பட்ட சேவைகளைப் பார்க்கவும்' : 'Browse Verified Services Catalog'}</span>
      </button>
    </div>
  );
}
