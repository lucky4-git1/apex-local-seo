import { db } from '../db/index.js';
import { RankScan, RankScanPoint } from '../types/index.js';
import { ProfileService } from './profile.service.js';

export class RankingService {
  static getScans(locationId: string): RankScan[] {
    const rows = db.prepare('SELECT * FROM rank_scans WHERE location_id = ? ORDER BY created_at DESC').all(locationId) as any[];
    return rows.map(r => this.mapScanSummary(r));
  }

  static getScanDetails(scanId: string): RankScan | null {
    const row = db.prepare('SELECT * FROM rank_scans WHERE id = ?').get(scanId) as any;
    if (!row) return null;

    const points = db.prepare('SELECT * FROM rank_scan_points WHERE scan_id = ? ORDER BY grid_row ASC, grid_col ASC').all(scanId) as any[];

    return {
      ...this.mapScanSummary(row),
      points: points.map(p => ({
        id: p.id,
        scanId: p.scan_id,
        lat: p.lat,
        lng: p.lng,
        gridRow: p.grid_row,
        gridCol: p.grid_col,
        rank: p.rank,
        competitors: JSON.parse(p.competitors || '[]')
      }))
    };
  }

  static runScan(params: {
    locationId: string;
    keyword: string;
    gridDimension: 3 | 5 | 7;
    radiusKm: number;
  }): RankScan {
    const loc = ProfileService.getLocation(params.locationId);
    if (!loc) throw new Error('Location not found');

    const scanId = `scan-${Date.now()}`;
    const centerLat = loc.latitude;
    const centerLng = loc.longitude;
    const dim = params.gridDimension;
    const radius = params.radiusKm;
    const totalPoints = dim * dim;

    // Geographic offset calculations
    // 1 deg lat ≈ 111 km
    // 1 deg lng ≈ 111 km * cos(lat)
    const latSpan = (radius / 111.0) * 0.8;
    const lngSpan = (radius / (111.0 * Math.cos(centerLat * Math.PI / 180))) * 0.8;
    const stepLat = latSpan / (dim - 1 || 1);
    const stepLng = lngSpan / (dim - 1 || 1);

    const halfDim = Math.floor(dim / 2);

    let sumVisibleRank = 0;
    let visiblePointsCount = 0;
    let sumTotalRank = 0;
    let top3Count = 0;
    let top10Count = 0;
    let unrankedCount = 0;

    const generatedPoints: Omit<RankScanPoint, 'id' | 'scanId'>[] = [];

    for (let r = 0; r < dim; r++) {
      for (let c = 0; c < dim; c++) {
        const pLat = Number((centerLat + (r - halfDim) * stepLat).toFixed(5));
        const pLng = Number((centerLng + (c - halfDim) * stepLng).toFixed(5));

        // Distance from center (0 at exact center)
        const distanceRatio = Math.sqrt(Math.pow(r - halfDim, 2) + Math.pow(c - halfDim, 2)) / halfDim;

        // Rank drops with distance + small keyword/location variance
        let rank: number | null = null;
        if (distanceRatio < 0.2) {
          rank = 1;
        } else if (distanceRatio <= 0.6) {
          rank = Math.min(3, Math.round(1 + distanceRatio * 2));
        } else if (distanceRatio <= 1.0) {
          rank = Math.min(8, Math.round(2 + distanceRatio * 4));
        } else if (distanceRatio <= 1.3) {
          rank = Math.min(18, Math.round(4 + distanceRatio * 9));
        } else {
          // Beyond scan border
          rank = null;
        }

        if (rank !== null && rank <= 20) {
          sumVisibleRank += rank;
          visiblePointsCount++;
          sumTotalRank += rank;
          if (rank <= 3) top3Count++;
          if (rank <= 10) top10Count++;
        } else {
          unrankedCount++;
          sumTotalRank += 21; // ATRP penalty for unranked points
        }

        // Mock realistic competitors for each point
        const competitors = [
          { name: 'Seattle Sound Dental', rank: rank === 1 ? 2 : 1 },
          { name: 'Pacific Smile Center', rank: rank === 1 ? 3 : (rank === 2 ? 3 : 2) },
          { name: 'Emerald City Smiles', rank: rank && rank <= 3 ? 4 : 3 }
        ];

        generatedPoints.push({
          lat: pLat,
          lng: pLng,
          gridRow: r,
          gridCol: c,
          rank,
          competitors
        });
      }
    }

    const arp = visiblePointsCount > 0 ? Number((sumVisibleRank / visiblePointsCount).toFixed(1)) : 21.0;
    const atrp = Number((sumTotalRank / totalPoints).toFixed(1));
    const solv = Number(((top3Count / totalPoints) * 100).toFixed(1));

    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO rank_scans (
        id, location_id, keyword, grid_dimension, radius_km, center_lat, center_lng,
        arp, atrp, solv, top3_count, top10_count, unranked_count, total_points, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)
    `).run(
      scanId,
      params.locationId,
      params.keyword,
      dim,
      radius,
      centerLat,
      centerLng,
      arp,
      atrp,
      solv,
      top3Count,
      top10Count,
      unrankedCount,
      totalPoints,
      createdAt
    );

    const insertPt = db.prepare(`
      INSERT INTO rank_scan_points (id, scan_id, lat, lng, grid_row, grid_col, rank, competitors)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const finalPoints: RankScanPoint[] = [];
    generatedPoints.forEach((p, idx) => {
      const ptId = `pt-${scanId}-${idx + 1}`;
      insertPt.run(ptId, scanId, p.lat, p.lng, p.gridRow, p.gridCol, p.rank, JSON.stringify(p.competitors));
      finalPoints.push({ ...p, id: ptId, scanId });
    });

    return {
      id: scanId,
      locationId: params.locationId,
      keyword: params.keyword,
      gridDimension: dim,
      radiusKm: radius,
      centerLat,
      centerLng,
      arp,
      atrp,
      solv,
      top3Count,
      top10Count,
      unrankedCount,
      totalPoints,
      status: 'completed',
      createdAt,
      points: finalPoints
    };
  }

  private static mapScanSummary(r: any): RankScan {
    return {
      id: r.id,
      locationId: r.location_id,
      keyword: r.keyword,
      gridDimension: r.grid_dimension,
      radiusKm: r.radius_km,
      centerLat: r.center_lat,
      centerLng: r.center_lng,
      arp: r.arp,
      atrp: r.atrp,
      solv: r.solv,
      top3Count: r.top3_count,
      top10Count: r.top10_count,
      unrankedCount: r.unranked_count,
      totalPoints: r.total_points,
      status: r.status,
      createdAt: r.created_at
    };
  }
}
