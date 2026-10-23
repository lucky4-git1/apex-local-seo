import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';
import { Review } from '../../../../server/src/types/index.js';
import {
  MessageSquare,
  Star,
  Sparkles,
  Send,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  ShieldAlert,
  Clock,
  UserCheck,
  Edit3
} from 'lucide-react';

export const ReviewsModule: React.FC = () => {
  const { currentLocation, showToast } = useApp();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected review for details & drafting
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [draftReplyText, setDraftReplyText] = useState('');
  const [selectedTone, setSelectedTone] = useState<'empathetic' | 'professional' | 'concise' | 'enthusiastic'>('professional');
  const [draftingAi, setDraftingAi] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (currentLocation) {
      loadReviews();
    }
  }, [currentLocation?.id, ratingFilter, statusFilter]);

  const loadReviews = async () => {
    if (!currentLocation) return;
    try {
      const res = await api.getReviews(currentLocation.id, {
        rating: ratingFilter !== 'all' ? Number(ratingFilter) : undefined,
        responseStatus: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery || undefined
      });
      setReviews(res);
      if (res.length > 0 && !selectedReview) {
        setSelectedReview(res[0]);
        setDraftReplyText(res[0].replyText || '');
      }
    } catch (err: any) {
      showToast(`Failed to load reviews: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReview = (rev: Review) => {
    setSelectedReview(rev);
    setDraftReplyText(rev.replyText || '');
  };

  const handleGenerateAiDraft = async (tone: 'empathetic' | 'professional' | 'concise' | 'enthusiastic') => {
    if (!selectedReview) return;
    setSelectedTone(tone);
    setDraftingAi(true);
    try {
      const res = await api.generateAiReviewDraft(selectedReview.id, tone);
      setDraftReplyText(res.draft);
      showToast(`AI response drafted with ${tone} tone!`);
      loadReviews();
    } catch (err: any) {
      showToast(`AI draft failed: ${err.message}`, 'error');
    } finally {
      setDraftingAi(false);
    }
  };

  const handlePublishReply = async () => {
    if (!selectedReview || !draftReplyText.trim()) return;
    setPublishing(true);
    try {
      await api.publishReviewReply(selectedReview.id, draftReplyText, 'Dr. Miller (Owner)');
      showToast('Reply published successfully to Google Business Profile!');
      await loadReviews();
      setSelectedReview((prev) => (prev ? { ...prev, responseStatus: 'PUBLISHED', replyText: draftReplyText } : null));
    } catch (err: any) {
      showToast(`Publishing failed: ${err.message}`, 'error');
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveDraftOnly = async () => {
    if (!selectedReview) return;
    try {
      await api.saveReviewDraft(selectedReview.id, draftReplyText);
      showToast('Draft saved locally.');
      loadReviews();
    } catch (err: any) {
      showToast(`Save draft failed: ${err.message}`, 'error');
    }
  };

  if (!currentLocation) return null;

  const unansweredCount = reviews.filter((r) => r.responseStatus === 'UNANSWERED').length;

  return (
    <div className="d-flex flex-column gap-4">
      {/* Top Overview & Filter Bar */}
      <div className="ops-card p-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h4 className="fw-bold m-0">Reviews & Reputation Management</h4>
            <span className={`badge ${unansweredCount > 0 ? 'badge-urgent' : 'badge-verified'}`}>
              {unansweredCount > 0 ? `${unansweredCount} Unanswered` : '100% Responded'}
            </span>
          </div>
          <div className="text-muted small mt-1">
            Google Reviews API Integration • Active business: <strong>{currentLocation.title}</strong>
          </div>
        </div>

        {/* Quick Filter Pill Buttons */}
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter('UNANSWERED')}
            className={`btn btn-sm ${statusFilter === 'UNANSWERED' ? 'btn-danger' : 'btn-outline-secondary'}`}
          >
            Needs Response ({reviews.filter((r) => r.responseStatus === 'UNANSWERED').length})
          </button>
          <button
            onClick={() => setRatingFilter('1')}
            className={`btn btn-sm ${ratingFilter === '1' ? 'btn-danger' : 'btn-outline-secondary'}`}
          >
            1-Star
          </button>
          <button
            onClick={() => {
              setRatingFilter('all');
              setStatusFilter('all');
            }}
            className="btn btn-sm btn-light"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Main Review Inbox Layout */}
      <div className="row g-3">
        {/* Left Review Feed Column */}
        <div className="col-12 col-lg-5">
          <div className="ops-card h-100 d-flex flex-column" style={{ maxHeight: '780px' }}>
            <div className="p-3 border-bottom d-flex align-items-center gap-2">
              <Search size={15} className="text-muted" />
              <input
                type="text"
                placeholder="Search reviews by reviewer or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadReviews()}
                className="form-control form-control-sm border-0 shadow-none p-0"
              />
            </div>

            <div className="flex-1 overflow-y-auto divide-y">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  onClick={() => handleSelectReview(rev)}
                  className={`p-3 border-bottom cursor-pointer transition-all ${
                    selectedReview?.id === rev.id ? 'bg-primary bg-opacity-10 border-start border-primary border-3' : 'hover-bg-light'
                  }`}
                >
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="fw-bold text-dark small">{rev.authorName}</span>
                    <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                      {new Date(rev.reviewDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="d-flex align-items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={13}
                        className={s <= rev.starRating ? 'text-warning fill-warning' : 'text-secondary-subtle'}
                      />
                    ))}
                    {rev.escalationFlag && (
                      <span className="badge badge-urgent ms-2" style={{ fontSize: '0.65rem' }}>
                        Escalated Complaint
                      </span>
                    )}
                  </div>

                  <div className="text-secondary small text-truncate-2" style={{ maxHeight: '2.6em', overflow: 'hidden' }}>
                    "{rev.comment}"
                  </div>

                  <div className="mt-2 d-flex align-items-center justify-content-between">
                    <span
                      className={`badge ${
                        rev.responseStatus === 'PUBLISHED'
                          ? 'badge-verified'
                          : rev.responseStatus === 'DRAFTED'
                          ? 'badge-high'
                          : 'badge-urgent'
                      }`}
                      style={{ fontSize: '0.7rem' }}
                    >
                      {rev.responseStatus === 'PUBLISHED'
                        ? 'Responded'
                        : rev.responseStatus === 'DRAFTED'
                        ? 'Draft Ready'
                        : 'Unanswered'}
                    </span>
                    {rev.assignedTo && (
                      <span className="text-muted small" style={{ fontSize: '0.7rem' }}>
                        Assigned: {rev.assignedTo}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {reviews.length === 0 && (
                <div className="p-4 text-center text-muted">No reviews matching the active filters.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Detail & AI Responder Column */}
        <div className="col-12 col-lg-7">
          <div className="ops-card h-100 p-4 d-flex flex-column">
            {selectedReview ? (
              <div className="d-flex flex-column gap-3">
                {/* Review Header Details */}
                <div className="p-3 rounded bg-light border">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div>
                      <h5 className="fw-bold m-0">{selectedReview.authorName}</h5>
                      <div className="d-flex align-items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={16}
                            className={s <= selectedReview.starRating ? 'text-warning fill-warning' : 'text-secondary-subtle'}
                          />
                        ))}
                        <span className="text-muted small ms-2">
                          {new Date(selectedReview.reviewDate).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="d-flex flex-column align-items-end gap-1">
                      <span
                        className={`badge ${
                          selectedReview.responseStatus === 'PUBLISHED'
                            ? 'badge-verified'
                            : selectedReview.responseStatus === 'DRAFTED'
                            ? 'badge-high'
                            : 'badge-urgent'
                        }`}
                      >
                        {selectedReview.responseStatus}
                      </span>
                      {selectedReview.escalationFlag && (
                        <span className="badge badge-urgent">Priority Escalation</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 p-3 bg-white rounded border text-dark font-monospace small">
                    "{selectedReview.comment}"
                  </div>

                  {selectedReview.escalationReason && (
                    <div className="mt-2 text-danger small d-flex align-items-center gap-1">
                      <AlertTriangle size={14} />
                      <span>{selectedReview.escalationReason}</span>
                    </div>
                  )}
                </div>

                {/* Published Reply if exists */}
                {selectedReview.responseStatus === 'PUBLISHED' && selectedReview.replyText && (
                  <div className="p-3 rounded bg-success bg-opacity-10 border border-success border-opacity-25">
                    <div className="d-flex align-items-center gap-2 mb-1 text-success fw-bold small">
                      <CheckCircle2 size={16} />
                      <span>Published Google Business Profile Owner Response</span>
                    </div>
                    <div className="text-dark small">{selectedReview.replyText}</div>
                    <div className="text-muted small mt-2">
                      Replied by {selectedReview.replyAuthor} on{' '}
                      {selectedReview.replyDate ? new Date(selectedReview.replyDate).toLocaleString() : 'Recently'}
                    </div>
                  </div>
                )}

                {/* AI Review Responder Studio */}
                <div className="p-3 rounded border bg-white d-flex flex-column gap-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <Sparkles size={18} className="text-primary" />
                      <span className="fw-bold text-dark small">AI Review Response Assistant</span>
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      <span className="text-muted small me-1">Generate Tone:</span>
                      <button
                        onClick={() => handleGenerateAiDraft('empathetic')}
                        disabled={draftingAi}
                        className={`btn btn-xs btn-sm py-1 px-2 ${selectedTone === 'empathetic' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        style={{ fontSize: '0.75rem' }}
                      >
                        Empathetic
                      </button>
                      <button
                        onClick={() => handleGenerateAiDraft('professional')}
                        disabled={draftingAi}
                        className={`btn btn-xs btn-sm py-1 px-2 ${selectedTone === 'professional' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        style={{ fontSize: '0.75rem' }}
                      >
                        Professional
                      </button>
                      <button
                        onClick={() => handleGenerateAiDraft('concise')}
                        disabled={draftingAi}
                        className={`btn btn-xs btn-sm py-1 px-2 ${selectedTone === 'concise' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        style={{ fontSize: '0.75rem' }}
                      >
                        Concise
                      </button>
                      <button
                        onClick={() => handleGenerateAiDraft('enthusiastic')}
                        disabled={draftingAi}
                        className={`btn btn-xs btn-sm py-1 px-2 ${selectedTone === 'enthusiastic' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        style={{ fontSize: '0.75rem' }}
                      >
                        Enthusiastic
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="form-label small text-muted fw-semibold mb-1">
                      Proposed Response (Editable Draft)
                    </label>
                    <textarea
                      rows={5}
                      className="form-control form-control-sm font-sans"
                      placeholder="Click an AI tone above or type your customized merchant response..."
                      value={draftReplyText}
                      onChange={(e) => setDraftReplyText(e.target.value)}
                    />
                  </div>

                  {/* Safety Policy & Human Gate Banner */}
                  <div className="p-2 rounded bg-light border small text-muted d-flex align-items-center gap-2">
                    <ShieldAlert size={16} className="text-primary" />
                    <span>
                      <strong>Compliance Guarantee:</strong> Never admits legal fault or discloses medical/private details. Human review required before publishing.
                    </span>
                  </div>

                  <div className="d-flex align-items-center justify-content-end gap-2">
                    <button
                      onClick={handleSaveDraftOnly}
                      disabled={!draftReplyText.trim()}
                      className="btn btn-sm btn-outline-secondary"
                    >
                      Save Draft
                    </button>
                    <button
                      onClick={handlePublishReply}
                      disabled={publishing || !draftReplyText.trim()}
                      className="btn btn-sm btn-primary d-flex align-items-center gap-1"
                    >
                      <Send size={14} />
                      <span>{publishing ? 'Publishing...' : 'Approve & Publish to Google'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center text-center p-5 my-auto text-muted">
                <MessageSquare size={40} className="text-secondary opacity-50 mb-2" />
                <div className="fw-semibold">No Review Selected</div>
                <div className="small">Select a customer review from the inbox to draft a response.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
