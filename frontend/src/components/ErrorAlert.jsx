import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorAlert({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="error-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
          <AlertCircle size={20} style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.2rem' }}>
              Connection or Request Error
            </div>
            <div style={{ fontSize: '0.875rem' }}>{message}</div>
          </div>
        </div>

        {onRetry && (
          <button
            type="button"
            className="btn-secondary-sm"
            onClick={onRetry}
            style={{ flexShrink: 0 }}
          >
            <RefreshCw size={14} />
            <span>Retry</span>
          </button>
        )}
      </div>
    </div>
  );
}
