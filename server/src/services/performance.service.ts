import { db } from '../db/index.js';
import { DailyPerformanceMetric, DailySearchKeyword } from '../types/index.js';

export class PerformanceService {
  static getMetrics(locationId: string, days: number = 30): {
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
  } {
    const rows = db.prepare(`
      SELECT * FROM performance_snapshots
      WHERE location_id = ?
      ORDER BY date ASC
    `).all(locationId) as any[];

    const dailySeries: DailyPerformanceMetric[] = rows.map(r => ({
      date: r.date,
      desktopSearchImpressions: r.desktop_search_impressions,
      mobileSearchImpressions: r.mobile_search_impressions,
      desktopMapsImpressions: r.desktop_maps_impressions,
      mobileMapsImpressions: r.mobile_maps_impressions,
      callClicks: r.call_clicks,
      websiteClicks: r.website_clicks,
      directionRequests: r.direction_requests,
      conversations: r.conversations,
      bookings: r.bookings
    }));

    // Split into current period (last `days / 2` days or `days`) vs prior period
    const midpoint = Math.floor(dailySeries.length / 2);
    const priorPeriod = dailySeries.slice(0, midpoint);
    const currentPeriod = dailySeries.slice(midpoint);

    const sumPeriod = (series: DailyPerformanceMetric[]) => {
      return series.reduce((acc, curr) => {
        acc.searchImpressions += (curr.desktopSearchImpressions + curr.mobileSearchImpressions);
        acc.mapsImpressions += (curr.desktopMapsImpressions + curr.mobileMapsImpressions);
        acc.websiteClicks += curr.websiteClicks;
        acc.callClicks += curr.callClicks;
        acc.directionRequests += curr.directionRequests;
        acc.bookings += curr.bookings;
        acc.conversations += curr.conversations;
        return acc;
      }, {
        searchImpressions: 0,
        mapsImpressions: 0,
        websiteClicks: 0,
        callClicks: 0,
        directionRequests: 0,
        bookings: 0,
        conversations: 0
      });
    };

    const currentTotals = sumPeriod(currentPeriod);
    const priorTotals = sumPeriod(priorPeriod);

    const currentTotalImpressions = currentTotals.searchImpressions + currentTotals.mapsImpressions;
    const priorTotalImpressions = priorTotals.searchImpressions + priorTotals.mapsImpressions;

    const calcDelta = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Number((((curr - prev) / prev) * 100).toFixed(1));
    };

    // Keyword data
    const keywordRows = db.prepare('SELECT * FROM search_keywords WHERE location_id = ? ORDER BY impressions DESC').all(locationId) as any[];
    const searchKeywords: DailySearchKeyword[] = keywordRows.map(k => ({
      keyword: k.keyword,
      impressions: k.impressions,
      trend: k.trend
    }));

    return {
      currentSummary: {
        totalImpressions: currentTotalImpressions,
        searchImpressions: currentTotals.searchImpressions,
        mapsImpressions: currentTotals.mapsImpressions,
        websiteClicks: currentTotals.websiteClicks,
        callClicks: currentTotals.callClicks,
        directionRequests: currentTotals.directionRequests,
        bookings: currentTotals.bookings,
        conversations: currentTotals.conversations
      },
      comparisonSummary: {
        impressionsDeltaPct: calcDelta(currentTotalImpressions, priorTotalImpressions),
        websiteClicksDeltaPct: calcDelta(currentTotals.websiteClicks, priorTotals.websiteClicks),
        callClicksDeltaPct: calcDelta(currentTotals.callClicks, priorTotals.callClicks),
        directionsDeltaPct: calcDelta(currentTotals.directionRequests, priorTotals.directionRequests)
      },
      dailySeries,
      searchKeywords
    };
  }
}
