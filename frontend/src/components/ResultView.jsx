import React from 'react';
import { Landmark, ShieldCheck, CheckCircle2, AlertTriangle, FileText, Info } from 'lucide-react';
import StepByStep from './StepByStep';
import DocumentsCard from './DocumentsCard';
import FeesAndTimeline from './FeesAndTimeline';
import WarningsCard from './WarningsCard';
import OfficialSources from './OfficialSources';
import ActionChecklist from './ActionChecklist';
import InsufficientInfo from './InsufficientInfo';

export default function ResultView({ data, onOpenDirectory, language = 'en' }) {
  if (!data) return null;

  // Handle out-of-scope / unverified query
  if (data.insufficient_information) {
    return <InsufficientInfo data={data} onOpenDirectory={onOpenDirectory} language={language} />;
  }

  const isTamil = language === 'ta';

  return (
    <div className="results-container">
      {/* Result Header: Problem Understood & Service */}
      <div className="result-header-card">
        <div className="result-badge-row">
          <span className="authority-badge">
            🏛️ {data.authority || 'Government Authority'}
          </span>
          {data.confidence_score && (
            <span className="confidence-badge">
              ✓ {Math.round(data.confidence_score * 100)}% Verified Grounding Match
            </span>
          )}
          {data.gateway_meta?.pii_detected_and_redacted && (
            <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.25)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
              🛡️ PII Redacted
            </span>
          )}
        </div>

        <h2 className="service-title">{data.service_name}</h2>

        <div className="problem-text">
          <strong>{isTamil ? 'புரிந்துகொள்ளப்பட்ட பிரச்சனை:' : 'Problem Understood:'}</strong> {data.problem_understood}
        </div>
      </div>

      {/* Summary Card */}
      <div className="info-card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
        <div className="card-title-row">
          <Info size={20} className="card-icon" />
          <h3 className="card-title">{isTamil ? 'சுருக்கமான விளக்கம்' : 'Plain-Language Summary'}</h3>
        </div>
        <p style={{ fontSize: '1rem', color: 'var(--color-text-main)', lineHeight: 1.6 }}>
          {data.summary}
        </p>

        {data.eligibility && (
          <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            <strong>{isTamil ? 'தகுதி வரம்பு:' : 'Official Eligibility:'}</strong> {data.eligibility}
          </div>
        )}
      </div>

      {/* Fees & Processing Timeline */}
      <FeesAndTimeline fees={data.fees} timeline={data.timeline} language={language} />

      {/* Grid: Documents Required & Step-by-Step Procedure */}
      <div className="details-grid details-grid-2col">
        <DocumentsCard documents={data.required_documents} language={language} />
        <StepByStep steps={data.steps} language={language} />
      </div>

      {/* Interactive Action Checklist */}
      <ActionChecklist items={data.action_checklist} language={language} />

      {/* Warnings & Fraud Advisory */}
      <WarningsCard warnings={data.warnings} language={language} />

      {/* Verified Official Sources Cited */}
      <OfficialSources sources={data.official_sources} language={language} />
    </div>
  );
}
