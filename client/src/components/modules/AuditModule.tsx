import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';
import { SEOAudit, SEOAuditFinding } from '../../../../server/src/types/index.js';
import {
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Filter,
  CheckSquare,
  ShieldCheck,
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';

export const AuditModule: React.FC = () => {
  const { currentLocation, showToast, setIsAiDrawerOpen } = useApp();
  const [audit, setAudit] = useState<SEOAudit | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [creatingTask, setCreatingTask] = useState<string | null>(null);

  const loadAudit = async () => {
    if (!currentLocation) return;
    try {
      const res = await api.getAudit(currentLocation.id);
      setAudit(res);
    } catch (err: any) {
      showToast(`Failed to load audit: ${err.message}`, 'error');
    } finally {
      setLoading(false);
      setRunning(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadAudit();
  }, [currentLocation?.id]);

  const handleRunAudit = async () => {
    if (!currentLocation) return;
    setRunning(true);
    try {
      const res = await api.runAudit(currentLocation.id);
      setAudit(res);
      showToast('12-Point Local SEO Audit completed successfully!');
    } catch (err: any) {
      showToast(`Audit failed: ${err.message}`, 'error');
    } finally {
      setRunning(false);
    }
  };

  const handleCreateTask = async (finding: SEOAuditFinding) => {
    setCreatingTask(finding.id);
    try {
      await api.convertFindingToTask(finding.id, 'Local SEO Specialist');
      showToast('Task created and linked to this audit finding!');
      loadAudit();
    } catch (err: any) {
      showToast(`Task creation failed: ${err.message}`, 'error');
    } finally {
      setCreatingTask(null);
    }
  };

  if (!currentLocation) return null;

  const findings = audit?.findings || [];
  const filteredFindings = findings.filter((f) => {
    if (selectedSeverity !== 'all' && f.severity !== selectedSeverity) return false;
    if (selectedCategory !== 'all' && f.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="d-flex flex-column gap-4">
      {/* Top Banner & Health Score */}
      <div className="ops-card p-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-4">
          <div className="text-center">
            <div className="display-5 fw-bold text-primary">{audit?.score ?? 85}</div>
            <div className="text-muted small fw-semibold">Audit Health Score</div>
          </div>
          <div className="border-start ps-4">
            <div className="d-flex align-items-center gap-2">
              <h5 className="fw-bold m-0">12-Point Evidence-Driven SEO Audit</h5>
              <span className="badge bg-secondary-subtle text-secondary small">
                {findings.length} signals evaluated
              </span>
            </div>
            <div className="text-muted small mt-1">
              Location: <strong>{currentLocation.title}</strong> • Completed{' '}
              {audit?.completedAt ? new Date(audit.completedAt).toLocaleString() : 'Recently'}
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            onClick={handleRunAudit}
            disabled={running}
            className="btn btn-primary btn-sm d-flex align-items-center gap-2"
          >
            <RefreshCw size={14} className={running ? 'spin' : ''} />
            <span>{running ? 'Evaluating Signals...' : 'Run New Audit'}</span>
          </button>
        </div>
      </div>

      {/* Transparent Scoring Formula Banner */}
      <div className="p-3 rounded bg-light border d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
        <div className="d-flex align-items-center gap-2 text-muted small">
          <ShieldCheck size={16} className="text-primary" />
          <span>
            <strong>Transparent Formula:</strong> Score = 100 - (Critical × 15) - (High × 8) - (Medium × 4) - (Low × 1).
            Separate from Google proprietary algorithms.
          </span>
        </div>
        <div className="d-flex align-items-center gap-3 small">
          <span className="text-danger fw-bold">Critical: {audit?.criticalCount || 0}</span>
          <span className="text-warning fw-bold">High: {audit?.highCount || 0}</span>
          <span className="text-primary fw-bold">Medium: {audit?.mediumCount || 0}</span>
          <span className="text-secondary fw-bold">Low: {audit?.lowCount || 0}</span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div className="d-flex align-items-center gap-2">
          <Filter size={15} className="text-muted" />
          <span className="small text-muted fw-semibold">Filter Findings:</span>

          <select
            className="form-select form-select-sm"
            style={{ width: '150px' }}
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            className="form-select form-select-sm"
            style={{ width: '220px' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All 12 Categories</option>
            <option value="business_info_consistency">Business Info Consistency</option>
            <option value="category_relevance">Category Relevance</option>
            <option value="description_and_services">Description & Services</option>
            <option value="reviews_recency_coverage">Reviews Recency & Coverage</option>
            <option value="media_freshness">Media Freshness</option>
            <option value="structured_data">Structured Data</option>
            <option value="duplicate_listings">Duplicate Listings</option>
          </select>
        </div>

        <button
          onClick={() => setIsAiDrawerOpen(true)}
          className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
        >
          <Sparkles size={14} />
          <span>Ask AI to Prioritize Remediation</span>
        </button>
      </div>

      {/* Findings List */}
      <div className="d-flex flex-column gap-3">
        {filteredFindings.map((finding) => (
          <div key={finding.id} className="ops-card p-4">
            <div className="d-flex flex-column flex-md-row align-items-md-start justify-content-between gap-2 mb-2">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span
                  className={`badge ${
                    finding.severity === 'critical'
                      ? 'badge-urgent'
                      : finding.severity === 'high'
                      ? 'badge-high'
                      : finding.severity === 'medium'
                      ? 'badge-medium'
                      : 'badge-low'
                  }`}
                >
                  {finding.severity.toUpperCase()}
                </span>
                <span className="badge bg-light text-secondary border">
                  Category: {finding.category.replace(/_/g, ' ')}
                </span>
                <span className="badge bg-light text-secondary border">
                  Confidence: {finding.confidence.toUpperCase()}
                </span>
                <span
                  className={`badge ${
                    finding.status === 'resolved'
                      ? 'badge-verified'
                      : finding.status === 'in_progress'
                      ? 'bg-warning-subtle text-dark'
                      : 'bg-light text-muted'
                  }`}
                >
                  Status: {finding.status.toUpperCase()}
                </span>
              </div>

              {finding.linkedTaskId ? (
                <span className="badge bg-success-subtle text-success small d-flex align-items-center gap-1">
                  <CheckSquare size={13} />
                  <span>Task Assigned</span>
                </span>
              ) : (
                finding.status !== 'resolved' && (
                  <button
                    disabled={creatingTask === finding.id}
                    onClick={() => handleCreateTask(finding)}
                    className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                  >
                    <CheckSquare size={13} />
                    <span>{creatingTask === finding.id ? 'Creating...' : 'Convert to Task'}</span>
                  </button>
                )
              )}
            </div>

            <h5 className="fw-bold mb-2 text-dark">{finding.title}</h5>

            <div className="p-2 mb-3 bg-light rounded font-mono small text-secondary">
              <strong>Evidence:</strong> {finding.evidence}
            </div>

            <div className="row g-3 small">
              <div className="col-12 col-md-6">
                <div className="text-muted fw-semibold mb-1">Impact & Explanation:</div>
                <div className="text-secondary">{finding.explanation}</div>
              </div>
              <div className="col-12 col-md-6">
                <div className="text-muted fw-semibold mb-1">Recommended Remediation:</div>
                <div className="text-secondary">{finding.remediation}</div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-top d-flex align-items-center justify-content-between text-muted small">
              <div>
                Data Source: <strong>{finding.dataSource}</strong> • Effort: <strong>{finding.estimatedEffort.toUpperCase()}</strong>
              </div>
              <div>Detected: {finding.dateDetected}</div>
            </div>
          </div>
        ))}

        {filteredFindings.length === 0 && (
          <div className="ops-card p-5 text-center text-muted">
            No audit findings match the selected filters.
          </div>
        )}
      </div>
    </div>
  );
};
