import { db } from '../db/index.js';
import { Competitor } from '../types/index.js';

export class CompetitorsService {
  static getCompetitors(locationId: string): Competitor[] {
    const rows = db.prepare('SELECT * FROM competitors WHERE location_id = ? ORDER BY estimated_solv DESC').all(locationId) as any[];
    return rows.map(r => ({
      id: r.id,
      locationId: r.location_id,
      businessName: r.business_name,
      address: r.address,
      rating: r.rating,
      reviewCount: r.review_count,
      primaryCategory: r.primary_category,
      estimatedSolv: r.estimated_solv,
      targetKeywords: JSON.parse(r.target_keywords || '[]'),
      distanceKm: r.distance_km,
      observationDate: r.observation_date
    }));
  }

  static addCompetitor(data: Omit<Competitor, 'id' | 'observationDate'>): Competitor {
    const id = `comp-${Date.now()}`;
    const observationDate = new Date().toISOString();

    db.prepare(`
      INSERT INTO competitors (
        id, location_id, business_name, address, rating, review_count,
        primary_category, estimated_solv, target_keywords, distance_km, observation_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.locationId,
      data.businessName,
      data.address,
      data.rating,
      data.reviewCount,
      data.primaryCategory,
      data.estimatedSolv,
      JSON.stringify(data.targetKeywords),
      data.distanceKm,
      observationDate
    );

    return {
      ...data,
      id,
      observationDate
    };
  }

  static deleteCompetitor(id: string): boolean {
    const res = db.prepare('DELETE FROM competitors WHERE id = ?').run(id);
    return res.changes > 0;
  }
}
