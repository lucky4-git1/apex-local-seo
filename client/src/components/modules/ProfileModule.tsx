import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';
import { BusinessLocation, ProfileChangeProposal, RegularHoursDay } from '../../../../server/src/types/index.js';
import {
  Building2,
  CheckCircle2,
  Clock,
  Globe,
  Phone,
  Tag,
  FileText,
  AlertTriangle,
  History,
  Send,
  Save,
  RotateCcw,
  Sparkles,
  Plus,
  Trash2,
  ShieldAlert
} from 'lucide-react';

export const ProfileModule: React.FC = () => {
  const { currentLocation, refreshLocation, showToast } = useApp();
  const [formData, setFormData] = useState<Partial<BusinessLocation>>({});
  const [proposals, setProposals] = useState<ProfileChangeProposal[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'hours' | 'services' | 'proposals'>('info');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // New category / service input states
  const [newCategory, setNewCategory] = useState('');
  const [newService, setNewService] = useState('');

  // Proposal modal
  const [proposalField, setProposalField] = useState<string | null>(null);
  const [proposalValue, setProposalValue] = useState('');
  const [proposalNote, setProposalNote] = useState('');

  useEffect(() => {
    if (currentLocation) {
      setFormData(currentLocation);
      setHasUnsavedChanges(false);
      loadProposals();
    }
  }, [currentLocation?.id]);

  const loadProposals = async () => {
    if (!currentLocation) return;
    try {
      const res = await api.getProposals(currentLocation.id);
      setProposals(res);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleFieldChange = (field: keyof BusinessLocation, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    setHasUnsavedChanges(true);
  };

  const handleSaveDirect = async () => {
    if (!currentLocation) return;
    setSaving(true);
    try {
      await api.updateProfile(currentLocation.id, formData);
      await refreshLocation();
      setHasUnsavedChanges(false);
      showToast('Profile updated and synchronized successfully!');
    } catch (err: any) {
      showToast(`Update failed: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitProposal = async () => {
    if (!currentLocation || !proposalField) return;
    try {
      await api.proposeChange(currentLocation.id, {
        field: proposalField,
        proposedValue: proposalValue,
        note: proposalNote,
        submittedBy: 'Local SEO Specialist'
      });
      showToast('Change proposal submitted for review!');
      setProposalField(null);
      setProposalValue('');
      setProposalNote('');
      loadProposals();
    } catch (err: any) {
      showToast(`Proposal failed: ${err.message}`, 'error');
    }
  };

  const handleResolveProposal = async (id: string, action: 'APPROVE' | 'REJECT') => {
    try {
      await api.resolveProposal(id, action);
      showToast(`Proposal ${action === 'APPROVE' ? 'approved and applied' : 'rejected'}!`);
      loadProposals();
      refreshLocation();
    } catch (err: any) {
      showToast(`Action failed: ${err.message}`, 'error');
    }
  };

  if (!currentLocation) return null;

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header bar */}
      <div className="ops-card p-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h4 className="fw-bold m-0">{currentLocation.title}</h4>
            <span className="badge badge-verified">
              <CheckCircle2 size={12} className="me-1" />
              {currentLocation.verificationStatus}
            </span>
            <span className="badge badge-demo">Google Business Profile API v1</span>
          </div>
          <div className="text-muted small mt-1">
            Last Google Sync: {new Date(currentLocation.lastSyncAt).toLocaleString()} • Completeness: {currentLocation.completenessScore}%
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-warning small fw-semibold d-flex align-items-center gap-1">
              <AlertTriangle size={14} />
              Unsaved changes
            </span>
          )}
          <button
            onClick={() => setFormData(currentLocation)}
            disabled={!hasUnsavedChanges || saving}
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
          >
            <RotateCcw size={14} />
            <span>Discard</span>
          </button>
          <button
            onClick={handleSaveDirect}
            disabled={!hasUnsavedChanges || saving}
            className="btn btn-sm btn-primary d-flex align-items-center gap-1"
          >
            <Save size={14} />
            <span>{saving ? 'Syncing...' : 'Save & Sync to Google'}</span>
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="d-flex border-bottom gap-2">
        <button
          onClick={() => setActiveTab('info')}
          className={`btn btn-sm py-2 px-3 fw-semibold border-bottom-0 rounded-bottom-0 ${
            activeTab === 'info' ? 'bg-white border text-primary' : 'text-muted'
          }`}
        >
          Core Business Info
        </button>
        <button
          onClick={() => setActiveTab('hours')}
          className={`btn btn-sm py-2 px-3 fw-semibold border-bottom-0 rounded-bottom-0 ${
            activeTab === 'hours' ? 'bg-white border text-primary' : 'text-muted'
          }`}
        >
          Operating & Special Hours
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`btn btn-sm py-2 px-3 fw-semibold border-bottom-0 rounded-bottom-0 ${
            activeTab === 'services' ? 'bg-white border text-primary' : 'text-muted'
          }`}
        >
          Services & Categories
        </button>
        <button
          onClick={() => setActiveTab('proposals')}
          className={`btn btn-sm py-2 px-3 fw-semibold border-bottom-0 rounded-bottom-0 ${
            activeTab === 'proposals' ? 'bg-white border text-primary' : 'text-muted'
          }`}
        >
          Change Proposal History ({proposals.length})
        </button>
      </div>

      {/* TAB 1: Core Business Info */}
      {activeTab === 'info' && (
        <div className="row g-3">
          <div className="col-12 col-lg-8">
            <div className="ops-card p-4">
              <h6 className="fw-bold mb-3">Core Identity & NAP (Name, Address, Phone)</h6>

              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label small fw-semibold">Business Name (Title)</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={formData.title || ''}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                  />
                  <div className="form-text text-muted small">
                    Must strictly match signage and legal registration per Google guidelines.
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold">Primary Category</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={formData.primaryCategory || ''}
                    onChange={(e) => handleFieldChange('primaryCategory', e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold">Phone Number</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={formData.phoneNumber || ''}
                    onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label small fw-semibold">Destination Website URL</label>
                  <div className="input-group input-group-sm">
                    <input
                      type="url"
                      className="form-control"
                      value={formData.websiteUrl || ''}
                      onChange={(e) => handleFieldChange('websiteUrl', e.target.value)}
                    />
                    <button
                      onClick={() => {
                        setProposalField('website_url');
                        setProposalValue(
                          formData.websiteUrl?.includes('utm_')
                            ? formData.websiteUrl
                            : `${formData.websiteUrl}?utm_source=google&utm_medium=organic&utm_campaign=gbp_local`
                        );
                        setProposalNote('Append standard Google Analytics 4 tracking parameters.');
                      }}
                      className="btn btn-outline-secondary"
                      type="button"
                    >
                      Propose UTM Change
                    </button>
                  </div>
                  <div className="form-text text-muted small">
                    Include UTM tracking tags (?utm_source=google&utm_medium=organic) to isolate GBP traffic.
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label small fw-semibold">Street Address</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={formData.addressLine1 || ''}
                    onChange={(e) => handleFieldChange('addressLine1', e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold">City</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={formData.city || ''}
                    onChange={(e) => handleFieldChange('city', e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold">State / Region</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={formData.state || ''}
                    onChange={(e) => handleFieldChange('state', e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold">Postal Code</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={formData.postalCode || ''}
                    onChange={(e) => handleFieldChange('postalCode', e.target.value)}
                  />
                </div>

                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label small fw-semibold mb-0">Business Description</label>
                    <span className="text-muted small">
                      {formData.description?.length || 0} / 750 characters
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    className="form-control form-control-sm"
                    value={formData.description || ''}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-4">
            <div className="ops-card p-4">
              <h6 className="fw-bold mb-3">Profile Completeness Guide</h6>
              <div className="progress mb-3" style={{ height: 8 }}>
                <div
                  className="progress-bar bg-success"
                  role="progressbar"
                  style={{ width: `${currentLocation.completenessScore}%` }}
                />
              </div>

              <div className="d-flex flex-column gap-2 small">
                <div className="d-flex align-items-center gap-2 text-success">
                  <CheckCircle2 size={16} />
                  <span>NAP Address & Phone verified</span>
                </div>
                <div className="d-flex align-items-center gap-2 text-success">
                  <CheckCircle2 size={16} />
                  <span>Primary category defined</span>
                </div>
                <div className="d-flex align-items-center gap-2 text-success">
                  <CheckCircle2 size={16} />
                  <span>Operating hours complete</span>
                </div>
                <div className="d-flex align-items-center gap-2 text-success">
                  <CheckCircle2 size={16} />
                  <span>{formData.services?.length || 0} clinical services listed</span>
                </div>
                <div className="d-flex align-items-center gap-2 text-warning">
                  <AlertTriangle size={16} />
                  <span>UTM tracking parameters recommended</span>
                </div>
              </div>

              <div className="mt-4 p-3 rounded bg-light border">
                <div className="fw-semibold small text-primary mb-1">Google API Synchronizer</div>
                <div className="text-muted small">
                  Changes saved here are queued directly to Google Business Profile API with an audit diff proposal.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Operating Hours */}
      {activeTab === 'hours' && (
        <div className="ops-card p-4">
          <h6 className="fw-bold mb-3">Regular Operating Hours</h6>
          <div className="table-responsive">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Day of Week</th>
                  <th>Status</th>
                  <th>Open Time</th>
                  <th>Close Time</th>
                </tr>
              </thead>
              <tbody>
                {formData.regularHours?.map((h: RegularHoursDay, idx: number) => (
                  <tr key={h.day}>
                    <td className="fw-bold">{h.day}</td>
                    <td>
                      <span className={`badge ${h.isClosed ? 'bg-secondary' : 'bg-success'}`}>
                        {h.isClosed ? 'Closed' : 'Open'}
                      </span>
                    </td>
                    <td>
                      <input
                        type="time"
                        disabled={h.isClosed}
                        value={h.openTime}
                        onChange={(e) => {
                          const updated = [...(formData.regularHours || [])];
                          updated[idx] = { ...updated[idx], openTime: e.target.value };
                          handleFieldChange('regularHours', updated);
                        }}
                        className="form-control form-control-sm"
                        style={{ width: '130px' }}
                      />
                    </td>
                    <td>
                      <input
                        type="time"
                        disabled={h.isClosed}
                        value={h.closeTime}
                        onChange={(e) => {
                          const updated = [...(formData.regularHours || [])];
                          updated[idx] = { ...updated[idx], closeTime: e.target.value };
                          handleFieldChange('regularHours', updated);
                        }}
                        className="form-control form-control-sm"
                        style={{ width: '130px' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Services & Categories */}
      {activeTab === 'services' && (
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <div className="ops-card p-4">
              <h6 className="fw-bold mb-3">Additional Google Categories</h6>
              <div className="d-flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="e.g. Cosmetic Dentist"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="form-control form-control-sm"
                />
                <button
                  onClick={() => {
                    if (newCategory.trim()) {
                      handleFieldChange('additionalCategories', [
                        ...(formData.additionalCategories || []),
                        newCategory.trim()
                      ]);
                      setNewCategory('');
                    }
                  }}
                  className="btn btn-sm btn-primary"
                >
                  <Plus size={14} /> Add
                </button>
              </div>

              <div className="d-flex flex-wrap gap-2">
                {formData.additionalCategories?.map((cat: string, idx: number) => (
                  <span key={idx} className="badge bg-light text-dark border p-2 d-flex align-items-center gap-2">
                    <span>{cat}</span>
                    <Trash2
                      size={13}
                      className="text-danger cursor-pointer"
                      onClick={() => {
                        const updated = formData.additionalCategories?.filter((_, i) => i !== idx);
                        handleFieldChange('additionalCategories', updated);
                      }}
                    />
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="ops-card p-4">
              <h6 className="fw-bold mb-3">Published Services List</h6>
              <div className="d-flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="e.g. Invisalign Clear Aligners"
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  className="form-control form-control-sm"
                />
                <button
                  onClick={() => {
                    if (newService.trim()) {
                      handleFieldChange('services', [...(formData.services || []), newService.trim()]);
                      setNewService('');
                    }
                  }}
                  className="btn btn-sm btn-primary"
                >
                  <Plus size={14} /> Add
                </button>
              </div>

              <div className="d-flex flex-wrap gap-2">
                {formData.services?.map((svc: string, idx: number) => (
                  <span key={idx} className="badge bg-light text-dark border p-2 d-flex align-items-center gap-2">
                    <span>{svc}</span>
                    <Trash2
                      size={13}
                      className="text-danger cursor-pointer"
                      onClick={() => {
                        const updated = formData.services?.filter((_, i) => i !== idx);
                        handleFieldChange('services', updated);
                      }}
                    />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Proposals History */}
      {activeTab === 'proposals' && (
        <div className="ops-card p-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h6 className="fw-bold m-0">Change Proposal Diff & Approval Queue</h6>
            <button
              onClick={() => {
                setProposalField('description');
                setProposalValue(formData.description || '');
                setProposalNote('Optimized local description incorporating Seattle landmarks.');
              }}
              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
            >
              <Plus size={14} />
              <span>Propose New Change</span>
            </button>
          </div>

          {proposals.length === 0 ? (
            <div className="p-4 text-center text-muted">No change proposals recorded for this location.</div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {proposals.map((prop) => (
                <div key={prop.id} className="p-3 border rounded bg-light">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-primary">{prop.field.toUpperCase()}</span>
                      <span className="small text-muted">Submitted by {prop.submittedBy} on {new Date(prop.createdAt).toLocaleDateString()}</span>
                    </div>
                    <span
                      className={`badge ${
                        prop.status === 'APPROVED' ? 'badge-verified' : prop.status === 'PENDING_REVIEW' ? 'badge-high' : 'bg-secondary'
                      }`}
                    >
                      {prop.status}
                    </span>
                  </div>

                  <div className="row g-2 small mb-2">
                    <div className="col-12 col-md-6">
                      <div className="text-muted fw-semibold">Original Value:</div>
                      <div className="font-mono p-2 bg-white border rounded text-danger text-break">
                        {prop.originalValue || '(empty)'}
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="text-muted fw-semibold">Proposed Value:</div>
                      <div className="font-mono p-2 bg-white border rounded text-success text-break">
                        {prop.proposedValue}
                      </div>
                    </div>
                  </div>

                  {prop.note && <div className="text-muted small italic">Note: {prop.note}</div>}

                  {prop.status === 'PENDING_REVIEW' && (
                    <div className="mt-2 d-flex justify-content-end gap-2">
                      <button
                        onClick={() => handleResolveProposal(prop.id, 'REJECT')}
                        className="btn btn-sm btn-outline-danger"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleResolveProposal(prop.id, 'APPROVE')}
                        className="btn btn-sm btn-success"
                      >
                        Approve & Apply to Profile
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Propose modal */}
      {proposalField && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title fw-bold">Propose Profile Change</h6>
                <button type="button" className="btn-close" onClick={() => setProposalField(null)} />
              </div>
              <div className="modal-body d-flex flex-column gap-3">
                <div>
                  <label className="form-label small fw-semibold">Field Name</label>
                  <input type="text" disabled className="form-control form-control-sm" value={proposalField} />
                </div>
                <div>
                  <label className="form-label small fw-semibold">Proposed Value</label>
                  <textarea
                    rows={3}
                    className="form-control form-control-sm"
                    value={proposalValue}
                    onChange={(e) => setProposalValue(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label small fw-semibold">Reasoning / Note</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Why this change benefits local SEO..."
                    value={proposalNote}
                    onChange={(e) => setProposalNote(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-sm btn-light" onClick={() => setProposalField(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={handleSubmitProposal}
                  disabled={!proposalValue.trim()}
                >
                  Submit Proposal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
