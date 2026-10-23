import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { ProfileService } from '../services/profile.service.js';
import { AuditService } from '../services/audit.service.js';
import { RankingService } from '../services/ranking.service.js';
import { ReviewsService } from '../services/reviews.service.js';
import { PostsService } from '../services/posts.service.js';
import { QnaService } from '../services/qna.service.js';
import { CompetitorsService } from '../services/competitors.service.js';
import { PerformanceService } from '../services/performance.service.js';
import { TasksService } from '../services/tasks.service.js';
import { ReportsService } from '../services/reports.service.js';
import { AiService } from '../services/ai.service.js';

export const apiRouter = Router();

// ==========================================
// 1. ORGANIZATIONS & LOCATIONS
// ==========================================
apiRouter.get('/organizations', (req: Request, res: Response) => {
  const orgs = db.prepare('SELECT * FROM organizations').all() as any[];
  res.json({ success: true, data: orgs });
});

apiRouter.get('/locations', (req: Request, res: Response) => {
  const orgId = (req.query.orgId as string) || 'org-apex-growth';
  const locations = ProfileService.getLocationsByOrg(orgId);
  res.json({ success: true, data: locations });
});

apiRouter.get('/locations/:id', (req: Request, res: Response) => {
  const loc = ProfileService.getLocation(req.params.id);
  if (!loc) return res.status(404).json({ success: false, error: 'Location not found' });
  res.json({ success: true, data: loc });
});

// ==========================================
// 2. EXECUTIVE OVERVIEW
// ==========================================
apiRouter.get('/overview', (req: Request, res: Response) => {
  const locationId = (req.query.locationId as string) || 'loc-apex-dental';
  const loc = ProfileService.getLocation(locationId);
  if (!loc) return res.status(404).json({ success: false, error: 'Location not found' });

  const audit = AuditService.getLatestAudit(locationId);
  const perf = PerformanceService.getMetrics(locationId, 30);
  const scans = RankingService.getScans(locationId);
  const latestScan = scans.length > 0 ? scans[0] : null;

  const unansweredReviews = ReviewsService.getReviews({ locationId, responseStatus: 'UNANSWERED' });
  const openTasks = TasksService.getTasks({ locationId, status: 'todo' });
  const publishedPosts = PostsService.getPosts(locationId, 'PUBLISHED');

  const priorityActions = [
    ...(unansweredReviews.filter(r => r.starRating <= 2).map(r => ({
      id: `act-rev-${r.id}`,
      type: 'review_urgent',
      title: `Unanswered ${r.starRating}-Star Review from ${r.authorName}`,
      whyItMatters: 'Owner replies to negative reviews in under 24 hours protect conversion and signal business active status to Google.',
      evidence: `Customer wrote: "${r.comment.slice(0, 75)}..."`,
      actionText: 'Review and Send Empathetic Response',
      priority: 'urgent',
      status: 'Action Required',
      targetModule: 'reviews',
      targetId: r.id
    }))),
    ...(audit?.findings.filter(f => f.severity === 'critical' || f.severity === 'high').slice(0, 3).map(f => ({
      id: `act-audit-${f.id}`,
      type: 'audit_remediation',
      title: f.title,
      whyItMatters: f.explanation,
      evidence: f.evidence,
      actionText: f.remediation,
      priority: f.severity,
      status: f.status === 'open' ? 'Needs Attention' : 'In Progress',
      targetModule: 'audit',
      targetId: f.id
    })) || [])
  ];

  res.json({
    success: true,
    data: {
      location: loc,
      kpis: {
        totalImpressions: perf.currentSummary.totalImpressions,
        impressionsDeltaPct: perf.comparisonSummary.impressionsDeltaPct,
        customerActions: perf.currentSummary.websiteClicks + perf.currentSummary.callClicks + perf.currentSummary.directionRequests,
        actionsDeltaPct: perf.comparisonSummary.callClicksDeltaPct,
        unansweredReviewsCount: unansweredReviews.length,
        auditHealthScore: audit?.score || 85,
        solv: latestScan?.solv || 64.0,
        arp: latestScan?.arp || 2.4,
        openTasksCount: openTasks.length,
        publishedPostsCount: publishedPosts.length
      },
      priorityActions,
      recentMetrics: perf.dailySeries.slice(-7)
    }
  });
});

// ==========================================
// 3. PROFILE MANAGEMENT & PROPOSALS
// ==========================================
apiRouter.patch('/locations/:id/profile', (req: Request, res: Response) => {
  try {
    const updated = ProfileService.updateLocationDirect(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.post('/locations/:id/proposals', (req: Request, res: Response) => {
  try {
    const proposal = ProfileService.proposeChange({
      locationId: req.params.id,
      field: req.body.field,
      proposedValue: req.body.proposedValue,
      submittedBy: req.body.submittedBy || 'Current User',
      note: req.body.note
    });
    res.json({ success: true, data: proposal });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.get('/locations/:id/proposals', (req: Request, res: Response) => {
  const proposals = ProfileService.getProposals(req.params.id);
  res.json({ success: true, data: proposals });
});

apiRouter.post('/proposals/:id/resolve', (req: Request, res: Response) => {
  try {
    const resolved = ProfileService.resolveProposal(req.params.id, req.body.action, req.body.actor || 'Reviewer');
    res.json({ success: true, data: resolved });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// 4. LOCAL SEO AUDIT
// ==========================================
apiRouter.get('/locations/:id/audit', (req: Request, res: Response) => {
  const audit = AuditService.getLatestAudit(req.params.id);
  res.json({ success: true, data: audit });
});

apiRouter.post('/locations/:id/audit/run', (req: Request, res: Response) => {
  try {
    const newAudit = AuditService.runAudit(req.params.id);
    res.json({ success: true, data: newAudit });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.post('/audit-findings/:id/create-task', (req: Request, res: Response) => {
  try {
    const result = AuditService.convertFindingToTask(req.params.id, req.body.assigneeName || 'Local SEO Specialist');
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// 5. GEO-GRID RANKING EXPLORER
// ==========================================
apiRouter.get('/locations/:id/rank-scans', (req: Request, res: Response) => {
  const scans = RankingService.getScans(req.params.id);
  res.json({ success: true, data: scans });
});

apiRouter.get('/rank-scans/:id', (req: Request, res: Response) => {
  const details = RankingService.getScanDetails(req.params.id);
  if (!details) return res.status(404).json({ success: false, error: 'Scan not found' });
  res.json({ success: true, data: details });
});

apiRouter.post('/locations/:id/rank-scans', (req: Request, res: Response) => {
  try {
    const scan = RankingService.runScan({
      locationId: req.params.id,
      keyword: req.body.keyword || 'cosmetic dentist seattle',
      gridDimension: req.body.gridDimension || 5,
      radiusKm: req.body.radiusKm || 5.0
    });
    res.json({ success: true, data: scan });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// 6. REVIEWS & REPUTATION INBOX
// ==========================================
apiRouter.get('/locations/:id/reviews', (req: Request, res: Response) => {
  const reviews = ReviewsService.getReviews({
    locationId: req.params.id,
    rating: req.query.rating ? Number(req.query.rating) : undefined,
    sentiment: req.query.sentiment as any,
    responseStatus: req.query.responseStatus as any,
    search: req.query.search as string
  });
  res.json({ success: true, data: reviews });
});

apiRouter.post('/reviews/:id/ai-draft', (req: Request, res: Response) => {
  try {
    const draft = ReviewsService.generateAiDraft(req.params.id, req.body.tone || 'professional');
    res.json({ success: true, data: draft });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.post('/reviews/:id/save-draft', (req: Request, res: Response) => {
  try {
    const rev = ReviewsService.saveDraft(req.params.id, req.body.replyText);
    res.json({ success: true, data: rev });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.post('/reviews/:id/publish-reply', (req: Request, res: Response) => {
  try {
    const rev = ReviewsService.publishReply(req.params.id, req.body.replyText, req.body.authorName || 'Dr. Miller (Owner)');
    res.json({ success: true, data: rev });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.patch('/reviews/:id/escalation', (req: Request, res: Response) => {
  try {
    const rev = ReviewsService.updateAssignmentAndEscalation(req.params.id, req.body);
    res.json({ success: true, data: rev });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// 7. POSTS & CONTENT STUDIO
// ==========================================
apiRouter.get('/locations/:id/posts', (req: Request, res: Response) => {
  const posts = PostsService.getPosts(req.params.id, req.query.status as string);
  res.json({ success: true, data: posts });
});

apiRouter.post('/locations/:id/posts', (req: Request, res: Response) => {
  try {
    const post = PostsService.createPost({
      ...req.body,
      locationId: req.params.id
    });
    res.json({ success: true, data: post });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.post('/posts/:id/publish', (req: Request, res: Response) => {
  try {
    const post = PostsService.publishPostNow(req.params.id);
    res.json({ success: true, data: post });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.delete('/posts/:id', (req: Request, res: Response) => {
  const deleted = PostsService.deletePost(req.params.id);
  res.json({ success: deleted });
});

apiRouter.post('/locations/:id/posts/ai-suggestions', (req: Request, res: Response) => {
  const suggestions = PostsService.generateAiPostSuggestions({
    locationId: req.params.id,
    objective: req.body.objective || 'seasonal_promotion',
    topic: req.body.topic || 'General promotion'
  });
  res.json({ success: true, data: suggestions });
});

// ==========================================
// 8. Q&A
// ==========================================
apiRouter.get('/locations/:id/qna', (req: Request, res: Response) => {
  const qna = QnaService.getQuestions(req.params.id);
  res.json({ success: true, data: qna });
});

apiRouter.post('/qna/:id/answer', (req: Request, res: Response) => {
  try {
    const ans = QnaService.publishAnswer(req.params.id, req.body.answerText, req.body.authorName || 'Business Owner');
    res.json({ success: true, data: ans });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.post('/qna/:id/suggest-answer', (req: Request, res: Response) => {
  try {
    const suggestion = QnaService.suggestAnswer(req.params.id);
    res.json({ success: true, data: suggestion });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// 9. COMPETITORS
// ==========================================
apiRouter.get('/locations/:id/competitors', (req: Request, res: Response) => {
  const comps = CompetitorsService.getCompetitors(req.params.id);
  res.json({ success: true, data: comps });
});

apiRouter.post('/locations/:id/competitors', (req: Request, res: Response) => {
  try {
    const comp = CompetitorsService.addCompetitor({ ...req.body, locationId: req.params.id });
    res.json({ success: true, data: comp });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.delete('/competitors/:id', (req: Request, res: Response) => {
  const deleted = CompetitorsService.deleteCompetitor(req.params.id);
  res.json({ success: deleted });
});

// ==========================================
// 10. GOOGLE PERFORMANCE METRICS
// ==========================================
apiRouter.get('/locations/:id/performance', (req: Request, res: Response) => {
  const metrics = PerformanceService.getMetrics(req.params.id, 30);
  res.json({ success: true, data: metrics });
});

// ==========================================
// 11. TASK MANAGEMENT
// ==========================================
apiRouter.get('/tasks', (req: Request, res: Response) => {
  const tasks = TasksService.getTasks({
    locationId: req.query.locationId as string,
    orgId: req.query.orgId as string,
    status: req.query.status as string,
    priority: req.query.priority as string
  });
  res.json({ success: true, data: tasks });
});

apiRouter.post('/tasks', (req: Request, res: Response) => {
  try {
    const task = TasksService.createTask(req.body);
    res.json({ success: true, data: task });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.patch('/tasks/:id', (req: Request, res: Response) => {
  try {
    const updated = TasksService.updateTask(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.post('/tasks/:id/toggle-checklist', (req: Request, res: Response) => {
  try {
    const updated = TasksService.toggleChecklistItem(req.params.id, req.body.itemId);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.post('/tasks/:id/comments', (req: Request, res: Response) => {
  try {
    const updated = TasksService.addComment(req.params.id, req.body.author || 'User', req.body.text);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.delete('/tasks/:id', (req: Request, res: Response) => {
  const deleted = TasksService.deleteTask(req.params.id);
  res.json({ success: deleted });
});

// ==========================================
// 12. REPORTS & EXPORTS
// ==========================================
apiRouter.get('/locations/:id/reports', (req: Request, res: Response) => {
  const reports = ReportsService.getReports(req.params.id);
  res.json({ success: true, data: reports });
});

apiRouter.get('/reports/:id', (req: Request, res: Response) => {
  const report = ReportsService.getReport(req.params.id);
  if (!report) return res.status(404).json({ success: false, error: 'Report not found' });
  res.json({ success: true, data: report });
});

apiRouter.post('/locations/:id/reports/generate', (req: Request, res: Response) => {
  try {
    const loc = ProfileService.getLocation(req.params.id);
    if (!loc) return res.status(404).json({ success: false, error: 'Location not found' });

    const report = ReportsService.generateReport({
      orgId: loc.orgId,
      locationId: loc.id,
      title: req.body.title || `Local SEO Performance Report — ${new Date().toLocaleDateString()}`,
      type: req.body.type || 'executive_monthly',
      startDate: req.body.startDate || '2026-09-24',
      endDate: req.body.endDate || '2026-10-23'
    });
    res.json({ success: true, data: report });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.get('/reports/:id/export/csv', (req: Request, res: Response) => {
  try {
    const csv = ReportsService.exportCsv(req.params.id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="local_seo_report_${req.params.id}.csv"`);
    res.send(csv);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// 13. AI COPILOT
// ==========================================
apiRouter.post('/ai/query', async (req: Request, res: Response) => {
  try {
    const { query, locationId, history } = req.body;
    if (!query || !locationId) {
      return res.status(400).json({ success: false, error: 'query and locationId are required' });
    }
    const result = await AiService.processQuery(query, locationId, history);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 14. INTEGRATION STATUS & DEMO MODE
// ==========================================
apiRouter.get('/integrations/status', (req: Request, res: Response) => {
  const isDemo = process.env.DEMO_MODE !== 'false';
  res.json({
    success: true,
    data: {
      mode: isDemo ? 'DEMO_FIXTURES' : 'LIVE_GOOGLE_API',
      googleConnected: true,
      accountName: 'Apex Growth Google Workspace',
      connectedAccountsCount: 1,
      locationsSyncedCount: 2,
      lastSyncTimestamp: new Date(Date.now() - 3600000).toISOString(),
      scopes: [
        'https://www.googleapis.com/auth/business.manage'
      ],
      quotaStatus: {
        dailyQuotaUsed: 284,
        dailyQuotaTotal: 50000,
        rateLimited: false
      }
    }
  });
});
