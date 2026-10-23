import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';
import { Post } from '../../../../server/src/types/index.js';
import {
  Share2,
  Calendar,
  Sparkles,
  Send,
  Plus,
  Trash2,
  Image,
  Tag,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export const PostsModule: React.FC = () => {
  const { currentLocation, locations, showToast } = useApp();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'scheduled' | 'drafts'>('all');

  // Creator form modal
  const [isCreating, setIsCreating] = useState(false);
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [postType, setPostType] = useState<'STANDARD' | 'EVENT' | 'OFFER'>('STANDARD');
  const [summary, setSummary] = useState('');
  const [ctaType, setCtaType] = useState<'LEARN_MORE' | 'ACTION_CALL' | 'BOOK' | 'SIGN_UP' | 'NONE'>('LEARN_MORE');
  const [ctaUrl, setCtaUrl] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [campaignLabel, setCampaignLabel] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [eventTitle, setEventTitle] = useState('');

  // AI Generator state
  const [aiObjective, setAiObjective] = useState<'seasonal_promotion' | 'educational_tip' | 'service_announcement'>('seasonal_promotion');
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ title: string; summary: string; ctaType: string; suggestedMedia: string }>>([]);
  const [generatingAi, setGeneratingAi] = useState(false);

  useEffect(() => {
    if (currentLocation) {
      loadPosts();
      setSelectedLocationIds([currentLocation.id]);
    }
  }, [currentLocation?.id]);

  const loadPosts = async () => {
    if (!currentLocation) return;
    try {
      const res = await api.getPosts(currentLocation.id);
      setPosts(res);
    } catch (err: any) {
      showToast(`Failed to load posts: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAi = async () => {
    if (!currentLocation) return;
    setGeneratingAi(true);
    try {
      const suggestions = await api.getAiPostSuggestions(currentLocation.id, aiObjective, 'Local Campaign');
      setAiSuggestions(suggestions);
    } catch (err: any) {
      showToast(`AI generation failed: ${err.message}`, 'error');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleApplyAiSuggestion = (s: { title: string; summary: string; ctaType: string; suggestedMedia: string }) => {
    setSummary(s.summary);
    setCtaType(s.ctaType as any);
    setMediaUrl(s.suggestedMedia);
    setCampaignLabel(s.title);
    setIsCreating(true);
    showToast('AI draft loaded into composer!');
  };

  const handleCreatePost = async (publishImmediate = false) => {
    if (!currentLocation || !summary.trim() || selectedLocationIds.length === 0) return;
    try {
      const targetLocs = locations.filter((l) => selectedLocationIds.includes(l.id));
      for (const loc of targetLocs) {
        const newPost = await api.createPost(loc.id, {
          postType,
          summary,
          ctaType,
          ctaUrl: ctaUrl || loc.websiteUrl,
          mediaUrl: mediaUrl || undefined,
          campaignLabel: campaignLabel || undefined,
          couponCode: couponCode || undefined,
          eventTitle: eventTitle || undefined,
          status: publishImmediate ? 'PUBLISHED' : scheduledFor ? 'SCHEDULED' : 'DRAFT',
          scheduledFor: scheduledFor || undefined
        });

        if (publishImmediate && newPost.status !== 'PUBLISHED') {
          await api.publishPost(newPost.id);
        }
      }

      showToast(
        publishImmediate
          ? `Post published to ${targetLocs.length} location${targetLocs.length > 1 ? 's' : ''}!`
          : `Post scheduled/drafted for ${targetLocs.length} location${targetLocs.length > 1 ? 's' : ''}!`
      );
      setIsCreating(false);
      resetForm();
      loadPosts();
    } catch (err: any) {
      showToast(`Creation failed: ${err.message}`, 'error');
    }
  };

  const handlePublishExisting = async (postId: string) => {
    try {
      await api.publishPost(postId);
      showToast('Post published to Google Profile!');
      loadPosts();
    } catch (err: any) {
      showToast(`Publishing failed: ${err.message}`, 'error');
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await api.deletePost(postId);
      showToast('Post removed.');
      loadPosts();
    } catch (err: any) {
      showToast(`Delete failed: ${err.message}`, 'error');
    }
  };

  const resetForm = () => {
    setSummary('');
    setCtaUrl('');
    setMediaUrl('');
    setCampaignLabel('');
    setScheduledFor('');
    setCouponCode('');
    setEventTitle('');
  };

  if (!currentLocation) return null;

  const filteredPosts = posts.filter((p) => {
    if (activeTab === 'published') return p.status === 'PUBLISHED';
    if (activeTab === 'scheduled') return p.status === 'SCHEDULED';
    if (activeTab === 'drafts') return p.status === 'DRAFT';
    return true;
  });

  return (
    <div className="d-flex flex-column gap-4">
      {/* Top Banner & Quick Actions */}
      <div className="ops-card p-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h4 className="fw-bold m-0">Google Business Profile Posts & Content Studio</h4>
            <span className="badge badge-demo">Local Posts API v4</span>
          </div>
          <div className="text-muted small mt-1">
            Publish seasonal updates, offers, and events directly into Google Maps and Local Search cards.
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            onClick={() => {
              resetForm();
              setIsCreating(true);
            }}
            className="btn btn-sm btn-primary d-flex align-items-center gap-1"
          >
            <Plus size={14} />
            <span>Create New Post</span>
          </button>
        </div>
      </div>

      {/* AI Content Studio Generator Bar */}
      <div className="ops-card p-4">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3">
          <div className="d-flex align-items-center gap-2">
            <div className="p-1 rounded bg-primary text-white d-flex align-items-center justify-content-center">
              <Sparkles size={16} />
            </div>
            <div>
              <h6 className="fw-bold m-0">AI Local Post Generator</h6>
              <div className="text-muted small">
                Generates high-engagement localized copy matching Google character and CTA rules.
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <select
              className="form-select form-select-sm"
              style={{ width: '220px' }}
              value={aiObjective}
              onChange={(e) => setAiObjective(e.target.value as any)}
            >
              <option value="seasonal_promotion">Seasonal Promotion / Offer</option>
              <option value="educational_tip">Local Dental / Health Tip</option>
              <option value="service_announcement">Service & Tech Spotlight</option>
            </select>
            <button
              onClick={handleGenerateAi}
              disabled={generatingAi}
              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 text-nowrap"
            >
              <Sparkles size={14} />
              <span>{generatingAi ? 'Generating...' : 'Generate 2 Options'}</span>
            </button>
          </div>
        </div>

        {/* AI Options Cards */}
        {aiSuggestions.length > 0 && (
          <div className="row g-3 mt-2">
            {aiSuggestions.map((sug, idx) => (
              <div key={idx} className="col-12 col-md-6">
                <div className="p-3 border rounded bg-light h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="fw-bold text-dark small">{sug.title}</span>
                      <span className="badge bg-primary-subtle text-primary small">CTA: {sug.ctaType}</span>
                    </div>
                    <p className="text-secondary small mb-3">"{sug.summary}"</p>
                  </div>
                  <button
                    onClick={() => handleApplyAiSuggestion(sug)}
                    className="btn btn-sm btn-white border bg-white d-flex align-items-center justify-content-center gap-1 w-100"
                  >
                    <span>Load & Schedule in Composer</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Posts Queue Tabs */}
      <div className="d-flex border-bottom gap-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`btn btn-sm py-2 px-3 fw-semibold border-bottom-0 rounded-bottom-0 ${
            activeTab === 'all' ? 'bg-white border text-primary' : 'text-muted'
          }`}
        >
          All Posts ({posts.length})
        </button>
        <button
          onClick={() => setActiveTab('published')}
          className={`btn btn-sm py-2 px-3 fw-semibold border-bottom-0 rounded-bottom-0 ${
            activeTab === 'published' ? 'bg-white border text-primary' : 'text-muted'
          }`}
        >
          Published ({posts.filter((p) => p.status === 'PUBLISHED').length})
        </button>
        <button
          onClick={() => setActiveTab('scheduled')}
          className={`btn btn-sm py-2 px-3 fw-semibold border-bottom-0 rounded-bottom-0 ${
            activeTab === 'scheduled' ? 'bg-white border text-primary' : 'text-muted'
          }`}
        >
          Scheduled ({posts.filter((p) => p.status === 'SCHEDULED').length})
        </button>
        <button
          onClick={() => setActiveTab('drafts')}
          className={`btn btn-sm py-2 px-3 fw-semibold border-bottom-0 rounded-bottom-0 ${
            activeTab === 'drafts' ? 'bg-white border text-primary' : 'text-muted'
          }`}
        >
          Drafts ({posts.filter((p) => p.status === 'DRAFT').length})
        </button>
      </div>

      {/* Posts Cards Grid */}
      <div className="row g-3">
        {filteredPosts.map((post) => (
          <div key={post.id} className="col-12 col-md-6 col-lg-4">
            <div className="ops-card h-100 d-flex flex-column overflow-hidden">
              {post.mediaUrl && (
                <div style={{ height: '160px', overflow: 'hidden' }}>
                  <img
                    src={post.mediaUrl}
                    alt="Post Media"
                    className="w-100 h-100 object-fit-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="p-3 d-flex flex-column flex-1 justify-content-between">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="badge bg-secondary-subtle text-secondary small">
                      {post.postType}
                    </span>
                    <span
                      className={`badge ${
                        post.status === 'PUBLISHED'
                          ? 'badge-verified'
                          : post.status === 'SCHEDULED'
                          ? 'badge-high'
                          : 'bg-light text-muted'
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>

                  {post.campaignLabel && (
                    <div className="fw-bold small text-primary mb-1">{post.campaignLabel}</div>
                  )}

                  <p className="text-secondary small mb-3" style={{ lineHeight: '1.4' }}>
                    {post.summary}
                  </p>

                  {post.couponCode && (
                    <div className="p-2 mb-2 bg-light rounded text-center small font-mono border">
                      Code: <strong>{post.couponCode}</strong>
                    </div>
                  )}
                </div>

                <div className="border-top pt-3 d-flex align-items-center justify-content-between">
                  <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
                    {post.status === 'PUBLISHED'
                      ? `Published ${new Date(post.publishedAt || post.createdAt).toLocaleDateString()}`
                      : post.status === 'SCHEDULED'
                      ? `Scheduled for ${new Date(post.scheduledFor || '').toLocaleDateString()}`
                      : 'Saved as draft'}
                  </span>

                  <div className="d-flex align-items-center gap-2">
                    {post.status !== 'PUBLISHED' && (
                      <button
                        onClick={() => handlePublishExisting(post.id)}
                        className="btn btn-sm btn-primary py-1 px-2"
                        style={{ fontSize: '0.75rem' }}
                      >
                        Publish Now
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="btn btn-sm btn-outline-danger py-1 px-2"
                      style={{ fontSize: '0.75rem' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredPosts.length === 0 && (
          <div className="col-12">
            <div className="ops-card p-5 text-center text-muted">
              No posts found in the selected queue.
            </div>
          </div>
        )}
      </div>

      {/* Creator Modal */}
      {isCreating && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Compose Google Business Profile Post</h5>
                <button type="button" className="btn-close" onClick={() => setIsCreating(false)} />
              </div>

              <div className="modal-body d-flex flex-column gap-3">
                {/* Target Locations Selection */}
                {locations.length > 1 && (
                  <div className="p-3 bg-light rounded border">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label small fw-bold mb-0">Publish to Locations ({selectedLocationIds.length} selected):</label>
                      <button
                        type="button"
                        className="btn btn-link p-0 text-decoration-none small"
                        style={{ fontSize: '0.78rem' }}
                        onClick={() => {
                          if (selectedLocationIds.length === locations.length) {
                            setSelectedLocationIds([currentLocation.id]);
                          } else {
                            setSelectedLocationIds(locations.map((l) => l.id));
                          }
                        }}
                      >
                        {selectedLocationIds.length === locations.length ? 'Reset to Current Only' : 'Select All Locations'}
                      </button>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {locations.map((loc) => {
                        const isChecked = selectedLocationIds.includes(loc.id);
                        return (
                          <label
                            key={loc.id}
                            className={`d-flex align-items-center gap-2 px-2.5 py-1.5 rounded border small cursor-pointer ${
                              isChecked ? 'bg-primary-subtle border-primary text-primary fw-semibold' : 'bg-white text-secondary'
                            }`}
                            style={{ cursor: 'pointer' }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedLocationIds([...selectedLocationIds, loc.id]);
                                } else {
                                  if (selectedLocationIds.length > 1) {
                                    setSelectedLocationIds(selectedLocationIds.filter((id) => id !== loc.id));
                                  } else {
                                    showToast('At least one target location must be selected', 'info');
                                  }
                                }
                              }}
                            />
                            <span>{loc.title}</span>
                            <span className="text-muted" style={{ fontSize: '0.72rem' }}>({loc.city})</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold">Post Type</label>
                    <select
                      className="form-select form-select-sm"
                      value={postType}
                      onChange={(e) => setPostType(e.target.value as any)}
                    >
                      <option value="STANDARD">Standard Update</option>
                      <option value="OFFER">Special Offer (with coupon)</option>
                      <option value="EVENT">Event Announcement</option>
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold">Campaign Label</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Autumn Specials"
                      value={campaignLabel}
                      onChange={(e) => setCampaignLabel(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label small fw-semibold mb-0">Post Summary</label>
                    <span className="text-muted small">{summary.length} / 1500 characters</span>
                  </div>
                  <textarea
                    rows={4}
                    className="form-control form-control-sm"
                    placeholder="Write details of your update, news, or offer..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                  />
                </div>

                {postType === 'OFFER' && (
                  <div>
                    <label className="form-label small fw-semibold">Coupon Code (Optional)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. SMILEFALL26"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                  </div>
                )}

                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold">Call to Action (CTA Button)</label>
                    <select
                      className="form-select form-select-sm"
                      value={ctaType}
                      onChange={(e) => setCtaType(e.target.value as any)}
                    >
                      <option value="LEARN_MORE">Learn More</option>
                      <option value="BOOK">Book Online</option>
                      <option value="ACTION_CALL">Call Now</option>
                      <option value="SIGN_UP">Sign Up</option>
                      <option value="NONE">No Button</option>
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold">Destination URL</label>
                    <input
                      type="url"
                      className="form-control form-control-sm"
                      placeholder="https://..."
                      value={ctaUrl}
                      onChange={(e) => setCtaUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label small fw-semibold">Photo / Media Image URL</label>
                  <input
                    type="url"
                    className="form-control form-control-sm"
                    placeholder="https://images.unsplash.com/..."
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label small fw-semibold">Schedule for Future (Optional)</label>
                  <input
                    type="datetime-local"
                    className="form-control form-control-sm"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                  />
                  <div className="form-text text-muted small">
                    Leave blank to save as draft or publish immediately.
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-sm btn-light" onClick={() => setIsCreating(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => handleCreatePost(false)}
                  disabled={!summary.trim()}
                >
                  Save as Draft / Schedule
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => handleCreatePost(true)}
                  disabled={!summary.trim()}
                >
                  Publish Immediately
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
