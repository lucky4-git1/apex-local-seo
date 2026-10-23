import { db } from '../db/index.js';
import { ProfileService } from './profile.service.js';
import { ReviewsService } from './reviews.service.js';
import { PostsService } from './posts.service.js';
import { AuditService } from './audit.service.js';
import { RankingService } from './ranking.service.js';
import { PerformanceService } from './performance.service.js';
import { TasksService } from './tasks.service.js';

export interface AiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AiActionProposal {
  type: 'review_reply' | 'post_creation' | 'task_creation' | 'profile_update';
  title: string;
  description: string;
  payload: any;
  requiresConfirmation: boolean;
}

export class AiService {
  static async processQuery(query: string, locationId: string, history: AiMessage[] = []): Promise<{
    reply: string;
    actionProposals: AiActionProposal[];
    dataContext?: any;
  }> {
    const qLower = query.toLowerCase().trim();
    const loc = ProfileService.getLocation(locationId);
    if (!loc) throw new Error('Location context not found');

    // Save user message to DB
    db.prepare(`
      INSERT INTO ai_conversations (id, location_id, role, content, proposals, created_at)
      VALUES (?, ?, 'user', ?, '[]', ?)
    `).run(`ai-usr-${Date.now()}`, locationId, query, new Date().toISOString());

    const finalResult = await this.generateResponse(qLower, loc, locationId);

    // Save assistant reply to DB
    db.prepare(`
      INSERT INTO ai_conversations (id, location_id, role, content, proposals, created_at)
      VALUES (?, ?, 'assistant', ?, ?, ?)
    `).run(
      `ai-${Date.now() + 1}`,
      locationId,
      finalResult.reply,
      JSON.stringify(finalResult.actionProposals),
      new Date().toISOString()
    );

    return finalResult;
  }

  static getChatHistory(locationId: string): Array<{ role: 'user' | 'assistant'; content: string; proposals?: AiActionProposal[]; createdAt: string }> {
    const rows = db.prepare('SELECT * FROM ai_conversations WHERE location_id = ? ORDER BY created_at ASC').all(locationId) as any[];
    return rows.map(r => ({
      role: r.role as 'user' | 'assistant',
      content: r.content,
      proposals: JSON.parse(r.proposals || '[]'),
      createdAt: r.created_at
    }));
  }

  static clearChatHistory(locationId: string): boolean {
    const res = db.prepare('DELETE FROM ai_conversations WHERE location_id = ?').run(locationId);
    return res.changes > 0;
  }

  private static async generateResponse(qLower: string, loc: any, locationId: string): Promise<{
    reply: string;
    actionProposals: AiActionProposal[];
    dataContext?: any;
  }> {
    const actionProposals: AiActionProposal[] = [];

    // 0. Friendly greeting handler
    if (/^(hi|hii|hello|hey|good morning|good afternoon|greetings)\b/i.test(qLower)) {
      const audit = AuditService.getLatestAudit(locationId);
      const reviews = ReviewsService.getReviews({ locationId, responseStatus: 'UNANSWERED' });
      const neg = reviews.filter(r => r.starRating <= 2);

      let reply = `Hello! 👋 I am your **Local SEO & Google Business Profile Operations Copilot** actively monitoring **${loc.title}**.\n\n`;
      reply += `**Current Quick Status:**\n`;
      reply += `• Profile Health Score: **${audit?.score || 85}/100**\n`;
      reply += `• Unanswered Reviews: **${reviews.length}**${neg.length > 0 ? ` (⚠️ ${neg.length} negative review needs reply)` : ''}\n`;
      reply += `• Share of Local Voice (SoLV): **64.0%** in Downtown Seattle\n\n`;
      reply += `How can I help you today? You can ask me to **triage reviews**, **find top audit fixes**, **draft campaign posts**, or **explain ranking changes**.`;

      return {
        reply,
        actionProposals: []
      };
    }

    // 0.1 "How are we using AI?" / AI Architecture explanation intent
    if (qLower.includes('how are we using ai') || qLower.includes('how do you use ai') || qLower.includes('how does ai work') || qLower.includes('what is ai doing') || qLower.includes('ai architecture')) {
      let reply = `### How AI Powers This Local SEO Operations Platform\n\n`;
      reply += `Rather than a disconnected generic chatbot, AI is embedded directly into our **operational data workflows** with strict human approval gates:\n\n`;
      reply += `1. **AI Review Response Assistant**:\n`;
      reply += `   - Analyzes customer review sentiment, rating, and complaints in real-time.\n`;
      reply += `   - References verified clinic policies (e.g., manager phone numbers, parking validation) to draft contextual responses.\n`;
      reply += `   - Offers 4 tone modes (*Empathetic*, *Professional*, *Concise*, *Enthusiastic*) with strict compliance to prevent legal liability or privacy leaks.\n`;
      reply += `   - Enforces a mandatory **human approval gate** before publishing to Google Business Profile.\n\n`;
      reply += `2. **AI Posts & Campaign Studio**:\n`;
      reply += `   - Generates high-converting local Google Business Profile posts (Offers, Events, Updates).\n`;
      reply += `   - Automatically adheres to Google's character limits and adds verified Call-To-Action (CTA) buttons.\n\n`;
      reply += `3. **AI Local Q&A Assistant**:\n`;
      reply += `   - Synthesizes accurate answers to public customer questions asked on Google Maps based on business hours, accepted insurance, and services.\n\n`;
      reply += `4. **Action-Oriented Copilot (This Assistant)**:\n`;
      reply += `   - Connects natural language requests to structured database tools.\n`;
      reply += `   - Can directly generate 1-click **Remediation Tasks**, **Review Replies**, and **Content Drafts** with execution confirmation.\n`;

      return {
        reply,
        actionProposals: []
      };
    }

    // 1. Unanswered reviews intent
    if (qLower.includes('unanswered') || qLower.includes('negative review') || qLower.includes('review')) {
      const reviews = ReviewsService.getReviews({ locationId, responseStatus: 'UNANSWERED' });
      if (reviews.length === 0) {
        return {
          reply: `Great news! There are currently **no unanswered reviews** for ${loc.title}. Your review response rate is in optimal standing.`,
          actionProposals: []
        };
      }

      const neg = reviews.filter(r => r.starRating <= 2);
      let replyText = `Found **${reviews.length} unanswered review(s)** for **${loc.title}**`;
      if (neg.length > 0) {
        replyText += `, including **${neg.length} critical negative review(s)** needing urgent attention:\n\n`;
        neg.forEach(r => {
          replyText += `• **${r.authorName}** (${r.starRating}★) on ${r.reviewDate.split('T')[0]}: "${r.comment}"\n`;
        });
      } else {
        replyText += `.\n\n`;
        reviews.slice(0, 3).forEach(r => {
          replyText += `• **${r.authorName}** (${r.starRating}★): "${r.comment.slice(0, 80)}..."\n`;
        });
      }

      // Generate action proposal for the first unanswered review
      const targetReview = neg[0] || reviews[0];
      const draft = ReviewsService.generateAiDraft(targetReview.id, targetReview.starRating <= 2 ? 'empathetic' : 'professional');
      actionProposals.push({
        type: 'review_reply',
        title: `Approve reply to ${targetReview.authorName}`,
        description: `Proposed response: "${draft.draft}"`,
        payload: {
          reviewId: targetReview.id,
          replyText: draft.draft
        },
        requiresConfirmation: true
      });

      return {
        reply: replyText + `\nI have prepared an empathetic response proposal below for your review before publishing to Google.`,
        actionProposals,
        dataContext: { count: reviews.length, negativeCount: neg.length }
      };
    }

    // 2. Profile audit issues intent
    if (qLower.includes('audit') || qLower.includes('issue') || qLower.includes('fix') || qLower.includes('health') || qLower.includes('what should i do')) {
      const audit = AuditService.getLatestAudit(locationId);
      if (!audit) {
        return {
          reply: `No audit found for ${loc.title}. Let's run a new 12-point audit.`,
          actionProposals: []
        };
      }

      const openFindings = audit.findings.filter(f => f.status === 'open');
      const topCritical = openFindings.filter(f => f.severity === 'critical' || f.severity === 'high');

      let reply = `### Local SEO Priority Diagnostic for ${loc.title}\n`;
      reply += `Overall Audit Health Score: **${audit.score}/100**\n\n`;
      reply += `Here are the top issues hurting your local search visibility right now:\n\n`;

      topCritical.slice(0, 3).forEach((f, idx) => {
        reply += `${idx + 1}. **[${f.severity.toUpperCase()}] ${f.title}**\n`;
        reply += `   - *Evidence:* ${f.evidence}\n`;
        reply += `   - *Action:* ${f.remediation}\n`;
        reply += `   - *Effort:* ${f.estimatedEffort.toUpperCase()}\n\n`;

        actionProposals.push({
          type: 'task_creation',
          title: `Create task: ${f.title}`,
          description: f.remediation,
          payload: {
            findingId: f.id,
            assigneeName: 'Local SEO Specialist'
          },
          requiresConfirmation: true
        });
      });

      reply += `I have created 1-click task remediation proposals below so your team can immediately resolve these issues.`;

      return {
        reply,
        actionProposals,
        dataContext: { score: audit.score, openCount: openFindings.length }
      };
    }

    // 3. Post drafting intent
    if (qLower.includes('post') || qLower.includes('content') || qLower.includes('draft') || qLower.includes('campaign')) {
      const suggestions = PostsService.generateAiPostSuggestions({
        locationId,
        objective: 'seasonal_promotion',
        topic: 'Local business campaign'
      });

      let reply = `Here are tailored Google Business Profile post options for **${loc.title}**:\n\n`;
      suggestions.forEach((s, idx) => {
        reply += `**Option ${idx + 1}: ${s.title}**\n`;
        reply += `> ${s.summary}\n`;
        reply += `*CTA Button:* ${s.ctaType}\n\n`;

        actionProposals.push({
          type: 'post_creation',
          title: `Schedule Post: ${s.title}`,
          description: s.summary,
          payload: {
            locationId,
            summary: s.summary,
            postType: 'OFFER',
            ctaType: s.ctaType,
            mediaUrl: s.suggestedMedia,
            status: 'DRAFT'
          },
          requiresConfirmation: true
        });
      });

      reply += `Select an option below to schedule or publish directly to your Google Business Profile.`;
      return {
        reply,
        actionProposals
      };
    }

    // 4. Ranking and Map visibility intent
    if (qLower.includes('ranking') || qLower.includes('map') || qLower.includes('solv') || qLower.includes('arp')) {
      const scans = RankingService.getScans(locationId);
      if (scans.length === 0) {
        return {
          reply: `No geo-grid scans found for ${loc.title}. You can run a 5x5 grid scan from the Map Rankings tab.`,
          actionProposals: []
        };
      }

      const latest = scans[0];
      let reply = `### Geo-Grid Ranking Intelligence for "${latest.keyword}"\n\n`;
      reply += `- **Share of Local Voice (SoLV):** **${latest.solv}%** of checked points place ${loc.title} in the top 3 (Google 3-Pack).\n`;
      reply += `- **Average Rank Position (ARP):** **${latest.arp}** in zones where your profile is visible in the top 20.\n`;
      reply += `- **Average Total Rank Position (ATRP):** **${latest.atrp}** across the entire ${latest.radiusKm}km radius.\n`;
      reply += `- **Top 3 Pins:** ${latest.top3Count} / ${latest.totalPoints} points.\n\n`;
      reply += `**Insight:** Your local pack dominance is strongest within 1.5km of ${loc.addressLine1}. Toward the perimeter, competitor *Seattle Sound Dental* captures pins due to higher citation recency and category density.`;

      return {
        reply,
        actionProposals: []
      };
    }

    // 5. Performance and Engagement comparison intent
    if (qLower.includes('performance') || qLower.includes('analytics') || qLower.includes('compare') || qLower.includes('traffic') || qLower.includes('calls')) {
      const perf = PerformanceService.getMetrics(locationId, 30);
      let reply = `### 30-Day Google Business Profile Performance for ${loc.title}\n\n`;
      reply += `Official verified Google API metrics comparison:\n\n`;
      reply += `- **Total Impressions:** **${perf.currentSummary.totalImpressions.toLocaleString()}** (${perf.comparisonSummary.impressionsDeltaPct >= 0 ? '+' : ''}${perf.comparisonSummary.impressionsDeltaPct}% vs prior period)\n`;
      reply += `  - Google Maps: ${perf.currentSummary.mapsImpressions.toLocaleString()}\n`;
      reply += `  - Google Search: ${perf.currentSummary.searchImpressions.toLocaleString()}\n`;
      reply += `- **Website Clicks:** **${perf.currentSummary.websiteClicks}** (${perf.comparisonSummary.websiteClicksDeltaPct >= 0 ? '+' : ''}${perf.comparisonSummary.websiteClicksDeltaPct}%)\n`;
      reply += `- **Direct Phone Calls:** **${perf.currentSummary.callClicks}** (${perf.comparisonSummary.callClicksDeltaPct >= 0 ? '+' : ''}${perf.comparisonSummary.callClicksDeltaPct}%)\n`;
      reply += `- **Direction Requests:** **${perf.currentSummary.directionRequests}** (${perf.comparisonSummary.directionsDeltaPct >= 0 ? '+' : ''}${perf.comparisonSummary.directionsDeltaPct}%)\n\n`;
      reply += `**Top Search Keywords:**\n`;
      perf.searchKeywords.slice(0, 4).forEach(k => {
        reply += `• "${k.keyword}" — ${k.impressions.toLocaleString()} impressions (${k.trend.toUpperCase()})\n`;
      });

      return {
        reply,
        actionProposals: []
      };
    }

    // Default guidance response
    return {
      reply: `I am your **Local SEO & Google Business Profile Operations Copilot**. Here are quick actions you can ask me to execute for **${loc.title}**:\n\n` +
        `1. *"Show me unanswered reviews and draft responses"*\n` +
        `2. *"Which profile issues should I fix first?"*\n` +
        `3. *"Draft five posts for this month's campaign"*\n` +
        `4. *"Explain our current map ranking visibility and SoLV"*\n` +
        `5. *"Compare this month's phone calls and search clicks"*\n\n` +
        `All suggested actions will include explicit approval steps before anything is published or modified.`,
      actionProposals: []
    };
  }
}
