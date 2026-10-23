import { db } from '../db/index.js';
import { Post } from '../types/index.js';
import { ProfileService } from './profile.service.js';

export class PostsService {
  static getPosts(locationId: string, status?: string): Post[] {
    let sql = 'SELECT * FROM posts WHERE location_id = ?';
    const params: any[] = [locationId];
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    sql += ' ORDER BY created_at DESC';
    const rows = db.prepare(sql).all(...params) as any[];
    return rows.map(this.mapPost);
  }

  static getPost(postId: string): Post | null {
    const row = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId) as any;
    if (!row) return null;
    return this.mapPost(row);
  }

  static createPost(data: Omit<Post, 'id' | 'createdAt'>): Post {
    const id = `post-${Date.now()}`;
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO posts (
        id, location_id, post_type, summary, cta_type, cta_url, media_url,
        status, scheduled_for, published_at, failure_reason, campaign_label,
        event_title, event_start_date, event_end_date, coupon_code, created_at
      ) VALUES (
        @id, @locationId, @postType, @summary, @ctaType, @ctaUrl, @mediaUrl,
        @status, @scheduledFor, @publishedAt, @failureReason, @campaignLabel,
        @eventTitle, @eventStartDate, @eventEndDate, @couponCode, @createdAt
      )
    `).run({
      id,
      locationId: data.locationId,
      postType: data.postType,
      summary: data.summary,
      ctaType: data.ctaType,
      ctaUrl: data.ctaUrl || null,
      mediaUrl: data.mediaUrl || null,
      status: data.status || 'DRAFT',
      scheduledFor: data.scheduledFor || null,
      publishedAt: data.status === 'PUBLISHED' ? new Date().toISOString() : null,
      failureReason: null,
      campaignLabel: data.campaignLabel || null,
      eventTitle: data.eventTitle || null,
      eventStartDate: data.eventStartDate || null,
      eventEndDate: data.eventEndDate || null,
      couponCode: data.couponCode || null,
      createdAt
    });

    return this.getPost(id)!;
  }

  static publishPostNow(postId: string): Post {
    const post = this.getPost(postId);
    if (!post) throw new Error('Post not found');

    const publishedAt = new Date().toISOString();

    // Validate requirements per Google Local Posts API
    if (post.summary.length < 10) {
      db.prepare("UPDATE posts SET status = 'FAILED', failure_reason = 'Post summary must be at least 10 characters.' WHERE id = ?").run(postId);
      throw new Error('Post summary must be at least 10 characters.');
    }

    db.prepare(`
      UPDATE posts SET
        status = 'PUBLISHED',
        published_at = ?,
        failure_reason = NULL
      WHERE id = ?
    `).run(publishedAt, postId);

    // Activity log
    db.prepare(`
      INSERT INTO activity_logs (id, org_id, location_id, actor, action, details, timestamp)
      VALUES (?, ?, ?, 'System / User', 'POST_PUBLISHED', ?, ?)
    `).run(
      `act-${Date.now()}`,
      'org-apex-growth',
      post.locationId,
      `Published ${post.postType} post to Google Business Profile: "${post.summary.slice(0, 40)}..."`,
      publishedAt
    );

    return this.getPost(postId)!;
  }

  static deletePost(postId: string): boolean {
    const res = db.prepare('DELETE FROM posts WHERE id = ?').run(postId);
    return res.changes > 0;
  }

  static generateAiPostSuggestions(params: {
    locationId: string;
    objective: 'seasonal_promotion' | 'educational_tip' | 'service_announcement' | 'event_highlight';
    topic: string;
    targetAudience?: string;
  }): { title: string; summary: string; ctaType: string; suggestedMedia: string }[] {
    const loc = ProfileService.getLocation(params.locationId);
    const title = loc?.title || 'Our Practice';
    const city = loc?.city || 'Local Area';

    if (params.objective === 'seasonal_promotion') {
      return [
        {
          title: 'Seasonal Smile Refresh',
          summary: `✨ Autumn Special at ${title}! Treat yourself to professional teeth whitening in ${city} and enjoy complimentary take-home maintenance. Valid through this month only. Book online today!`,
          ctaType: 'BOOK',
          suggestedMedia: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80'
        },
        {
          title: 'Year-End Dental Benefits Reminder',
          summary: `Did you know dental insurance benefits typically reset on December 31st? Don't leave your earned preventive care on the table. Schedule your checkup at ${title} before year-end!`,
          ctaType: 'BOOK',
          suggestedMedia: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80'
        }
      ];
    } else if (params.objective === 'educational_tip') {
      return [
        {
          title: 'Healthy Habits: Brushing & Enamel Care',
          summary: `🦷 Dentist tip of the week: Brushing immediately after consuming acidic foods like coffee or citrus can wear down enamel. Wait 30 minutes to rinse and brush safely! Follow ${title} for more oral health insights.`,
          ctaType: 'LEARN_MORE',
          suggestedMedia: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=800&q=80'
        },
        {
          title: '3 Warning Signs You Need an Exam',
          summary: `Notice bleeding gums, tooth sensitivity, or jaw stiffness? Don't ignore early warning signs. Early intervention saves your natural teeth and prevents costly emergencies. Visit us in ${city}.`,
          ctaType: 'BOOK',
          suggestedMedia: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80'
        }
      ];
    } else {
      return [
        {
          title: 'Cutting-Edge 3D Imaging Technology',
          summary: `We are proud to introduce painless 3D digital impressions at ${title}! No messy putty, just fast, ultra-accurate 3D mapping for Invisalign and restorative crowns. Experience the future of dentistry in ${city}.`,
          ctaType: 'LEARN_MORE',
          suggestedMedia: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80'
        }
      ];
    }
  }

  private static mapPost(r: any): Post {
    return {
      id: r.id,
      locationId: r.location_id,
      postType: r.post_type,
      summary: r.summary,
      ctaType: r.cta_type,
      ctaUrl: r.cta_url,
      mediaUrl: r.media_url,
      status: r.status,
      scheduledFor: r.scheduled_for,
      publishedAt: r.published_at,
      failureReason: r.failure_reason,
      campaignLabel: r.campaign_label,
      eventTitle: r.event_title,
      eventStartDate: r.event_start_date,
      eventEndDate: r.event_end_date,
      couponCode: r.coupon_code,
      createdAt: r.created_at
    };
  }
}
