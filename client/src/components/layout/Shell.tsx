import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Building2,
  FileCheck2,
  MapPin,
  MessageSquare,
  Share2,
  Users,
  BarChart3,
  CheckSquare,
  FileText,
  HelpCircle,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  SlidersHorizontal
} from 'lucide-react';
import { AiCopilotDrawer } from '../modules/AiCopilotDrawer';

export const Shell: React.FC = () => {
  const {
    currentOrg,
    currentLocation,
    locations,
    setCurrentLocation,
    isAiDrawerOpen,
    setIsAiDrawerOpen,
    toast,
    isDemoMode,
    loading
  } = useApp();

  const routerLocation = useLocation();

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading Operations Platform...</span>
          </div>
          <div className="mt-3 fw-semibold text-secondary">Initializing Local SEO Operations Suite...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`position-fixed bottom-0 end-0 m-4 p-3 rounded shadow-lg d-flex align-items-center gap-2 z-3 ${
            toast.type === 'error' ? 'bg-danger text-white' : toast.type === 'info' ? 'bg-info text-dark' : 'bg-success text-white'
          }`}
          style={{ minWidth: '320px', zIndex: 1100 }}
        >
          {toast.type === 'error' ? <AlertTriangle size={18} /> : toast.type === 'info' ? <Info size={18} /> : <CheckCircle2 size={18} />}
          <div className="small fw-medium">{toast.message}</div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="app-sidebar">
        {/* Brand header */}
        <div className="p-3 border-bottom border-secondary border-opacity-25 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <div
              className="d-flex align-items-center justify-content-center rounded"
              style={{ width: '32px', height: '32px', backgroundColor: 'var(--accent-blue)', color: '#fff' }}
            >
              <MapPin size={18} />
            </div>
            <div>
              <div className="fw-bold text-white small" style={{ letterSpacing: '0.02em' }}>
                APEX LOCAL SEO
              </div>
              <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                Operations Platform
              </div>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto py-2">
          <div className="sidebar-section-title">Core Operations</div>
          <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} />
            <span>Overview</span>
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Building2 size={18} />
            <span>Business Profile</span>
          </NavLink>
          <NavLink to="/audit" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <FileCheck2 size={18} />
            <span>Local SEO Audit</span>
          </NavLink>
          <NavLink to="/rankings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <MapPin size={18} />
            <span>Map Rankings (SoLV)</span>
          </NavLink>

          <div className="sidebar-section-title">Engagement & Content</div>
          <NavLink to="/reviews" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <MessageSquare size={18} />
            <span>Reviews & Reputation</span>
          </NavLink>
          <NavLink to="/posts" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Share2 size={18} />
            <span>Posts & Studio</span>
          </NavLink>
          <NavLink to="/qna" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <HelpCircle size={18} />
            <span>Business Q&A</span>
          </NavLink>

          <div className="sidebar-section-title">Intelligence & Workflows</div>
          <NavLink to="/competitors" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Users size={18} />
            <span>Competitor Intel</span>
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <BarChart3 size={18} />
            <span>Google Analytics</span>
          </NavLink>
          <NavLink to="/tasks" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <CheckSquare size={18} />
            <span>Task Management</span>
          </NavLink>
          <NavLink to="/reports" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <FileText size={18} />
            <span>Client Reports</span>
          </NavLink>
          <NavLink to="/integrations" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <SlidersHorizontal size={18} />
            <span>Integrations & API</span>
          </NavLink>
        </div>

        {/* AI Assistant Callout */}
        <div className="p-3 border-top border-secondary border-opacity-25">
          <button
            onClick={() => setIsAiDrawerOpen(true)}
            className="w-100 btn text-start d-flex align-items-center justify-content-between p-2 rounded"
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              color: '#f8fafc'
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <Sparkles size={16} className="text-warning" />
              <span className="small fw-semibold">AI Local Copilot</span>
            </div>
            <span className="badge bg-primary text-white" style={{ fontSize: '0.65rem' }}>
              Action Ready
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="app-main">
        {/* Top bar */}
        <header className="app-topbar">
          <div className="d-flex align-items-center gap-3">
            {/* Location Selector */}
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small fw-medium">Location:</span>
              <select
                className="form-select form-select-sm fw-semibold shadow-none border-secondary-subtle"
                style={{ width: '280px', backgroundColor: '#f8fafc' }}
                value={currentLocation?.id || ''}
                onChange={(e) => {
                  const loc = locations.find((l) => l.id === e.target.value);
                  if (loc) setCurrentLocation(loc);
                }}
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.title} ({loc.city}, {loc.state})
                  </option>
                ))}
              </select>
            </div>

            {/* Mode badge */}
            {isDemoMode ? (
              <span className="badge badge-demo d-inline-flex align-items-center gap-1 px-2 py-1">
                <span className="badge-dot bg-primary rounded-circle" style={{ width: 6, height: 6 }}></span>
                Demo Environment Fixtures
              </span>
            ) : (
              <span className="badge badge-verified d-inline-flex align-items-center gap-1 px-2 py-1">
                <CheckCircle2 size={12} />
                Live Google Profile Connected
              </span>
            )}
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              onClick={() => setIsAiDrawerOpen(true)}
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2"
              title="Open AI Copilot"
            >
              <Sparkles size={15} className="text-warning" />
              <span className="small">Ask Copilot</span>
            </button>

            <div className="d-flex align-items-center gap-2 ms-2 ps-2 border-start">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold small"
                style={{ width: 34, height: 34, backgroundColor: '#3b82f6' }}
              >
                AG
              </div>
              <div className="d-none d-md-block text-start">
                <div className="fw-semibold small lh-1">{currentOrg?.name || 'Apex Marketing'}</div>
                <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                  Agency Pro
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Routed Page Content */}
        <main className="app-content">
          <Outlet />
        </main>
      </div>

      {/* Slide-out AI Operations Copilot Drawer */}
      <AiCopilotDrawer />
    </div>
  );
};
