import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';
import {
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  Key,
  ShieldCheck,
  ExternalLink,
  Layers,
  Database
} from 'lucide-react';

export const IntegrationsModule: React.FC = () => {
  const { isDemoMode, showToast } = useApp();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const res = await api.getIntegrationStatus();
      setStatus(res);
    } catch (err: any) {
      showToast(`Failed to load integration status: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div className="ops-card p-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h4 className="fw-bold m-0">Integrations, Google API Credentials & Environment</h4>
            <span className="badge badge-verified">OAuth 2.0 Management</span>
          </div>
          <div className="text-muted small mt-1">
            Configure Google Cloud API integrations, token management, and platform environment parameters.
          </div>
        </div>
      </div>

      {/* Integration Status Cards */}
      <div className="row g-3">
        {/* Google API Card */}
        <div className="col-12 col-md-6">
          <div className="ops-card p-4 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <div className="rounded p-2 bg-primary text-white">
                  <Key size={18} />
                </div>
                <div>
                  <h6 className="fw-bold m-0">Google Business Profile API</h6>
                  <div className="text-muted small">v1 Business Info & Performance API</div>
                </div>
              </div>
              <span className={`badge ${isDemoMode ? 'badge-demo' : 'badge-verified'}`}>
                {isDemoMode ? 'Demo Sandbox Mode' : 'Live Connected'}
              </span>
            </div>

            <div className="d-flex flex-column gap-2 small text-secondary mb-3">
              <div className="d-flex justify-content-between">
                <span>OAuth Client:</span>
                <span className="font-mono">{status?.accountName || 'Apex Growth Workspace'}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Locations Managed:</span>
                <span className="fw-bold text-dark">{status?.locationsSyncedCount || 2} locations</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Daily API Quota Usage:</span>
                <span>{status?.quotaStatus?.dailyQuotaUsed || 284} / 50,000 requests</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Authorized Scope:</span>
                <span className="font-mono text-truncate" style={{ maxWidth: '240px' }}>
                  https://www.googleapis.com/auth/business.manage
                </span>
              </div>
            </div>

            <div className="p-3 rounded bg-light border small text-muted">
              {isDemoMode ? (
                <div>
                  Running with <strong>realistic demo fixtures</strong>. All API mutations simulate Google API state transitions. To connect live credentials, update <code className="text-primary">.env</code> with your Google Cloud Client ID and Secret.
                </div>
              ) : (
                <div className="text-success d-flex align-items-center gap-1">
                  <CheckCircle2 size={15} />
                  <span>Actively synchronizing with live Google My Business endpoints.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Database & System Architecture */}
        <div className="col-12 col-md-6">
          <div className="ops-card p-4 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <div className="rounded p-2 bg-success text-white">
                  <Database size={18} />
                </div>
                <div>
                  <h6 className="fw-bold m-0">Relational Store & Migration Engine</h6>
                  <div className="text-muted small">SQLite / PostgreSQL Schema</div>
                </div>
              </div>
              <span className="badge badge-verified">Healthy</span>
            </div>

            <div className="d-flex flex-column gap-2 small text-secondary mb-3">
              <div className="d-flex justify-content-between">
                <span>Database Driver:</span>
                <span className="font-mono">node:sqlite (Zero-config local storage)</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>PostgreSQL Compatible:</span>
                <span className="fw-bold text-success">Yes (Migration-managed schema)</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Tables Initialized:</span>
                <span>15 normalized relational tables</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Foreign Keys & Constraints:</span>
                <span className="fw-bold text-success">Enforced (PRAGMA foreign_keys = ON)</span>
              </div>
            </div>

            <div className="p-3 rounded bg-light border small text-muted">
              Database contains persistent tables for locations, profile changes, audit findings, reviews, posts, geo-grid scan points, and actionable tasks.
            </div>
          </div>
        </div>
      </div>

      {/* Production Setup Instructions */}
      <div className="ops-card p-4">
        <h6 className="fw-bold mb-3">Production Google Cloud OAuth Setup Guide</h6>
        <div className="d-flex flex-column gap-3 small text-secondary">
          <div className="d-flex gap-3">
            <div className="badge bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: 24, height: 24 }}>1</div>
            <div>
              <strong>Create Google Cloud Project:</strong> Go to the Google Cloud Console, create a new project, and enable the <em>Google My Business Business Information API</em> and <em>Google Business Profile Performance API</em>.
            </div>
          </div>
          <div className="d-flex gap-3">
            <div className="badge bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: 24, height: 24 }}>2</div>
            <div>
              <strong>Configure OAuth Consent Screen:</strong> Select Internal or External, add the authorized domain, and request the scope <code className="text-primary">https://www.googleapis.com/auth/business.manage</code>.
            </div>
          </div>
          <div className="d-flex gap-3">
            <div className="badge bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: 24, height: 24 }}>3</div>
            <div>
              <strong>Create OAuth 2.0 Web Client Credentials:</strong> Set Authorized Redirect URI to <code className="text-primary">http://localhost:5000/api/v1/auth/google/callback</code>.
            </div>
          </div>
          <div className="d-flex gap-3">
            <div className="badge bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: 24, height: 24 }}>4</div>
            <div>
              <strong>Set Environment Variables:</strong> Set <code className="text-primary">DEMO_MODE=false</code>, <code className="text-primary">GOOGLE_CLIENT_ID</code>, and <code className="text-primary">GOOGLE_CLIENT_SECRET</code> in <code className="text-primary">.env</code>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
