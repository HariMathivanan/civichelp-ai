import React, { useState } from 'react';
import DisclaimerBanner from './components/DisclaimerBanner';
import Header from './components/Header';
import QueryInput from './components/QueryInput';
import ResultView from './components/ResultView';
import LoadingState from './components/LoadingState';
import ErrorAlert from './components/ErrorAlert';
import ServicesDirectoryModal from './components/ServicesDirectoryModal';
import { analyzeCivicQuery } from './services/api';
import { ShieldCheck } from 'lucide-react';

export default function App() {
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [error, setError] = useState(null);
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);

  const handleQuerySubmit = async (userQuery) => {
    setIsLoading(true);
    setError(null);
    setResultData(null);

    try {
      const data = await analyzeCivicQuery(userQuery, language);
      setResultData(data);
    } catch (err) {
      console.error('Query execution error:', err);
      setError(
        err.message || 'Unable to connect to CivicHelp AI service. Please ensure the Express gateway and FastAPI RAG service are running.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setQuery('');
    setResultData(null);
    setError(null);
  };

  const isTamil = language === 'ta';

  return (
    <div className="app-container">
      {/* 1. Persistent Non-Government Disclaimer */}
      <DisclaimerBanner language={language} />

      {/* 2. Top Header Navigation */}
      <Header
        language={language}
        setLanguage={setLanguage}
        onOpenDirectory={() => setIsDirectoryOpen(true)}
        onReset={handleReset}
      />

      {/* 3. Main Content Container */}
      <main className="main-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-badge">
            <ShieldCheck size={14} />
            <span>{isTamil ? 'சரிபார்க்கப்பட்ட அரசு வழிகாட்டி' : '100% Verified Indian Government Guidance'}</span>
          </div>

          <h1 className="hero-title">
            {isTamil ? 'அரசு சேவைகளை எளிதாகப் புரிந்துகொள்ளுங்கள்' : 'Understand Government Services in Simple Language'}
          </h1>

          <p className="hero-subtitle">
            {isTamil
              ? 'சிக்கலான அதிகாரப்பூர்வ நடைமுறைகளை தெளிவான, எளிமையான வழிகாட்டுதலாக மாற்றுகிறது.'
              : 'Turning complicated official rules into simple, actionable, step-by-step guidance.'}
          </p>
        </section>

        {/* Query Input Section */}
        <QueryInput
          query={query}
          setQuery={setQuery}
          onSubmit={handleQuerySubmit}
          isLoading={isLoading}
          language={language}
        />

        {/* Error Alert Display */}
        {error && (
          <ErrorAlert
            message={error}
            onRetry={() => handleQuerySubmit(query)}
          />
        )}

        {/* Multi-step Loading Indicator */}
        {isLoading && <LoadingState language={language} />}

        {/* Structured Results Display */}
        {resultData && !isLoading && (
          <ResultView
            data={resultData}
            onOpenDirectory={() => setIsDirectoryOpen(true)}
            language={language}
          />
        )}
      </main>

      {/* 4. Verified Services Directory Modal */}
      <ServicesDirectoryModal
        isOpen={isDirectoryOpen}
        onClose={() => setIsDirectoryOpen(false)}
        onSelectService={(sampleQuery) => {
          setQuery(sampleQuery);
          handleQuerySubmit(sampleQuery);
        }}
      />

      {/* 5. Footer */}
      <footer className="app-footer">
        <div>
          <strong>CivicHelp AI</strong> — WeMakeDevs First Commit 2026 Hackathon MVP
        </div>
        <div style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>
          Independent citizen assistance engine. Grounded in authoritative official government portals.
        </div>
      </footer>
    </div>
  );
}
