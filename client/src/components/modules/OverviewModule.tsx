import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  PhoneCall,
  Navigation,
  Globe,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Clock,
  MapPin,
  FileCheck2,
  RefreshCw
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const OverviewModule: React.FC = () => {
  const { currentLocation, setIsAiDrawerOpen, showToast } = useApp();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOverview = async () => {
    if (!currentLocation) return;
    try {
      const res = await api.getOverview(currentLocation.id);
      setData(res);
    } catch (err: any) {
      showToast(`Failed to load overview: ${err.message}`, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadOverview();
  }, [currentLocation?.id]);

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading executive overview...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="alert alert-warning">No overview data available for this location.</div>;
  }

  const kpis = data.kpis;
  const actions = data.priorityActions || [];
  const metrics = data.recentMetrics || [];

  // Chart configuration
  const chartData = {
    labels: metrics.map((m: any) => m.date.slice(5)),
    datasets: [
      {
        label: 'Google Maps Impressions',
        data: metrics.map((m: any) => m.desktopMapsImpressions + m.mobileMapsImpressions),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.08)',
        fill: true,
        tension: 0.35
      },
      {
        label: 'Google Search Impressions',
        data: metrics.map((m: any) => m.desktopSearchImpressions + m.mobileSearchImpressions),
        borderColor: '#10b981',
        backgroundColor: 'transparent',
        borderDash: [4, 4],
        tension: 0.35
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { boxWidth: 12, font: { size: 12 } }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false
      }
    },
    scales: {
      y: {
        grid: { color: '#f1f5f9' },
        ticks: { font: { size: 11 } }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } }
      }
    }
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header section with 5-Question Clarity Banner */}
      <div className="ops-card p-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h4 className="fw-bold m-0">{data.location.title}</h4>
            <span className="badge badge-verified">
              <CheckCircle2 size={12} className="me-1" />
              {data.location.verificationStatus}
            </span>
            <span className="text-muted small">
              Synced {new Date(data.location.lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="text-muted small mt-1">
            {data.location.addressLine1}, {data.location.city}, {data.location.state} {data.location.postalCode} • {data.location.primaryCategory}
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            onClick={() => {
              setRefreshing(true);
              loadOverview();
            }}
            disabled={refreshing}
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
          >
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
            <span>Sync Live</span>
          </button>
          <button
            onClick={() => setIsAiDrawerOpen(true)}
            className="btn btn-sm btn-primary d-flex align-items-center gap-1"
          >
            <Sparkles size={14} />
            <span>Ask AI Copilot</span>
          </button>
        </div>
      </div>

      {/* 5 Questions Executive Status Badges */}
      <div className="row g-3">
        {/* Q1: Health */}
        <div className="col-12 col-md-6 col-lg-3">
          <div className="kpi-card h-100">
            <div className="kpi-title">1. Profile Health</div>
            <div className="d-flex align-items-baseline gap-2">
              <div className="kpi-value">{kpis.auditHealthScore}/100</div>
              <span className={`badge ${kpis.auditHealthScore >= 80 ? 'badge-verified' : 'badge-high'}`}>
                {kpis.auditHealthScore >= 80 ? 'Good' : 'Needs Fixes'}
              </span>
            </div>
            <div className="text-muted small mt-2">
              Completeness score: <strong>{data.location.completenessScore}%</strong>
            </div>
          </div>
        </div>

        {/* Q2: Visibility & SoLV */}
        <div className="col-12 col-md-6 col-lg-3">
          <div className="kpi-card h-100">
            <div className="kpi-title">2. Map Visibility (SoLV)</div>
            <div className="d-flex align-items-baseline gap-2">
              <div className="kpi-value">{kpis.solv}%</div>
              <span className="badge badge-verified">Top 3 Dominance</span>
            </div>
            <div className="text-muted small mt-2">
              Avg Rank Position (ARP): <strong>{kpis.arp}</strong> in 5km grid
            </div>
          </div>
        </div>

        {/* Q3: Unanswered Reviews & Trust */}
        <div className="col-12 col-md-6 col-lg-3">
          <div className="kpi-card h-100">
            <div className="kpi-title">3. Reputation & Reviews</div>
            <div className="d-flex align-items-baseline gap-2">
              <div className="kpi-value">{kpis.unansweredReviewsCount}</div>
              <span className={`badge ${kpis.unansweredReviewsCount > 0 ? 'badge-urgent' : 'badge-verified'}`}>
                {kpis.unansweredReviewsCount > 0 ? 'Urgent Queue' : 'All Answered'}
              </span>
            </div>
            <div className="text-muted small mt-2">
              {kpis.unansweredReviewsCount > 0 ? '1 negative review needing reply' : '100% response coverage'}
            </div>
          </div>
        </div>

        {/* Q4: Customer Engagement Actions */}
        <div className="col-12 col-md-6 col-lg-3">
          <div className="kpi-card h-100">
            <div className="kpi-title">4. Customer Engagement</div>
            <div className="d-flex align-items-baseline gap-2">
              <div className="kpi-value">{kpis.customerActions}</div>
              <span className="kpi-trend trend-up">
                <TrendingUp size={14} />
                +{kpis.actionsDeltaPct}%
              </span>
            </div>
            <div className="text-muted small mt-2">Calls, direction requests & clicks</div>
          </div>
        </div>
      </div>

      {/* Recommended Next Actions Queue */}
      <div className="ops-card">
        <div className="ops-card-header">
          <div className="d-flex align-items-center gap-2">
            <div className="rounded p-1 bg-warning text-dark d-flex align-items-center justify-content-center">
              <AlertTriangle size={16} />
            </div>
            <h6 className="fw-bold m-0">Recommended Next Actions (Priority Queue)</h6>
          </div>
          <span className="badge bg-secondary-subtle text-secondary small">
            {actions.length} Actionable Items
          </span>
        </div>
        <div className="ops-card-body p-0">
          <div className="d-flex flex-column divide-y">
            {actions.map((act: any) => (
              <div
                key={act.id}
                className="p-3 border-bottom d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 hover-bg-light"
              >
                <div className="flex-1">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span
                      className={`badge ${
                        act.priority === 'urgent' || act.priority === 'critical'
                          ? 'badge-urgent'
                          : act.priority === 'high'
                          ? 'badge-high'
                          : 'badge-medium'
                      }`}
                    >
                      {act.priority.toUpperCase()}
                    </span>
                    <span className="fw-bold text-dark">{act.title}</span>
                  </div>
                  <div className="text-muted small mb-1">{act.whyItMatters}</div>
                  <div className="text-secondary small font-mono bg-light px-2 py-1 rounded d-inline-block">
                    Evidence: {act.evidence}
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button
                    onClick={() => {
                      if (act.targetModule === 'reviews') navigate('/reviews');
                      else if (act.targetModule === 'audit') navigate('/audit');
                      else navigate('/tasks');
                    }}
                    className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1 text-nowrap"
                  >
                    <span>{act.actionText}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Engagement Chart & Quick Summary Grid */}
      <div className="row g-3">
        <div className="col-12 col-lg-8">
          <div className="ops-card h-100">
            <div className="ops-card-header">
              <div>
                <h6 className="fw-bold m-0">Customer Discovery Trends (Google Maps vs Search)</h6>
                <div className="text-muted small">Daily impression velocity over the past 7 days</div>
              </div>
              <button onClick={() => navigate('/analytics')} className="btn btn-sm btn-link text-decoration-none">
                Full Analytics &rarr;
              </button>
            </div>
            <div className="ops-card-body" style={{ height: '280px' }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="ops-card h-100">
            <div className="ops-card-header">
              <h6 className="fw-bold m-0">Operational Workflow Status</h6>
            </div>
            <div className="ops-card-body d-flex flex-column gap-3">
              <div className="d-flex align-items-center justify-content-between p-2 rounded bg-light">
                <div className="d-flex align-items-center gap-2">
                  <Clock size={16} className="text-primary" />
                  <span className="small fw-medium">Open Tasks</span>
                </div>
                <span className="badge bg-primary rounded-pill">{kpis.openTasksCount}</span>
              </div>

              <div className="d-flex align-items-center justify-content-between p-2 rounded bg-light">
                <div className="d-flex align-items-center gap-2">
                  <FileCheck2 size={16} className="text-success" />
                  <span className="small fw-medium">Published Posts</span>
                </div>
                <span className="badge bg-success rounded-pill">{kpis.publishedPostsCount}</span>
              </div>

              <div className="d-flex align-items-center justify-content-between p-2 rounded bg-light">
                <div className="d-flex align-items-center gap-2">
                  <MapPin size={16} className="text-warning" />
                  <span className="small fw-medium">Tracked Keywords</span>
                </div>
                <span className="badge bg-secondary rounded-pill">6 Keywords</span>
              </div>

              <div className="mt-auto p-3 rounded border border-primary border-opacity-25 bg-primary bg-opacity-10">
                <div className="fw-semibold text-primary small d-flex align-items-center gap-1">
                  <Sparkles size={14} />
                  <span>Proactive SEO Copilot Recommendation</span>
                </div>
                <div className="text-dark small mt-1">
                  Responding to the 1-star review and publishing 1 post this week will push your local pack visibility past 70% SoLV.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
