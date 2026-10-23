import { db } from '../db/index.js';
import { Report, BusinessLocation, Organization } from '../types/index.js';
import { ProfileService } from './profile.service.js';
import { PerformanceService } from './performance.service.js';
import { AuditService } from './audit.service.js';
import { RankingService } from './ranking.service.js';
import crypto from 'node:crypto';

export class ReportsService {
  static getReports(locationId: string): Report[] {
    const rows = db.prepare('SELECT * FROM reports WHERE location_id = ? ORDER BY created_at DESC').all(locationId) as any[];
    return rows.map(this.mapReport);
  }

  static getReport(reportId: string): Report | null {
    const row = db.prepare('SELECT * FROM reports WHERE id = ?').get(reportId) as any;
    if (!row) return null;
    return this.mapReport(row);
  }

  static generateReport(data: {
    orgId: string;
    locationId: string;
    title: string;
    type: 'executive_monthly' | 'audit_remediation' | 'competitor_benchmark';
    startDate: string;
    endDate: string;
  }): Report {
    const loc = ProfileService.getLocation(data.locationId);
    if (!loc) throw new Error('Location not found');

    const perf = PerformanceService.getMetrics(data.locationId, 30);
    const audit = AuditService.getLatestAudit(data.locationId);
    const scans = RankingService.getScans(data.locationId);
    const latestScan = scans.length > 0 ? scans[0] : null;

    const revStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        AVG(star_rating) as avg_rating,
        SUM(CASE WHEN response_status = 'PUBLISHED' THEN 1 ELSE 0 END) as responded
      FROM reviews WHERE location_id = ?
    `).get(data.locationId) as any;

    const taskStats = db.prepare(`
      SELECT COUNT(*) as completed_count FROM tasks WHERE location_id = ? AND status = 'done'
    `).get(data.locationId) as any;

    const postStats = db.prepare(`
      SELECT COUNT(*) as published_count FROM posts WHERE location_id = ? AND status = 'PUBLISHED'
    `).get(data.locationId) as any;

    const totalImpressions = perf.currentSummary.totalImpressions;
    const responseRate = revStats.total > 0 ? Number(((revStats.responded / revStats.total) * 100).toFixed(1)) : 100;

    const metrics = {
      totalImpressions,
      impressionsChange: perf.comparisonSummary.impressionsDeltaPct,
      websiteClicks: perf.currentSummary.websiteClicks,
      websiteClicksChange: perf.comparisonSummary.websiteClicksDeltaPct,
      callClicks: perf.currentSummary.callClicks,
      callClicksChange: perf.comparisonSummary.callClicksDeltaPct,
      directionRequests: perf.currentSummary.directionRequests,
      directionRequestsChange: perf.comparisonSummary.directionsDeltaPct,
      averageRank: latestScan?.arp || 2.4,
      solv: latestScan?.solv || 64.0,
      newReviewsCount: revStats.total,
      averageReviewRating: Number((revStats.avg_rating || 4.8).toFixed(1)),
      reviewResponseRate: responseRate,
      postsPublished: postStats.published_count,
      resolvedTasksCount: taskStats.completed_count
    };

    const executiveSummary = `${loc.title} delivered consistent local search engagement during the reporting window. Local search visibility attained a Share of Local Voice (SoLV) of ${metrics.solv}% for targeted core keywords. The profile generated ${metrics.websiteClicks} qualified website clicks, ${metrics.callClicks} direct calls, and ${metrics.directionRequests} direction requests. Current local SEO audit health score stands at ${audit?.score || 85}/100 with ${metrics.resolvedTasksCount} optimization tasks resolved.`;

    const recommendations = [
      'Maintain an unbroken 100% review response rate for all new incoming patient feedback within 24 hours.',
      'Publish weekly Google Business Profile posts featuring ongoing promotions and clinic updates.',
      'Address outstanding audit recommendations to lift the profile audit health score toward 95+.'
    ];

    const reportId = `rep-${Date.now()}`;
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO reports (
        id, org_id, location_id, title, type, date_range_start, date_range_end,
        executive_summary, metrics, recommendations, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      reportId,
      data.orgId,
      data.locationId,
      data.title,
      data.type,
      data.startDate,
      data.endDate,
      executiveSummary,
      JSON.stringify(metrics),
      JSON.stringify(recommendations),
      createdAt
    );

    return this.getReport(reportId)!;
  }

  static exportCsv(reportId: string): string {
    const report = this.getReport(reportId);
    if (!report) throw new Error('Report not found');

    const lines: string[] = [
      `"Report Title","${report.title}"`,
      `"Location ID","${report.locationId}"`,
      `"Date Range","${report.dateRangeStart} to ${report.dateRangeEnd}"`,
      `"Generated At","${report.createdAt}"`,
      '',
      '"Metric","Value"',
      `"Total Impressions",${report.metrics.totalImpressions}`,
      `"Impressions Delta (%)",${report.metrics.impressionsChange}%`,
      `"Website Clicks",${report.metrics.websiteClicks}`,
      `"Website Clicks Delta (%)",${report.metrics.websiteClicksChange}%`,
      `"Direct Call Clicks",${report.metrics.callClicks}`,
      `"Direction Requests",${report.metrics.directionRequests}`,
      `"Average Ranking Position (ARP)",${report.metrics.averageRank}`,
      `"Share of Local Voice (SoLV)",${report.metrics.solv}%`,
      `"Average Star Rating",${report.metrics.averageReviewRating}`,
      `"Review Response Rate",${report.metrics.reviewResponseRate}%`,
      `"Tasks Completed",${report.metrics.resolvedTasksCount}`
    ];

    return lines.join('\n');
  }

  static createShareToken(reportId: string): { token: string; shareUrl: string } {
    const report = this.getReport(reportId);
    if (!report) throw new Error('Report not found');

    // Check existing active token
    const existing = db.prepare(
      'SELECT token FROM shared_client_reports WHERE report_id = ? AND is_active = 1'
    ).get(reportId) as any;

    if (existing) {
      return {
        token: existing.token,
        shareUrl: `/portal/${existing.token}`
      };
    }

    const token = crypto.randomBytes(16).toString('hex');
    const id = `shr-${Date.now()}`;
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO shared_client_reports (id, token, report_id, org_id, location_id, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `).run(id, token, reportId, report.orgId, report.locationId, createdAt);

    return {
      token,
      shareUrl: `/portal/${token}`
    };
  }

  static getPublicReportByToken(token: string): {
    report: Report;
    location: {
      title: string;
      city: string;
      state: string;
      phoneNumber: string;
      websiteUrl: string;
      primaryCategory: string;
    };
    org: {
      name: string;
      plan: string;
    };
  } | null {
    const share = db.prepare(
      'SELECT * FROM shared_client_reports WHERE token = ? AND is_active = 1'
    ).get(token) as any;

    if (!share) return null;

    const report = this.getReport(share.report_id);
    if (!report) return null;

    const loc = ProfileService.getLocation(share.location_id);
    const org = db.prepare('SELECT name, plan FROM organizations WHERE id = ?').get(share.org_id) as any;

    return {
      report,
      location: {
        title: loc?.title || '',
        city: loc?.city || '',
        state: loc?.state || '',
        phoneNumber: loc?.phoneNumber || '',
        websiteUrl: loc?.websiteUrl || '',
        primaryCategory: loc?.primaryCategory || ''
      },
      org: {
        name: org?.name || 'Local SEO Agency',
        plan: org?.plan || 'ENTERPRISE'
      }
    };
  }

  private static mapReport(r: any): Report {
    return {
      id: r.id,
      orgId: r.org_id,
      locationId: r.location_id,
      title: r.title,
      type: r.type,
      dateRangeStart: r.date_range_start,
      dateRangeEnd: r.date_range_end,
      executiveSummary: r.executive_summary,
      metrics: JSON.parse(r.metrics),
      recommendations: JSON.parse(r.recommendations || '[]'),
      createdAt: r.created_at
    };
  }
}
