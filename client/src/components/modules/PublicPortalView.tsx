import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Report } from '../../../../server/src/types/index.js';
import {
  Printer,
  Sparkles,
  TrendingUp,
  Award,
  Phone,
  Compass,
  Globe,
  Star,
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';

export const PublicPortalView: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<{
    report: Report;
    location: {
      title: string;
      city: string;
      state: string;
      phoneNumber: string;
      websiteUrl: string;
      primaryCategory: string;
    };
    org: {
      name: string;
      plan: string;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Missing access token.');
      setLoading(false);
      return;
    }

    api.getPublicReport(token)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Report not found or expired.');
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" />
          <div className="text-muted fw-semibold">Loading Verified Client Report...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3">
        <div className="ops-card p-5 text-center max-w-md bg-white border">
          <AlertCircle size={44} className="text-danger mb-3 mx-auto" />
          <h4 className="fw-bold mb-2">Report Access Link Unavailable</h4>
          <p className="text-muted small mb-4">
            {error || 'This client report token is invalid, deactivated, or has expired.'}
          </p>
          <Link to="/" className="btn btn-sm btn-primary">
            Return to Operations Platform
          </Link>
        </div>
      </div>
    );
  }

  const { report, location, org } = data;
  const m = report.metrics;

  return (
    <div className="min-vh-100 bg-light py-4 px-3 px-md-5">
      <div className="container max-w-5xl">
        {/* Printable Card */}
        <div className="ops-card p-4 p-md-5 bg-white border shadow-sm">
          {/* Header */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center border-bottom pb-4 mb-4 gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge badge-verified">Verified Client Report</span>
                <span className="text-muted small">• {org.name}</span>
              </div>
              <h2 className="fw-bold text-dark mb-1">{report.title}</h2>
              <div className="text-secondary small">
                Client Profile: <strong>{location.title}</strong> ({location.city}, {location.state}) • Category:{' '}
                <span className="text-primary fw-semibold">{location.primaryCategory}</span>
              </div>
              <div className="text-muted small mt-1 d-flex align-items-center gap-1">
                <Calendar size={13} />
                <span>
                  Reporting Window: {report.dateRangeStart} to {report.dateRangeEnd}
                </span>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 d-print-none">
              <button
                onClick={() => window.print()}
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5"
              >
                <Printer size={14} />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="mb-4">
            <h5 className="fw-bold text-dark mb-2">Executive Summary</h5>
            <div
              className="p-3.5 rounded bg-light border text-secondary"
              style={{ lineHeight: '1.65', fontSize: '0.92rem' }}
            >
              {report.executiveSummary}
            </div>
          </div>

          {/* KPI Outcome Cards */}
          <div className="mb-4">
            <h5 className="fw-bold text-dark mb-3">Key Performance & Visibility Metrics</h5>
            <div className="row g-3">
              <div className="col-6 col-md-3">
                <div className="p-3 border rounded text-center bg-white">
                  <div className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.72rem' }}>
                    Google Impressions
                  </div>
                  <div className="h3 fw-bold text-dark my-1">{m.totalImpressions?.toLocaleString()}</div>
                  <span className="badge badge-verified">+{m.impressionsChange}% vs prior</span>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <div className="p-3 border rounded text-center bg-white">
                  <div className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.72rem' }}>
                    Website Clicks
                  </div>
                  <div className="h3 fw-bold text-dark my-1">{m.websiteClicks?.toLocaleString()}</div>
                  <span className="badge badge-verified">+{m.websiteClicksChange}% vs prior</span>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <div className="p-3 border rounded text-center bg-white">
                  <div className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.72rem' }}>
                    Direct Calls
                  </div>
                  <div className="h3 fw-bold text-dark my-1">{m.callClicks?.toLocaleString()}</div>
                  <span className="badge badge-verified">+{m.callClicksChange}% vs prior</span>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <div className="p-3 border rounded text-center bg-white">
                  <div className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.72rem' }}>
                    Direction Requests
                  </div>
                  <div className="h3 fw-bold text-dark my-1">{m.directionRequests?.toLocaleString()}</div>
                  <span className="badge badge-verified">+{m.directionRequestsChange}% vs prior</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rankings & Reputation Scorecard */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-6">
              <div className="p-3 border rounded h-100 bg-light-subtle">
                <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-1.5">
                  <TrendingUp size={16} className="text-primary" />
                  <span>Local Search Grid Rankings</span>
                </h6>
                <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <span className="text-secondary small">Average Ranking Position (ARP):</span>
                  <span className="fw-bold text-dark">#{m.averageRank}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <span className="text-secondary small">Share of Local Voice (SoLV):</span>
                  <span className="fw-bold text-success">{m.solv}% in Top 3 Local Pack</span>
                </div>
                <div className="d-flex justify-content-between align-items-center py-2">
                  <span className="text-secondary small">Optimization Tasks Completed:</span>
                  <span className="badge bg-secondary-subtle text-secondary">{m.resolvedTasksCount} Action Items</span>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="p-3 border rounded h-100 bg-light-subtle">
                <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-1.5">
                  <Star size={16} className="text-warning fill-warning" />
                  <span>Reputation & Engagement</span>
                </h6>
                <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <span className="text-secondary small">Average Star Rating:</span>
                  <span className="fw-bold text-dark">⭐ {m.averageReviewRating} / 5.0</span>
                </div>
                <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <span className="text-secondary small">Review Response Rate:</span>
                  <span className="fw-bold text-success">{m.reviewResponseRate}% Responded</span>
                </div>
                <div className="d-flex justify-content-between align-items-center py-2">
                  <span className="text-secondary small">Google Updates Published:</span>
                  <span className="badge bg-primary-subtle text-primary">{m.postsPublished} Live Posts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Strategic Next Steps */}
          {report.recommendations && report.recommendations.length > 0 && (
            <div className="mb-4">
              <h5 className="fw-bold text-dark mb-3">Planned Growth Actions for Next Cycle</h5>
              <div className="d-flex flex-column gap-2">
                {report.recommendations.map((rec, i) => (
                  <div key={i} className="p-3 border rounded bg-white d-flex align-items-start gap-2.5">
                    <CheckCircle2 size={18} className="text-success mt-0.5 flex-shrink-0" />
                    <span className="text-secondary small" style={{ lineHeight: '1.5' }}>
                      {rec}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-top pt-4 mt-5 text-center text-muted small">
            <div>This verified performance report was generated for {location.title} via <strong>{org.name}</strong>.</div>
            <div className="mt-1" style={{ fontSize: '0.72rem' }}>
              Data synchronized via official Google Business Profile APIs & Local Search Indexing.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
