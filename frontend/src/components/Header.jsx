import React from 'react';
import { Landmark, Globe, BookOpen } from 'lucide-react';

export default function Header({ language, setLanguage, onOpenDirectory, onReset }) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="brand-wrapper" onClick={onReset} role="button" tabIndex={0}>
          <div className="brand-icon">
            <Landmark size={22} />
          </div>
          <div>
            <span className="brand-title">CivicHelp AI</span>
            <span className="brand-tag">India</span>
          </div>
        </div>

        <div className="header-actions">
          <button 
            type="button" 
            className="btn-secondary-sm"
            onClick={onOpenDirectory}
            title="Browse all verified government schemes"
          >
            <BookOpen size={16} />
            <span>Verified Services</span>
          </button>

          <div className="lang-toggle">
            <button
              type="button"
              className={`lang-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => setLanguage('en')}
            >
              EN
            </button>
            <button
              type="button"
              className={`lang-btn ${language === 'ta' ? 'active' : ''}`}
              onClick={() => setLanguage('ta')}
              title="தமிழ் - Tamil guidance"
            >
              தமிழ்
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
