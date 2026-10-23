import {
  BusinessLocation,
  Organization,
  SEOAudit,
  RankScan,
  Review,
  Post,
  Competitor,
  DailyPerformanceMetric,
  DailySearchKeyword,
  Task,
  Report,
  QuestionAnswer,
  ProfileChangeProposal
} from '../../../server/src/types/index.js';

const API_BASE = '/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || `Request failed with status ${res.status}`);
  }
  return json.data;
}

export const api = {
  // Organizations & Locations
  getOrganizations: () => request<Organization[]>('/organizations'),
  getLocations: (orgId: string) => request<BusinessLocation[]>(`/locations?orgId=${orgId}`),
  getLocation: (id: string) => request<BusinessLocation>(`/locations/${id}`),

  // Overview
  getOverview: (locationId: string) => request<{
    location: BusinessLocation;
    kpis: {
      totalImpressions: number;
      impressionsDeltaPct: number;
      customerActions: number;
      actionsDeltaPct: number;
      unansweredReviewsCount: number;
      auditHealthScore: number;
      solv: number;
      arp: number;
      openTasksCount: number;
      publishedPostsCount: number;
    };
    priorityActions: Array<{
      id: string;
      type: string;
      title: string;
      whyItMatters: string;
      evidence: string;
      actionText: string;
      priority: string;
      status: string;
      targetModule: string;
      targetId: string;
    }>;
    recentMetrics: DailyPerformanceMetric[];
  }>(`/overview?locationId=${locationId}`),

  // Profile Management
  updateProfile: (id: string, updates: Partial<BusinessLocation>) =>
    request<BusinessLocation>(`/locations/${id}/profile`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }),
  proposeChange: (id: string, data: { field: string; proposedValue: string; note?: string; submittedBy?: string }) =>
    request<ProfileChangeProposal>(`/locations/${id}/proposals`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getProposals: (id: string) => request<ProfileChangeProposal[]>(`/locations/${id}/proposals`),
  resolveProposal: (proposalId: string, action: 'APPROVE' | 'REJECT', actor?: string) =>
    request<ProfileChangeProposal>(`/proposals/${proposalId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ action, actor })
    }),

  // Local SEO Audit
  getAudit: (id: string) => request<SEOAudit>(`/locations/${id}/audit`),
  runAudit: (id: string) => request<SEOAudit>(`/locations/${id}/audit/run`, { method: 'POST' }),
  convertFindingToTask: (findingId: string, assigneeName?: string) =>
    request<{ taskId: string; findingId: string }>(`/audit-findings/${findingId}/create-task`, {
      method: 'POST',
      body: JSON.stringify({ assigneeName })
    }),

  // Geo-Grid Rankings
  getRankScans: (locationId: string) => request<RankScan[]>(`/locations/${locationId}/rank-scans`),
  getRankScanDetails: (scanId: string) => request<RankScan>(`/rank-scans/${scanId}`),
  runRankScan: (locationId: string, data: { keyword: string; gridDimension: 3 | 5 | 7; radiusKm: number }) =>
    request<RankScan>(`/locations/${locationId}/rank-scans`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Reviews
  getReviews: (locationId: string, filters?: { rating?: number; sentiment?: string; responseStatus?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (filters?.rating) q.set('rating', String(filters.rating));
    if (filters?.sentiment) q.set('sentiment', filters.sentiment);
    if (filters?.responseStatus) q.set('responseStatus', filters.responseStatus);
    if (filters?.search) q.set('search', filters.search);
    return request<Review[]>(`/locations/${locationId}/reviews?${q.toString()}`);
  },
  generateAiReviewDraft: (reviewId: string, tone: 'empathetic' | 'professional' | 'concise' | 'enthusiastic') =>
    request<{ draft: string; reasoning: string }>(`/reviews/${reviewId}/ai-draft`, {
      method: 'POST',
      body: JSON.stringify({ tone })
    }),
  saveReviewDraft: (reviewId: string, replyText: string) =>
    request<Review>(`/reviews/${reviewId}/save-draft`, {
      method: 'POST',
      body: JSON.stringify({ replyText })
    }),
  publishReviewReply: (reviewId: string, replyText: string, authorName?: string) =>
    request<Review>(`/reviews/${reviewId}/publish-reply`, {
      method: 'POST',
      body: JSON.stringify({ replyText, authorName })
    }),
  updateReviewEscalation: (reviewId: string, data: { assignedTo?: string; escalationFlag?: boolean; escalationReason?: string; notes?: string }) =>
    request<Review>(`/reviews/${reviewId}/escalation`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  // Posts
  getPosts: (locationId: string, status?: string) =>
    request<Post[]>(`/locations/${locationId}/posts${status ? `?status=${status}` : ''}`),
  createPost: (locationId: string, data: Partial<Post>) =>
    request<Post>(`/locations/${locationId}/posts`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  publishPost: (postId: string) =>
    request<Post>(`/posts/${postId}/publish`, { method: 'POST' }),
  deletePost: (postId: string) =>
    request<{ success: boolean }>(`/posts/${postId}`, { method: 'DELETE' }),
  getAiPostSuggestions: (locationId: string, objective: string, topic: string) =>
    request<Array<{ title: string; summary: string; ctaType: string; suggestedMedia: string }>>(`/locations/${locationId}/posts/ai-suggestions`, {
      method: 'POST',
      body: JSON.stringify({ objective, topic })
    }),

  // Q&A
  getQna: (locationId: string) => request<QuestionAnswer[]>(`/locations/${locationId}/qna`),
  publishAnswer: (questionId: string, answerText: string, authorName?: string) =>
    request<QuestionAnswer>(`/qna/${questionId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ answerText, authorName })
    }),
  suggestAnswer: (questionId: string) =>
    request<{ suggestedAnswer: string }>(`/qna/${questionId}/suggest-answer`, { method: 'POST' }),

  // Competitors
  getCompetitors: (locationId: string) => request<Competitor[]>(`/locations/${locationId}/competitors`),
  addCompetitor: (locationId: string, data: Partial<Competitor>) =>
    request<Competitor>(`/locations/${locationId}/competitors`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  deleteCompetitor: (id: string) =>
    request<{ success: boolean }>(`/competitors/${id}`, { method: 'DELETE' }),

  // Performance Metrics
  getPerformance: (locationId: string) =>
    request<{
      currentSummary: {
        totalImpressions: number;
        searchImpressions: number;
        mapsImpressions: number;
        websiteClicks: number;
        callClicks: number;
        directionRequests: number;
        bookings: number;
        conversations: number;
      };
      comparisonSummary: {
        impressionsDeltaPct: number;
        websiteClicksDeltaPct: number;
        callClicksDeltaPct: number;
        directionsDeltaPct: number;
      };
      dailySeries: DailyPerformanceMetric[];
      searchKeywords: DailySearchKeyword[];
    }>(`/locations/${locationId}/performance`),

  // Tasks
  getTasks: (filters?: { locationId?: string; orgId?: string; status?: string; priority?: string }) => {
    const q = new URLSearchParams();
    if (filters?.locationId) q.set('locationId', filters.locationId);
    if (filters?.orgId) q.set('orgId', filters.orgId);
    if (filters?.status) q.set('status', filters.status);
    if (filters?.priority) q.set('priority', filters.priority);
    return request<Task[]>(`/tasks?${q.toString()}`);
  },
  createTask: (data: Partial<Task>) =>
    request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateTask: (taskId: string, updates: Partial<Task>) =>
    request<Task>(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }),
  toggleChecklist: (taskId: string, itemId: string) =>
    request<Task>(`/tasks/${taskId}/toggle-checklist`, {
      method: 'POST',
      body: JSON.stringify({ itemId })
    }),
  addTaskComment: (taskId: string, text: string, author?: string) =>
    request<Task>(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text, author })
    }),
  deleteTask: (taskId: string) =>
    request<{ success: boolean }>(`/tasks/${taskId}`, { method: 'DELETE' }),

  // Reports
  getReports: (locationId: string) => request<Report[]>(`/locations/${locationId}/reports`),
  getReport: (reportId: string) => request<Report>(`/reports/${reportId}`),
  generateReport: (locationId: string, data: { title?: string; type?: string; startDate?: string; endDate?: string }) =>
    request<Report>(`/locations/${locationId}/reports/generate`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // AI Assistant
  queryAi: (query: string, locationId: string, history?: any[]) =>
    request<{
      reply: string;
      actionProposals: Array<{
        type: string;
        title: string;
        description: string;
        payload: any;
        requiresConfirmation: boolean;
      }>;
      dataContext?: any;
    }>('/ai/query', {
      method: 'POST',
      body: JSON.stringify({ query, locationId, history })
    }),

  // Integration & OAuth Status
  getIntegrationStatus: () =>
    request<{
      mode: string;
      googleConnected: boolean;
      accountName: string;
      connectedAccountsCount: number;
      locationsSyncedCount: number;
      lastSyncTimestamp: string;
      scopes: string[];
      quotaStatus: {
        dailyQuotaUsed: number;
        dailyQuotaTotal: number;
        rateLimited: boolean;
      };
    }>('/integrations/status')
};
