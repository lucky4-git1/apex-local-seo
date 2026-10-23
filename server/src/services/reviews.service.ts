import { db } from '../db/index.js';
import { Review } from '../types/index.js';
import { ProfileService } from './profile.service.js';

export class ReviewsService {
  static getReviews(params: {
    locationId: string;
    rating?: number;
    sentiment?: 'positive' | 'neutral' | 'negative';
    responseStatus?: 'UNANSWERED' | 'DRAFTED' | 'APPROVED' | 'PUBLISHED';
    search?: string;
  }): Review[] {
    let sql = 'SELECT * FROM reviews WHERE location_id = ?';
    const bindings: any[] = [params.locationId];

    if (params.rating) {
      sql += ' AND star_rating = ?';
      bindings.push(params.rating);
    }
    if (params.sentiment) {
      sql += ' AND sentiment = ?';
      bindings.push(params.sentiment);
    }
    if (params.responseStatus) {
      sql += ' AND response_status = ?';
      bindings.push(params.responseStatus);
    }
    if (params.search) {
      sql += ' AND (author_name LIKE ? OR comment LIKE ?)';
      bindings.push(`%${params.search}%`, `%${params.search}%`);
    }

    sql += ' ORDER BY review_date DESC';
    const rows = db.prepare(sql).all(...bindings) as any[];
    return rows.map(this.mapReview);
  }

  static getReview(reviewId: string): Review | null {
    const row = db.prepare('SELECT * FROM reviews WHERE id = ?').get(reviewId) as any;
    if (!row) return null;
    return this.mapReview(row);
  }

  static generateAiDraft(reviewId: string, tone: 'empathetic' | 'professional' | 'concise' | 'enthusiastic' = 'professional'): { draft: string; reasoning: string } {
    const rev = this.getReview(reviewId);
    if (!rev) throw new Error('Review not found');

    const loc = ProfileService.getLocation(rev.locationId);
    const businessName = loc?.title || 'Our Practice';
    const isNegative = rev.starRating <= 2;
    const isPositive = rev.starRating >= 4;

    let draft = '';
    let reasoning = '';

    if (isNegative) {
      if (tone === 'empathetic') {
        draft = `Dear ${rev.authorName}, thank you for taking the time to share your feedback. We are sincerely sorry that your recent visit did not meet the high standards we set for patient care. Your comfort and trust are our top priorities, and we would appreciate the opportunity to make this right. Please contact our office manager directly at ${loc?.phoneNumber || 'our office'} so we can address your concerns in detail.`;
        reasoning = 'Empathetic tone acknowledges dissatisfaction without admitting legal liability and routes communication to a direct offline channel.';
      } else {
        draft = `Hello ${rev.authorName}, we appreciate you bringing your experience to our attention. We hold our team to rigorous standards and regret that you felt your appointment was unsatisfactory. We take your comments seriously and invite you to reach out to our team at ${loc?.phoneNumber || 'our clinic'} so we can review this situation directly.`;
        reasoning = 'Professional formal tone that demonstrates active merchant oversight to other prospective searchers.';
      }
    } else if (isPositive) {
      if (tone === 'enthusiastic') {
        draft = `Hi ${rev.authorName}! 🎉 Thank you so much for the glowing review and recommendation! Dr. Miller and our entire team at ${businessName} are thrilled to know you had such a wonderful experience. We look forward to seeing you at your next visit!`;
        reasoning = 'Enthusiastic tone reinforces brand warmth and highlights team dedication.';
      } else if (tone === 'concise') {
        draft = `Thank you ${rev.authorName}! We appreciate your support and are glad to have provided you with excellent care at ${businessName}.`;
        reasoning = 'Concise, high-velocity response suitable for straightforward 5-star praise.';
      } else {
        draft = `Dear ${rev.authorName}, thank you for your kind words and for choosing ${businessName}. Providing gentle, top-tier care is our mission, and we are grateful for your recommendation. Have a fantastic week ahead!`;
        reasoning = 'Balanced professional response reinforcing practice mission.';
      }
    } else {
      // 3-star neutral
      draft = `Hello ${rev.authorName}, thank you for your balanced feedback. We are glad you received good care, and we also note your comments on where we can do better. We continuously strive to improve the patient experience. Thank you for visiting ${businessName}!`;
      reasoning = 'Constructive acknowledgment of both positive and constructive elements.';
    }

    // Save as DRAFTED in DB
    db.prepare(`
      UPDATE reviews SET
        reply_text = ?,
        response_status = 'DRAFTED'
      WHERE id = ?
    `).run(draft, reviewId);

    return { draft, reasoning };
  }

  static saveDraft(reviewId: string, replyText: string): Review {
    db.prepare(`
      UPDATE reviews SET
        reply_text = ?,
        response_status = 'DRAFTED'
      WHERE id = ?
    `).run(replyText, reviewId);
    return this.getReview(reviewId)!;
  }

  static publishReply(reviewId: string, replyText: string, authorName: string): Review {
    const rev = this.getReview(reviewId);
    if (!rev) throw new Error('Review not found');

    const replyDate = new Date().toISOString();

    db.prepare(`
      UPDATE reviews SET
        reply_text = ?,
        reply_date = ?,
        reply_author = ?,
        response_status = 'PUBLISHED'
      WHERE id = ?
    `).run(replyText, replyDate, authorName, reviewId);

    // Record activity log
    db.prepare(`
      INSERT INTO activity_logs (id, org_id, location_id, actor, action, details, timestamp)
      VALUES (?, ?, ?, ?, 'REPLY_PUBLISHED', ?, ?)
    `).run(
      `act-${Date.now()}`,
      'org-apex-growth',
      rev.locationId,
      authorName,
      `Published reply to ${rev.authorName} (${rev.starRating}-star review)`,
      replyDate
    );

    return this.getReview(reviewId)!;
  }

  static getReviewThemes(locationId: string): {
    positiveThemes: Array<{ topic: string; count: number; sentiment: 'positive'; sampleSnippet: string }>;
    frictionPoints: Array<{ topic: string; count: number; sentiment: 'negative'; severity: 'critical' | 'high' | 'medium'; sampleSnippet: string }>;
  } {
    const reviews = this.getReviews({ locationId });

    const positiveThemes = [
      {
        topic: 'Invisalign & 3D Imaging',
        count: reviews.filter(r => r.comment.toLowerCase().includes('invisalign') || r.comment.toLowerCase().includes('3d scan')).length || 1,
        sentiment: 'positive' as const,
        sampleSnippet: '3D scan technology made it so clear from day one.'
      },
      {
        topic: 'Gentle Care & Hygiene',
        count: reviews.filter(r => r.comment.toLowerCase().includes('hygien') || r.comment.toLowerCase().includes('gentle')).length || 1,
        sentiment: 'positive' as const,
        sampleSnippet: 'Clean modern office and very gentle dental hygienist.'
      },
      {
        topic: 'Emergency Availability',
        count: reviews.filter(r => r.comment.toLowerCase().includes('emergency') || r.comment.toLowerCase().includes('chipped tooth')).length || 1,
        sentiment: 'positive' as const,
        sampleSnippet: 'Fit me in within an hour for emergency dental bonding.'
      }
    ];

    const frictionPoints = [
      {
        topic: 'Front Desk Wait Time',
        count: reviews.filter(r => r.comment.toLowerCase().includes('waited') || r.comment.toLowerCase().includes('delay')).length || 1,
        sentiment: 'negative' as const,
        severity: 'critical' as const,
        sampleSnippet: 'Waited 45 minutes past my scheduled appointment time.'
      },
      {
        topic: 'Insurance Pre-Auth / Billing',
        count: reviews.filter(r => r.comment.toLowerCase().includes('insurance') || r.comment.toLowerCase().includes('bill')).length || 1,
        sentiment: 'negative' as const,
        severity: 'high' as const,
        sampleSnippet: 'Insurance pre-authorization was mishandled; unexpected bill.'
      },
      {
        topic: 'Downtown Parking Access',
        count: reviews.filter(r => r.comment.toLowerCase().includes('parking') || r.comment.toLowerCase().includes('garage')).length || 1,
        sentiment: 'negative' as const,
        severity: 'medium' as const,
        sampleSnippet: 'Parking downtown is tough and the building garage is expensive.'
      }
    ];

    return { positiveThemes, frictionPoints };
  }

  static updateAssignmentAndEscalation(reviewId: string, data: {
    assignedTo?: string;
    escalationFlag?: boolean;
    escalationReason?: string;
    notes?: string;
  }): Review {
    db.prepare(`
      UPDATE reviews SET
        assigned_to = COALESCE(?, assigned_to),
        escalation_flag = COALESCE(?, escalation_flag),
        escalation_reason = COALESCE(?, escalation_reason),
        notes = COALESCE(?, notes)
      WHERE id = ?
    `).run(
      data.assignedTo ?? null,
      data.escalationFlag !== undefined ? (data.escalationFlag ? 1 : 0) : null,
      data.escalationReason ?? null,
      data.notes ?? null,
      reviewId
    );
    return this.getReview(reviewId)!;
  }

  private static mapReview(r: any): Review {
    return {
      id: r.id,
      locationId: r.location_id,
      authorName: r.author_name,
      authorPhotoUrl: r.author_photo_url,
      starRating: r.star_rating,
      comment: r.comment,
      reviewDate: r.review_date,
      sentiment: r.sentiment,
      responseStatus: r.response_status,
      replyText: r.reply_text,
      replyDate: r.reply_date,
      replyAuthor: r.reply_author,
      sourceId: r.source_id,
      escalationFlag: Boolean(r.escalation_flag),
      escalationReason: r.escalation_reason,
      assignedTo: r.assigned_to,
      notes: r.notes
    };
  }
}
