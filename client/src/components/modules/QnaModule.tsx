import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';
import { QuestionAnswer } from '../../../../server/src/types/index.js';
import { HelpCircle, Sparkles, Send, CheckCircle2, Clock } from 'lucide-react';

export const QnaModule: React.FC = () => {
  const { currentLocation, showToast } = useApp();
  const [qnaList, setQnaList] = useState<QuestionAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQna, setSelectedQna] = useState<QuestionAnswer | null>(null);
  const [answerDraft, setAnswerDraft] = useState('');
  const [answering, setAnswering] = useState(false);

  useEffect(() => {
    if (currentLocation) {
      loadQna();
    }
  }, [currentLocation?.id]);

  const loadQna = async () => {
    if (!currentLocation) return;
    try {
      const res = await api.getQna(currentLocation.id);
      setQnaList(res);
      if (res.length > 0) {
        setSelectedQna(res[0]);
        setAnswerDraft(res[0].answerText || '');
      }
    } catch (err: any) {
      showToast(`Failed to load Q&A: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestAnswer = async () => {
    if (!selectedQna) return;
    try {
      const res = await api.suggestAnswer(selectedQna.id);
      setAnswerDraft(res.suggestedAnswer);
      showToast('AI suggested answer drafted!');
    } catch (err: any) {
      showToast(`AI suggestion failed: ${err.message}`, 'error');
    }
  };

  const handlePublishAnswer = async () => {
    if (!selectedQna || !answerDraft.trim()) return;
    setAnswering(true);
    try {
      await api.publishAnswer(selectedQna.id, answerDraft, 'Apex Dental Care Team');
      showToast('Answer published to Google Business Profile!');
      loadQna();
    } catch (err: any) {
      showToast(`Publishing failed: ${err.message}`, 'error');
    } finally {
      setAnswering(false);
    }
  };

  if (!currentLocation) return null;

  return (
    <div className="d-flex flex-column gap-4">
      <div className="ops-card p-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h4 className="fw-bold m-0">Customer Q&A (Google Maps Questions)</h4>
            <span className="badge badge-demo">Google My Business Q&A Feed</span>
          </div>
          <div className="text-muted small mt-1">
            Answer questions asked by prospective patients directly on your Google search listing.
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-5">
          <div className="ops-card h-100 divide-y">
            <div className="p-3 border-bottom fw-bold small text-muted">Customer Inquiries</div>
            {qnaList.map((q) => (
              <div
                key={q.id}
                onClick={() => {
                  setSelectedQna(q);
                  setAnswerDraft(q.answerText || '');
                }}
                className={`p-3 border-bottom cursor-pointer ${
                  selectedQna?.id === q.id ? 'bg-primary bg-opacity-10 border-start border-primary border-3' : 'hover-bg-light'
                }`}
              >
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <span className="fw-semibold text-dark small">{q.authorName}</span>
                  <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                    {new Date(q.createTime).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-secondary small fw-medium mb-2">"{q.questionText}"</div>
                <div>
                  <span
                    className={`badge ${
                      q.answerStatus === 'PUBLISHED' ? 'badge-verified' : 'badge-urgent'
                    }`}
                  >
                    {q.answerStatus === 'PUBLISHED' ? 'Answered' : 'Needs Answer'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div className="ops-card h-100 p-4">
            {selectedQna ? (
              <div className="d-flex flex-column gap-3">
                <div className="p-3 rounded bg-light border">
                  <div className="text-muted small">Question from {selectedQna.authorName}:</div>
                  <h5 className="fw-bold text-dark mt-1">"{selectedQna.questionText}"</h5>
                  <div className="text-muted small">
                    Received on {new Date(selectedQna.createTime).toLocaleString()}
                  </div>
                </div>

                {selectedQna.answerText && selectedQna.answerStatus === 'PUBLISHED' && (
                  <div className="p-3 rounded bg-success bg-opacity-10 border border-success border-opacity-25">
                    <div className="d-flex align-items-center gap-1 text-success fw-bold small mb-1">
                      <CheckCircle2 size={16} />
                      <span>Published Merchant Answer</span>
                    </div>
                    <div className="text-dark small">{selectedQna.answerText}</div>
                    <div className="text-muted small mt-1">
                      By {selectedQna.answerAuthor} • {selectedQna.answerTime ? new Date(selectedQna.answerTime).toLocaleDateString() : ''}
                    </div>
                  </div>
                )}

                <div className="p-3 rounded border bg-white d-flex flex-column gap-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="fw-bold small">Draft / Update Business Answer</span>
                    <button
                      onClick={handleSuggestAnswer}
                      className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                    >
                      <Sparkles size={14} />
                      <span>Generate AI Suggestion</span>
                    </button>
                  </div>

                  <textarea
                    rows={4}
                    className="form-control form-control-sm"
                    placeholder="Provide a helpful, accurate, public response for customers on Google Maps..."
                    value={answerDraft}
                    onChange={(e) => setAnswerDraft(e.target.value)}
                  />

                  <div className="d-flex justify-content-end">
                    <button
                      onClick={handlePublishAnswer}
                      disabled={answering || !answerDraft.trim()}
                      className="btn btn-sm btn-primary d-flex align-items-center gap-1"
                    >
                      <Send size={14} />
                      <span>{answering ? 'Publishing...' : 'Publish Answer to Google'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 text-center text-muted">Select a customer question to answer.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
