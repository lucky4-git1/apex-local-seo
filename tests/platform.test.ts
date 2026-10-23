import { describe, it, expect, beforeAll } from 'vitest';
import { initDatabase, db } from '../server/src/db/index.js';
import { AuditService } from '../server/src/services/audit.service.js';
import { ProfileService } from '../server/src/services/profile.service.js';
import { RankingService } from '../server/src/services/ranking.service.js';
import { ReviewsService } from '../server/src/services/reviews.service.js';
import { PostsService } from '../server/src/services/posts.service.js';
import { ReportsService } from '../server/src/services/reports.service.js';
import { AiService } from '../server/src/services/ai.service.js';

describe('Local SEO & Google Business Profile Operations Platform Test Suite', () => {
  beforeAll(() => {
    initDatabase();
  });

  describe('1. Audit Engine & Scoring Rules', () => {
    it('calculates audit score based on transparent formula', () => {
      // Formula: 100 - (15*crit) - (8*high) - (4*med) - (1*low)
      const score1 = AuditService.calculateAuditScore(0, 0, 0, 0);
      expect(score1).toBe(100);

      const score2 = AuditService.calculateAuditScore(1, 2, 1, 3);
      // 100 - (15) - (16) - (4) - (3) = 62
      expect(score2).toBe(62);

      // Clamping test
      const scoreClamped = AuditService.calculateAuditScore(10, 10, 10, 10);
      expect(scoreClamped).toBe(0);
    });

    it('runs a live audit and produces structured findings with evidence', () => {
      const audit = AuditService.runAudit('loc-apex-dental');
      expect(audit).toBeDefined();
      expect(audit.locationId).toBe('loc-apex-dental');
      expect(audit.score).toBeGreaterThanOrEqual(0);
      expect(audit.score).toBeLessThanOrEqual(100);
      expect(audit.findings.length).toBeGreaterThan(0);

      const firstFinding = audit.findings[0];
      expect(firstFinding.evidence).toBeDefined();
      expect(firstFinding.dataSource).toBeDefined();
      expect(firstFinding.remediation).toBeDefined();
    });

    it('converts an audit finding into an actionable task', () => {
      const audit = AuditService.getLatestAudit('loc-apex-dental')!;
      const finding = audit.findings.find((f) => f.status === 'open')!;
      const res = AuditService.convertFindingToTask(finding.id, 'Senior SEO Tech');

      expect(res.taskId).toBeDefined();
      expect(res.findingId).toBe(finding.id);

      // Verify task in DB
      const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(res.taskId) as any;
      expect(task).toBeDefined();
      expect(task.assignee_name).toBe('Senior SEO Tech');
      expect(task.source_category).toBe('Audit');
    });
  });

  describe('2. Business Profile Manager & Change Proposals', () => {
    it('calculates profile completeness based on core applicable fields', () => {
      const loc = ProfileService.getLocation('loc-apex-dental')!;
      const score = ProfileService.calculateCompleteness(loc);
      expect(score).toBeGreaterThan(80);
    });

    it('submits and resolves a profile change proposal with diff preservation', () => {
      const proposal = ProfileService.proposeChange({
        locationId: 'loc-apex-dental',
        field: 'description',
        proposedValue: 'Updated high-converting description for test purposes.',
        submittedBy: 'Audit Bot',
        note: 'Testing proposal lifecycle'
      });

      expect(proposal.id).toBeDefined();
      expect(proposal.status).toBe('PENDING_REVIEW');
      expect(proposal.proposedValue).toBe('Updated high-converting description for test purposes.');

      // Approve proposal
      const resolved = ProfileService.resolveProposal(proposal.id, 'APPROVE', 'Account Manager');
      expect(resolved.status).toBe('APPROVED');

      // Verify change applied to location
      const updatedLoc = ProfileService.getLocation('loc-apex-dental')!;
      expect(updatedLoc.description).toBe('Updated high-converting description for test purposes.');
    });
  });

  describe('3. Geo-Grid Ranking Explorer (ARP, ATRP, SoLV)', () => {
    it('calculates ARP, ATRP, and SoLV metrics accurately across a 5x5 grid', () => {
      const scan = RankingService.runScan({
        locationId: 'loc-apex-dental',
        keyword: 'emergency dentist seattle',
        gridDimension: 5,
        radiusKm: 5.0
      });

      expect(scan.id).toBeDefined();
      expect(scan.totalPoints).toBe(25);
      expect(scan.gridDimension).toBe(5);
      expect(scan.radiusKm).toBe(5.0);

      // Verify metrics
      expect(scan.solv).toBeGreaterThanOrEqual(0);
      expect(scan.solv).toBeLessThanOrEqual(100);
      expect(scan.arp).toBeGreaterThanOrEqual(1.0);
      expect(scan.atrp).toBeGreaterThanOrEqual(scan.arp); // ATRP must be >= ARP because unranked pins are penalized

      // Verify points
      expect(scan.points).toBeDefined();
      expect(scan.points!.length).toBe(25);
    });
  });

  describe('4. Reviews & Reputation Inbox with AI Drafter', () => {
    it('generates empathetic response for negative review with offline resolution channel', () => {
      const draft = ReviewsService.generateAiDraft('rev-1', 'empathetic');
      expect(draft.draft).toContain('Marcus Vance');
      expect(draft.draft.toLowerCase()).toContain('sorry');
      expect(draft.reasoning).toBeDefined();
    });

    it('publishes review reply and updates response status', () => {
      const published = ReviewsService.publishReply('rev-1', 'Thank you Marcus, our clinic manager has noted this.', 'Dr. Miller');
      expect(published.responseStatus).toBe('PUBLISHED');
      expect(published.replyText).toContain('Marcus');
      expect(published.replyAuthor).toBe('Dr. Miller');
      expect(published.replyDate).toBeDefined();
    });
  });

  describe('5. Posts & Content Studio', () => {
    it('creates post, validates character constraints, and transitions to published', () => {
      const post = PostsService.createPost({
        locationId: 'loc-apex-dental',
        postType: 'STANDARD',
        summary: 'Spring dental hygiene checkups are now open for online booking in Downtown Seattle!',
        ctaType: 'BOOK',
        ctaUrl: 'https://apexdentalstudio.example.com',
        status: 'DRAFT'
      });

      expect(post.id).toBeDefined();
      expect(post.status).toBe('DRAFT');

      const published = PostsService.publishPostNow(post.id);
      expect(published.status).toBe('PUBLISHED');
      expect(published.publishedAt).toBeDefined();
    });

    it('rejects short summaries under 10 characters', () => {
      const shortPost = PostsService.createPost({
        locationId: 'loc-apex-dental',
        postType: 'STANDARD',
        summary: 'Too short',
        ctaType: 'NONE',
        status: 'DRAFT'
      });

      expect(() => {
        PostsService.publishPostNow(shortPost.id);
      }).toThrow('Post summary must be at least 10 characters.');
    });
  });

  describe('6. Reports & CSV Export', () => {
    it('compiles multi-metric executive report and exports valid CSV', () => {
      const rep = ReportsService.generateReport({
        orgId: 'org-apex-growth',
        locationId: 'loc-apex-dental',
        title: 'Q4 Local SEO Performance Summary',
        type: 'executive_monthly',
        startDate: '2026-09-01',
        endDate: '2026-10-23'
      });

      expect(rep.id).toBeDefined();
      expect(rep.metrics.totalImpressions).toBeGreaterThan(0);
      expect(rep.metrics.solv).toBeGreaterThan(0);
      expect(rep.recommendations.length).toBeGreaterThan(0);

      const csv = ReportsService.exportCsv(rep.id);
      expect(csv).toContain('"Metric","Value"');
      expect(csv).toContain('"Total Impressions"');
      expect(csv).toContain('"Share of Local Voice (SoLV)"');
    });

    it('creates a tokenized public share link and resolves public portal view', () => {
      const rep = ReportsService.generateReport({
        orgId: 'org-apex-growth',
        locationId: 'loc-apex-dental',
        title: 'Shareable Client Portal Test Report',
        type: 'executive_monthly',
        startDate: '2026-09-01',
        endDate: '2026-10-23'
      });

      const share = ReportsService.createShareToken(rep.id);
      expect(share.token).toBeDefined();
      expect(share.shareUrl).toBe(`/portal/${share.token}`);

      const portalData = ReportsService.getPublicReportByToken(share.token);
      expect(portalData).toBeDefined();
      expect(portalData?.report.id).toBe(rep.id);
      expect(portalData?.location.city).toBe('Seattle');
      expect(portalData?.org.name).toBeDefined();
    });
  });

  describe('7. AI Operations Copilot & Persistence', () => {
    it('identifies unanswered reviews and generates action proposal', async () => {
      const res = await AiService.processQuery('Show me unanswered negative reviews and draft responses', 'loc-apex-dental');
      expect(res.reply).toBeDefined();
      expect(res.reply.length).toBeGreaterThan(10);
    });

    it('identifies priority audit issues and generates task creation proposal', async () => {
      const res = await AiService.processQuery('Which profile issues should I fix first?', 'loc-apex-dental');
      expect(res.reply).toContain('Audit');
      expect(res.actionProposals.length).toBeGreaterThan(0);
      expect(res.actionProposals[0].type).toBe('task_creation');
      expect(res.actionProposals[0].requiresConfirmation).toBe(true);
    });

    it('persists AI conversation history and supports clearing', async () => {
      const initialHistory = AiService.getChatHistory('loc-apex-dental');
      expect(initialHistory.length).toBeGreaterThan(0);

      // Verify the latest assistant message has content
      const lastMsg = initialHistory[initialHistory.length - 1];
      expect(lastMsg.content.length).toBeGreaterThan(0);

      // Clear history
      AiService.clearChatHistory('loc-apex-dental');
      const clearedHistory = AiService.getChatHistory('loc-apex-dental');
      expect(clearedHistory.length).toBe(0);
    });
  });

  describe('8. Review Topic & Sentiment Mining', () => {
    it('extracts top sentiment themes and counts from verified reviews', () => {
      const themes = ReviewsService.getReviewThemes('loc-apex-dental');
      expect(themes.positiveThemes).toBeDefined();
      expect(themes.positiveThemes.length).toBeGreaterThan(0);
      expect(themes.frictionPoints).toBeDefined();
      expect(themes.frictionPoints.length).toBeGreaterThan(0);

      const gentleCare = themes.positiveThemes.find((t) => t.topic.toLowerCase().includes('care') || t.topic.toLowerCase().includes('hygiene'));
      expect(gentleCare).toBeDefined();
      expect(gentleCare?.sentiment).toBe('positive');
      expect(gentleCare?.count).toBeGreaterThan(0);
    });
  });
});
