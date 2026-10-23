import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';
import { Competitor } from '../../../../server/src/types/index.js';
import { Users, Star, MapPin, Plus, Trash2, ArrowUpRight, TrendingUp } from 'lucide-react';

export const CompetitorsModule: React.FC = () => {
  const { currentLocation, showToast } = useApp();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);

  // New competitor form modal
  const [isAdding, setIsAdding] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [rating, setRating] = useState('4.7');
  const [reviewCount, setReviewCount] = useState('200');
  const [primaryCategory, setPrimaryCategory] = useState('Dentist');
  const [distanceKm, setDistanceKm] = useState('1.2');

  useEffect(() => {
    if (currentLocation) {
      loadCompetitors();
    }
  }, [currentLocation?.id]);

  const loadCompetitors = async () => {
    if (!currentLocation) return;
    try {
      const res = await api.getCompetitors(currentLocation.id);
      setCompetitors(res);
    } catch (err: any) {
      showToast(`Failed to load competitors: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompetitor = async () => {
    if (!currentLocation || !businessName.trim()) return;
    try {
      await api.addCompetitor(currentLocation.id, {
        businessName,
        address,
        rating: Number(rating),
        reviewCount: Number(reviewCount),
        primaryCategory,
        estimatedSolv: 45.0,
        targetKeywords: ['dentist seattle', 'cosmetic dentist'],
        distanceKm: Number(distanceKm)
      });
      showToast('Competitor profile added to tracker!');
      setIsAdding(false);
      resetForm();
      loadCompetitors();
    } catch (err: any) {
      showToast(`Failed to add competitor: ${err.message}`, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteCompetitor(id);
      showToast('Competitor removed.');
      loadCompetitors();
    } catch (err: any) {
      showToast(`Delete failed: ${err.message}`, 'error');
    }
  };

  const resetForm = () => {
    setBusinessName('');
    setAddress('');
    setRating('4.7');
    setReviewCount('200');
    setPrimaryCategory('Dentist');
    setDistanceKm('1.2');
  };

  if (!currentLocation) return null;

  return (
    <div className="d-flex flex-column gap-4">
      <div className="ops-card p-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h4 className="fw-bold m-0">Local Competitor Intelligence</h4>
            <span className="badge badge-demo">Observed Local Pack Graph</span>
          </div>
          <div className="text-muted small mt-1">
            Benchmark rating velocity, review count, and estimated Share of Local Voice in your immediate radius.
          </div>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="btn btn-sm btn-primary d-flex align-items-center gap-1"
        >
          <Plus size={14} />
          <span>Track New Competitor</span>
        </button>
      </div>

      {/* Side-by-side Benchmark Table */}
      <div className="ops-card p-4">
        <h6 className="fw-bold mb-3">Competitive Landscape Matrix ({currentLocation.city} Market)</h6>
        <div className="table-responsive">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Business Name</th>
                <th>Distance</th>
                <th>Google Rating</th>
                <th>Review Volume</th>
                <th>Primary Category</th>
                <th>Est. SoLV</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {/* Primary User Business */}
              <tr className="bg-primary bg-opacity-10 fw-semibold">
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary text-white">Your Business</span>
                    <span>{currentLocation.title}</span>
                  </div>
                </td>
                <td>0.0 km (Origin)</td>
                <td>
                  <div className="d-flex align-items-center gap-1 text-warning">
                    <Star size={13} className="fill-warning" />
                    <span>4.8</span>
                  </div>
                </td>
                <td>142 reviews</td>
                <td>{currentLocation.primaryCategory}</td>
                <td>
                  <span className="badge badge-verified">64.0%</span>
                </td>
                <td>
                  <span className="text-muted small">Target Entity</span>
                </td>
              </tr>

              {/* Tracked Competitors */}
              {competitors.map((comp) => (
                <tr key={comp.id}>
                  <td>
                    <div className="fw-bold text-dark">{comp.businessName}</div>
                    <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                      {comp.address}
                    </div>
                  </td>
                  <td>{comp.distanceKm} km</td>
                  <td>
                    <div className="d-flex align-items-center gap-1 text-warning">
                      <Star size={13} className="fill-warning" />
                      <span>{comp.rating}</span>
                    </div>
                  </td>
                  <td>{comp.reviewCount} reviews</td>
                  <td>{comp.primaryCategory}</td>
                  <td>
                    <span
                      className={`badge ${
                        comp.estimatedSolv >= 50 ? 'badge-high' : 'badge-low'
                      }`}
                    >
                      {comp.estimatedSolv}%
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleDelete(comp.id)}
                      className="btn btn-sm btn-outline-danger p-1"
                      title="Remove from tracking"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Competitor Modal */}
      {isAdding && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Track Local Competitor</h5>
                <button type="button" className="btn-close" onClick={() => setIsAdding(false)} />
              </div>
              <div className="modal-body d-flex flex-column gap-3">
                <div>
                  <label className="form-label small fw-semibold">Business Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label small fw-semibold">Address</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Google Rating</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-control form-control-sm"
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Review Count</label>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={reviewCount}
                      onChange={(e) => setReviewCount(e.target.value)}
                    />
                  </div>
                </div>
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Primary Category</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={primaryCategory}
                      onChange={(e) => setPrimaryCategory(e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Distance (km)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-control form-control-sm"
                      value={distanceKm}
                      onChange={(e) => setDistanceKm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-sm btn-light" onClick={() => setIsAdding(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={handleAddCompetitor}
                  disabled={!businessName.trim()}
                >
                  Save Competitor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
