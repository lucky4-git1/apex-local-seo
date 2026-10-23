import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';
import { Report } from '../../../../server/src/types/index.js';
import {
  FileText,
  Download,
  Share2,
  Printer,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Building2
} from 'lucide-react';

export const ReportsModule: React.FC = () => {
  const { currentLocation, currentOrg, showToast } = useApp();
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [sharedUrl, setSharedUrl] = useState<string | null>(null);
  const [isClientPortalMode, setIsClientPortalMode] = useState(false);

  useEffect(() => {
    if (currentLocation) {
      loadReports();
    }
  }, [currentLocation?.id]);

  const loadReports = async () => {
    if (!currentLocation) return;
    try {
      const res = await api.getReports(currentLocation.id);
      setReports(res);
      if (res.length > 0) {
        setSelectedReport(res[0]);
      }
    } catch (err: any) {
      showToast(`Failed to load reports: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!currentLocation) return;
    setGenerating(true);
    try {
      const rep = await api.generateReport(currentLocation.id, {
        title: `Monthly Local Growth Audit & Visibility Report — ${new Date().toLocaleDateString('default', { month: 'long', year: 'numeric' })}`,
        type: 'executive_monthly'
      });
      showToast('Comprehensive report generated successfully!');
      setSelectedReport(rep);
      loadReports();
    } catch (err: any) {
      showToast(`Generation failed: ${err.message}`, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleShareReport = async () => {
    if (!selectedReport) return;
    setSharing(true);
    try {
      const res = await api.createReportShareLink(selectedReport.id);
      const fullUrl = `${window.location.origin}${res.shareUrl}`;
      setSharedUrl(fullUrl);
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(fullUrl);
      }
      showToast('Client Portal link copied to clipboard!');
    } catch (err: any) {
      showToast(`Failed to generate share link: ${err.message}`, 'error');
    } finally {
      setSharing(false);
    }
  };

  const handleExportCsv = () => {
    if (!selectedReport) return;
    window.open(`/api/v1/reports/${selectedReport.id}/export/csv`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  if (!currentLocation) return null;

  return (
    <div className="d-flex flex-column gap-4">
      {/* Top Controls Bar */}
      <div className="ops-card p-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h4 className="fw-bold m-0">Client Reporting & Executive Presentations</h4>
            <span className="badge badge-verified">White-Label Ready</span>
          </div>
          <div className="text-muted small mt-1">
            Produce client-shareable performance summaries demonstrating measurable outcomes and completed work.
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <div className="form-check form-switch me-2">
            <input
              className="form-check-input"
              type="checkbox"
              id="clientPortalSwitch"
              checked={isClientPortalMode}
              onChange={(e) => setIsClientPortalMode(e.target.checked)}
            />
            <label className="form-check-label small fw-semibold" htmlFor="clientPortalSwitch">
              Client Portal View
            </label>
          </div>

          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="btn btn-sm btn-primary d-flex align-items-center gap-1"
          >
            <Sparkles size={14} />
            <span>{generating ? 'Compiling Metrics...' : 'Generate New Report'}</span>
          </button>
        </div>
      </div>

      {/* Report Document View */}
      {selectedReport ? (
        <div className="ops-card p-4 p-md-5 bg-white border">
          {/* White-label Header */}
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between border-bottom pb-4 mb-4 gap-3">
            <div>
              <div className="fw-bold text-primary small text-uppercase letter-spacing-1">
                {currentOrg?.agencyBrandName || 'Apex Growth Marketing Suite'}
              </div>
              <h3 className="fw-bold text-dark mt-1 mb-0">{selectedReport.title}</h3>
              <div className="text-muted small mt-1">
                Prepared for: <strong>{currentLocation.title}</strong> • Reporting Window:{' '}
                {selectedReport.dateRangeStart} to {selectedReport.dateRangeEnd}
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 d-print-none">
              <button
                onClick={handleShareReport}
                disabled={sharing}
                className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                title="Generate tokenized link for client presentation"
              >
                <Share2 size={14} />
                <span>{sharing ? 'Generating Link...' : 'Share Client Link'}</span>
              </button>
              <button onClick={handleExportCsv} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1">
                <Download size={14} />
                <span>Export CSV</span>
              </button>
              <button onClick={handlePrint} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1">
                <Printer size={14} />
                <span>Print / PDF</span>
              </button>
            </div>
          </div>

          {sharedUrl && (
            <div className="alert alert-success d-flex align-items-center justify-content-between p-2.5 mb-4 small d-print-none">
              <div className="d-flex align-items-center gap-2">
                <CheckCircle2 size={16} className="text-success flex-shrink-0" />
                <span>Public Client Share Link: <code className="user-select-all bg-white px-2 py-0.5 rounded border">{sharedUrl}</code></span>
              </div>
              <a href={sharedUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-success py-1 px-3 fw-semibold">
                Open Client Portal
              </a>
            </div>
          )}

          {/* Executive Summary */}
          <div className="mb-4">
            <h6 className="fw-bold text-dark mb-2">Executive Summary</h6>
            <div className="p-3 rounded bg-light border text-secondary" style={{ lineHeight: '1.6' }}>
              {selectedReport.executiveSummary}
            </div>
          </div>

          {/* Key Outcome Metrics Cards */}
          <div className="mb-4">
            <h6 className="fw-bold text-dark mb-3">Measurable Performance & Visibility Outcomes</h6>
            <div className="row g-3">
              <div className="col-6 col-md-3">
                <div className="p-3 border rounded bg-white text-center">
                  <div className="text-muted small fw-semibold text-uppercase">Google Impressions</div>
                  <div className="h3 fw-bold text-dark my-1">
                    {selectedReport.metrics.totalImpressions.toLocaleString()}
                  </div>
                  <span className="badge badge-verified">+{selectedReport.metrics.impressionsChange}% vs prior</span>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <div className="p-3 border rounded bg-white text-center">
                  <div className="text-muted small fw-semibold text-uppercase">Website Clicks</div>
                  <div className="h3 fw-bold text-dark my-1">
                    {selectedReport.metrics.websiteClicks.toLocaleString()}
                  </div>
                  <span className="badge badge-verified">+{selectedReport.metrics.websiteClicksChange}% vs prior</span>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <div className="p-3 border rounded bg-white text-center">
                  <div className="text-muted small fw-semibold text-uppercase">Phone Call Clicks</div>
                  <div className="h3 fw-bold text-dark my-1">
                    {selectedReport.metrics.callClicks.toLocaleString()}
                  </div>
                  <span className="badge badge-verified">+{selectedReport.metrics.callClicksChange}% vs prior</span>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <div className="p-3 border rounded bg-white text-center">
                  <div className="text-muted small fw-semibold text-uppercase">Share of Voice (SoLV)</div>
                  <div className="h3 fw-bold text-success my-1">
                    {selectedReport.metrics.solv}%
                  </div>
                  <span className="badge bg-light text-secondary border">Top 3 Geo-Grid</span>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Progress Completed */}
          <div className="mb-4">
            <h6 className="fw-bold text-dark mb-3">Work Completed & Operational Deliverables</h6>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <div className="p-3 rounded bg-light border h-100">
                  <div className="fw-bold small text-dark mb-2">Reputation & Response Velocity</div>
                  <div className="small text-secondary d-flex flex-column gap-1">
                    <div>• <strong>{selectedReport.metrics.newReviewsCount}</strong> customer reviews managed</div>
                    <div>• <strong>{selectedReport.metrics.reviewResponseRate}%</strong> owner response rate achieved</div>
                    <div>• Average customer star rating: <strong>{selectedReport.metrics.averageReviewRating} / 5.0</strong></div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="p-3 rounded bg-light border h-100">
                  <div className="fw-bold small text-dark mb-2">Publishing & Technical SEO Actions</div>
                  <div className="small text-secondary d-flex flex-column gap-1">
                    <div>• <strong>{selectedReport.metrics.postsPublished}</strong> Google Business Profile updates published</div>
                    <div>• <strong>{selectedReport.metrics.resolvedTasksCount}</strong> priority optimization tasks completed</div>
                    <div>• Average observed rank position: <strong>#{selectedReport.metrics.averageRank}</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Next Actions for Client */}
          <div>
            <h6 className="fw-bold text-dark mb-2">Strategic Next Quarter Priorities</h6>
            <div className="d-flex flex-column gap-2">
              {selectedReport.recommendations.map((rec: string, idx: number) => (
                <div key={idx} className="p-2 border rounded bg-white d-flex align-items-center gap-2 small">
                  <CheckCircle2 size={16} className="text-primary flex-shrink-0" />
                  <span className="text-dark">{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-top pt-4 mt-5 text-center text-muted small">
            Generated by {currentOrg?.agencyBrandName || 'Apex Growth Local SEO Suite'} • Verified official Google Business Profile API data
          </div>
        </div>
      ) : (
        <div className="ops-card p-5 text-center text-muted">
          No reports generated yet. Click "Generate New Report" above to compile one.
        </div>
      )}
    </div>
  );
};
