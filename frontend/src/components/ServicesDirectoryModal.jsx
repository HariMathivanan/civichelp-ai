import React, { useEffect, useState } from 'react';
import { X, ExternalLink, ShieldCheck, Check } from 'lucide-react';
import { fetchVerifiedServices } from '../services/api';

export default function ServicesDirectoryModal({ isOpen, onClose, onSelectService }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchVerifiedServices()
        .then(data => {
          setServices(data.services || []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load services:', err);
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={22} color="var(--color-verified)" />
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700 }}>
              Curated Verified Services (6 Schemes)
            </h3>
          </div>
          <button
            type="button"
            className="btn-secondary-sm"
            onClick={onClose}
            style={{ padding: '0.35rem 0.6rem' }}
          >
            <X size={16} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          All details are manually verified against primary Indian government portals with active fee revisions (2026).
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-subtle)' }}>
            Loading verified catalog...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {services.map((svc, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.85rem 1rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-bg-surface)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text-main)' }}>
                    {svc.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)', marginTop: '2px' }}>
                    🏛️ {svc.authority} • {svc.fee_summary || 'Official Fee Verified'}
                  </div>
                  {svc.official_url && (
                    <a
                      href={svc.official_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.75rem', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '4px', textDecoration: 'none' }}
                    >
                      <span>{svc.official_url}</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  className="btn-secondary-sm"
                  style={{ flexShrink: 0 }}
                  onClick={() => {
                    onSelectService(`How do I apply for or manage ${svc.title}?`);
                    onClose();
                  }}
                >
                  <span>Ask Question</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
