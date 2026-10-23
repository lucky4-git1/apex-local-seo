import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';
import { Sparkles, X, Send, CheckCircle2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

interface Proposal {
  type: string;
  title: string;
  description: string;
  payload: any;
  requiresConfirmation: boolean;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  proposals?: Proposal[];
}

export const AiCopilotDrawer: React.FC = () => {
  const { isAiDrawerOpen, setIsAiDrawerOpen, currentLocation, showToast, refreshLocation } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I am your **Local SEO & Google Business Profile Operations Copilot**. I analyze your live profile data, audit findings, customer reviews, and map visibility. Ask me what needs fixing or select a quick workflow below:`
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [executingProposal, setExecutingProposal] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isAiDrawerOpen) {
      scrollToBottom();
    }
  }, [messages, isAiDrawerOpen]);

  if (!isAiDrawerOpen) return null;

  const handleSend = async (queryText?: string) => {
    const text = queryText || inputValue;
    if (!text.trim() || !currentLocation || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const res = await api.queryAi(text, currentLocation.id);
      const assistantMsg: Message = {
        role: 'assistant',
        content: res.reply,
        proposals: res.actionProposals
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Error executing request: ${err.message}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async (proposal: Proposal, idx: number) => {
    if (!currentLocation) return;
    setExecutingProposal(`${proposal.type}-${idx}`);

    try {
      if (proposal.type === 'review_reply') {
        await api.publishReviewReply(proposal.payload.reviewId, proposal.payload.replyText);
        showToast('Reply published successfully to Google Business Profile!');
      } else if (proposal.type === 'task_creation') {
        await api.convertFindingToTask(proposal.payload.findingId, proposal.payload.assigneeName);
        showToast('Remediation task created and linked to audit finding!');
      } else if (proposal.type === 'post_creation') {
        await api.createPost(currentLocation.id, proposal.payload);
        showToast('Post created and scheduled in Studio!');
      }
      await refreshLocation();
    } catch (err: any) {
      showToast(`Action failed: ${err.message}`, 'error');
    } finally {
      setExecutingProposal(null);
    }
  };

  return (
    <>
      <div className="side-drawer-backdrop" onClick={() => setIsAiDrawerOpen(false)} />
      <div className="side-drawer" style={{ width: '560px', height: '100vh', maxHeight: '100vh', overflow: 'hidden' }}>
        {/* Header */}
        <div className="p-3 border-bottom d-flex align-items-center justify-content-between bg-light flex-shrink-0">
          <div className="d-flex align-items-center gap-2">
            <div className="rounded p-1 bg-primary text-white d-flex align-items-center justify-content-center">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="fw-bold small">AI Operations Copilot</div>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                Context: {currentLocation?.title}
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsAiDrawerOpen(false)}
            className="btn btn-sm btn-light border-0 p-1 text-secondary"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message feed - strictly vertical column */}
        <div
          className="d-flex flex-column gap-3 p-3 flex-grow-1"
          style={{ overflowY: 'auto', overflowX: 'hidden' }}
        >
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`p-3 rounded shadow-sm ${
                m.role === 'user'
                  ? 'bg-primary text-white align-self-end ms-auto'
                  : 'bg-white border text-dark align-self-start w-100'
              }`}
              style={{
                maxWidth: m.role === 'user' ? '80%' : '100%',
                fontSize: '0.875rem',
                lineHeight: '1.5',
                wordBreak: 'break-word',
                overflowWrap: 'anywhere'
              }}
            >
              <div
                style={{ whiteSpace: 'pre-line' }}
                dangerouslySetInnerHTML={{
                  __html: m.content
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                }}
              />

              {/* Proposals and Action Cards */}
              {m.proposals && m.proposals.length > 0 && (
                <div className="mt-3 pt-3 border-top border-secondary-subtle d-flex flex-column gap-2">
                  <div className="d-flex align-items-center gap-1 text-muted small fw-semibold">
                    <ShieldCheck size={14} className="text-success" />
                    <span>Action Gates (Human Approval Required)</span>
                  </div>
                  {m.proposals.map((prop, pIdx) => (
                    <div
                      key={pIdx}
                      className="p-2 border rounded bg-light d-flex flex-column gap-1"
                    >
                      <div className="fw-semibold text-primary small">{prop.title}</div>
                      <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                        {prop.description}
                      </div>
                      <div className="mt-1 d-flex justify-content-end">
                        <button
                          disabled={executingProposal !== null}
                          onClick={() => executeAction(prop, pIdx)}
                          className="btn btn-sm btn-primary py-1 px-2 d-flex align-items-center gap-1"
                          style={{ fontSize: '0.75rem' }}
                        >
                          {executingProposal === `${prop.type}-${pIdx}` ? (
                            <span className="spinner-border spinner-border-sm" role="status" />
                          ) : (
                            <>
                              <CheckCircle2 size={13} />
                              <span>Approve & Execute</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="p-3 rounded bg-white border text-secondary small d-flex align-items-center gap-2 w-100">
              <span className="spinner-border spinner-border-sm text-primary" role="status" />
              <span>Analyzing profile data and synthesizing actionable plan...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompts */}
        <div className="p-2 px-3 border-top bg-light flex-shrink-0">
          <div className="text-muted small mb-1" style={{ fontSize: '0.7rem' }}>
            Quick Actions:
          </div>
          <div className="d-flex flex-wrap gap-1">
            <button
              onClick={() => handleSend('Which profile issues should I fix first?')}
              className="btn btn-sm btn-white border bg-white py-1 px-2 text-start text-truncate"
              style={{ fontSize: '0.75rem', maxWidth: '100%' }}
            >
              ⚡ Audit Priority Fixes
            </button>
            <button
              onClick={() => handleSend('Show me unanswered negative reviews and draft responses')}
              className="btn btn-sm btn-white border bg-white py-1 px-2 text-start text-truncate"
              style={{ fontSize: '0.75rem', maxWidth: '100%' }}
            >
              ⭐ Triage Unanswered Reviews
            </button>
            <button
              onClick={() => handleSend('Draft five posts for this month campaign')}
              className="btn btn-sm btn-white border bg-white py-1 px-2 text-start text-truncate"
              style={{ fontSize: '0.75rem', maxWidth: '100%' }}
            >
              📝 Draft Campaign Posts
            </button>
            <button
              onClick={() => handleSend('Explain our current map ranking visibility and SoLV')}
              className="btn btn-sm btn-white border bg-white py-1 px-2 text-start text-truncate"
              style={{ fontSize: '0.75rem', maxWidth: '100%' }}
            >
              📍 Explain Map Rankings (SoLV)
            </button>
          </div>
        </div>

        {/* Input */}
        <div className="p-3 border-top bg-white flex-shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="d-flex align-items-center gap-2"
          >
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Ask anything about this profile, audit, or rankings..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="btn btn-primary btn-sm px-3 d-flex align-items-center justify-content-center"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
};
