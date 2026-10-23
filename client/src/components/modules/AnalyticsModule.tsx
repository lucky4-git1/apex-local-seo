import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  PhoneCall,
  Navigation,
  Globe,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const AnalyticsModule: React.FC = () => {
  const { currentLocation, showToast } = useApp();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState<'impressions' | 'actions'>('impressions');

  useEffect(() => {
    if (currentLocation) {
      loadAnalytics();
    }
  }, [currentLocation?.id]);

  const loadAnalytics = async () => {
    if (!currentLocation) return;
    try {
      const res = await api.getPerformance(currentLocation.id);
      setData(res);
    } catch (err: any) {
      showToast(`Failed to load performance metrics: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!currentLocation || loading || !data) {
    return (
      <div className="d-flex align-items-center justify-content-center p-5">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  const { currentSummary, comparisonSummary, dailySeries, searchKeywords } = data;

  // Chart configs
  const labels = dailySeries.map((d: any) => d.date.slice(5));

  const impressionsChartData = {
    labels,
    datasets: [
      {
        label: 'Mobile Maps Impressions',
        data: dailySeries.map((d: any) => d.mobileMapsImpressions),
        backgroundColor: '#2563eb',
        borderRadius: 4
      },
      {
        label: 'Mobile Search Impressions',
        data: dailySeries.map((d: any) => d.mobileSearchImpressions),
        backgroundColor: '#38bdf8',
        borderRadius: 4
      },
      {
        label: 'Desktop Maps & Search',
        data: dailySeries.map((d: any) => d.desktopMapsImpressions + d.desktopSearchImpressions),
        backgroundColor: '#94a3b8',
        borderRadius: 4
      }
    ]
  };

  const actionsChartData = {
    labels,
    datasets: [
      {
        label: 'Website Clicks',
        data: dailySeries.map((d: any) => d.websiteClicks),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.35
      },
      {
        label: 'Phone Calls',
        data: dailySeries.map((d: any) => d.callClicks),
        borderColor: '#f59e0b',
        backgroundColor: 'transparent',
        tension: 0.35
      },
      {
        label: 'Directions',
        data: dailySeries.map((d: any) => d.directionRequests),
        borderColor: '#8b5cf6',
        backgroundColor: 'transparent',
        tension: 0.35
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      tooltip: { mode: 'index' as const, intersect: false }
    },
    scales: {
      y: { grid: { color: '#f1f5f9' } },
      x: { grid: { display: false } }
    }
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Top Header */}
      <div className="ops-card p-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h4 className="fw-bold m-0">Google Business Profile Performance Analytics</h4>
            <span className="badge badge-demo">Google Performance API v1</span>
          </div>
          <div className="text-muted small mt-1">
            Verified search appearances and customer engagement actions across Google Maps and Search.
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-light text-secondary border px-3 py-2 small">
            <Calendar size={13} className="me-1" />
            Last 30 Days vs Prior 30 Days
          </span>
        </div>
      </div>

      {/* KPI Delta Cards */}
      <div className="row g-3">
        <div className="col-12 col-md-3">
          <div className="kpi-card">
            <div className="kpi-title">Total Impressions</div>
            <div className="kpi-value">{currentSummary.totalImpressions.toLocaleString()}</div>
            <div className="kpi-trend">
              {comparisonSummary.impressionsDeltaPct >= 0 ? (
                <span className="trend-up d-flex align-items-center gap-1">
                  <ArrowUpRight size={14} /> +{comparisonSummary.impressionsDeltaPct}%
                </span>
              ) : (
                <span className="trend-down d-flex align-items-center gap-1">
                  <ArrowDownRight size={14} /> {comparisonSummary.impressionsDeltaPct}%
                </span>
              )}
              <span className="text-muted small fw-normal ms-1">vs prior period</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="kpi-card">
            <div className="kpi-title">Website Clicks</div>
            <div className="kpi-value">{currentSummary.websiteClicks.toLocaleString()}</div>
            <div className="kpi-trend">
              {comparisonSummary.websiteClicksDeltaPct >= 0 ? (
                <span className="trend-up d-flex align-items-center gap-1">
                  <ArrowUpRight size={14} /> +{comparisonSummary.websiteClicksDeltaPct}%
                </span>
              ) : (
                <span className="trend-down d-flex align-items-center gap-1">
                  <ArrowDownRight size={14} /> {comparisonSummary.websiteClicksDeltaPct}%
                </span>
              )}
              <span className="text-muted small fw-normal ms-1">vs prior period</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="kpi-card">
            <div className="kpi-title">Direct Call Clicks</div>
            <div className="kpi-value">{currentSummary.callClicks.toLocaleString()}</div>
            <div className="kpi-trend">
              {comparisonSummary.callClicksDeltaPct >= 0 ? (
                <span className="trend-up d-flex align-items-center gap-1">
                  <ArrowUpRight size={14} /> +{comparisonSummary.callClicksDeltaPct}%
                </span>
              ) : (
                <span className="trend-down d-flex align-items-center gap-1">
                  <ArrowDownRight size={14} /> {comparisonSummary.callClicksDeltaPct}%
                </span>
              )}
              <span className="text-muted small fw-normal ms-1">vs prior period</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="kpi-card">
            <div className="kpi-title">Direction Requests</div>
            <div className="kpi-value">{currentSummary.directionRequests.toLocaleString()}</div>
            <div className="kpi-trend">
              {comparisonSummary.directionsDeltaPct >= 0 ? (
                <span className="trend-up d-flex align-items-center gap-1">
                  <ArrowUpRight size={14} /> +{comparisonSummary.directionsDeltaPct}%
                </span>
              ) : (
                <span className="trend-down d-flex align-items-center gap-1">
                  <ArrowDownRight size={14} /> {comparisonSummary.directionsDeltaPct}%
                </span>
              )}
              <span className="text-muted small fw-normal ms-1">vs prior period</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Trends Chart */}
      <div className="ops-card p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h6 className="fw-bold m-0">Customer Engagement Time-Series (Last 30 Days)</h6>
            <div className="text-muted small">Daily volume from official Google Business Profile Performance API</div>
          </div>
          <div className="btn-group btn-group-sm">
            <button
              onClick={() => setChartView('impressions')}
              className={`btn ${chartView === 'impressions' ? 'btn-primary' : 'btn-outline-secondary'}`}
            >
              Impressions Breakdown
            </button>
            <button
              onClick={() => setChartView('actions')}
              className={`btn ${chartView === 'actions' ? 'btn-primary' : 'btn-outline-secondary'}`}
            >
              Customer Actions (Clicks & Calls)
            </button>
          </div>
        </div>

        <div style={{ height: '320px' }}>
          {chartView === 'impressions' ? (
            <Bar data={impressionsChartData} options={chartOptions} />
          ) : (
            <Line data={actionsChartData} options={chartOptions} />
          )}
        </div>
      </div>

      {/* Search Keywords Breakdown Table */}
      <div className="ops-card p-4">
        <h6 className="fw-bold mb-3">Top Search Queries Triggering Your Business Profile</h6>
        <div className="table-responsive">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Search Query</th>
                <th>Impressions (Last 30 Days)</th>
                <th>Trend Direction</th>
                <th>Google Platform Placement</th>
              </tr>
            </thead>
            <tbody>
              {searchKeywords.map((k: any, idx: number) => (
                <tr key={idx}>
                  <td className="fw-bold text-dark">"{k.keyword}"</td>
                  <td>{k.impressions.toLocaleString()}</td>
                  <td>
                    <span
                      className={`badge ${
                        k.trend === 'up' ? 'badge-verified' : k.trend === 'down' ? 'badge-urgent' : 'badge-low'
                      }`}
                    >
                      {k.trend.toUpperCase()}
                    </span>
                  </td>
                  <td className="text-muted small">Google Maps & Local 3-Pack</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
