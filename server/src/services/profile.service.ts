import { db } from '../db/index.js';
import { BusinessLocation, ProfileChangeProposal } from '../types/index.js';

export class ProfileService {
  static getLocation(locationId: string): BusinessLocation | null {
    const row = db.prepare('SELECT * FROM business_locations WHERE id = ?').get(locationId) as any;
    if (!row) return null;
    return this.mapLocation(row);
  }

  static getLocationsByOrg(orgId: string): BusinessLocation[] {
    const rows = db.prepare('SELECT * FROM business_locations WHERE org_id = ?').all(orgId) as any[];
    return rows.map(r => this.mapLocation(r));
  }

  static updateLocationDirect(locationId: string, updates: Partial<BusinessLocation>): BusinessLocation {
    const current = this.getLocation(locationId);
    if (!current) throw new Error(`Location not found: ${locationId}`);

    const newLoc = { ...current, ...updates };
    const completeness = this.calculateCompleteness(newLoc);

    db.prepare(`
      UPDATE business_locations SET
        title = @title,
        address_line1 = @addressLine1,
        city = @city,
        state = @state,
        postal_code = @postalCode,
        country = @country,
        phone_number = @phoneNumber,
        website_url = @websiteUrl,
        primary_category = @primaryCategory,
        additional_categories = @additionalCategories,
        description = @description,
        regular_hours = @regularHours,
        special_hours = @specialHours,
        attributes = @attributes,
        services = @services,
        sync_status = 'SYNCED',
        last_sync_at = @lastSyncAt,
        completeness_score = @completenessScore
      WHERE id = @id
    `).run({
      id: locationId,
      title: newLoc.title,
      addressLine1: newLoc.addressLine1,
      city: newLoc.city,
      state: newLoc.state,
      postalCode: newLoc.postalCode,
      country: newLoc.country,
      phoneNumber: newLoc.phoneNumber,
      websiteUrl: newLoc.websiteUrl,
      primaryCategory: newLoc.primaryCategory,
      additionalCategories: JSON.stringify(newLoc.additionalCategories),
      description: newLoc.description,
      regularHours: JSON.stringify(newLoc.regularHours),
      specialHours: JSON.stringify(newLoc.specialHours),
      attributes: JSON.stringify(newLoc.attributes),
      services: JSON.stringify(newLoc.services),
      lastSyncAt: new Date().toISOString(),
      completenessScore: completeness
    });

    return this.getLocation(locationId)!;
  }

  static proposeChange(data: {
    locationId: string;
    field: string;
    proposedValue: string;
    submittedBy: string;
    note?: string;
  }): ProfileChangeProposal {
    const loc = this.getLocation(data.locationId);
    if (!loc) throw new Error('Location not found');

    let originalValue = '';
    if (data.field in loc) {
      const val = (loc as any)[data.field];
      originalValue = typeof val === 'object' ? JSON.stringify(val) : String(val);
    }

    const id = `prop-${Date.now()}`;
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO profile_change_proposals (id, location_id, field, original_value, proposed_value, status, submitted_by, note, created_at)
      VALUES (?, ?, ?, ?, ?, 'PENDING_REVIEW', ?, ?, ?)
    `).run(id, data.locationId, data.field, originalValue, data.proposedValue, data.submittedBy, data.note || null, createdAt);

    return {
      id,
      locationId: data.locationId,
      field: data.field,
      originalValue,
      proposedValue: data.proposedValue,
      status: 'PENDING_REVIEW',
      submittedBy: data.submittedBy,
      note: data.note,
      createdAt
    };
  }

  static getProposals(locationId: string): ProfileChangeProposal[] {
    const rows = db.prepare('SELECT * FROM profile_change_proposals WHERE location_id = ? ORDER BY created_at DESC').all(locationId) as any[];
    return rows.map(r => ({
      id: r.id,
      locationId: r.location_id,
      field: r.field,
      originalValue: r.original_value,
      proposedValue: r.proposed_value,
      status: r.status,
      submittedBy: r.submitted_by,
      note: r.note,
      createdAt: r.created_at,
      resolvedAt: r.resolved_at
    }));
  }

  static resolveProposal(proposalId: string, action: 'APPROVE' | 'REJECT', actor: string): ProfileChangeProposal {
    const prop = db.prepare('SELECT * FROM profile_change_proposals WHERE id = ?').get(proposalId) as any;
    if (!prop) throw new Error('Proposal not found');

    const resolvedAt = new Date().toISOString();
    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    db.prepare('UPDATE profile_change_proposals SET status = ?, resolved_at = ? WHERE id = ?')
      .run(newStatus, resolvedAt, proposalId);

    if (action === 'APPROVE') {
      // Apply change to location
      const updates: any = {};
      try {
        updates[prop.field] = JSON.parse(prop.proposed_value);
      } catch {
        updates[prop.field] = prop.proposed_value;
      }
      this.updateLocationDirect(prop.location_id, updates);
    }

    return {
      id: prop.id,
      locationId: prop.location_id,
      field: prop.field,
      originalValue: prop.original_value,
      proposedValue: prop.proposed_value,
      status: newStatus,
      submittedBy: prop.submitted_by,
      note: prop.note,
      createdAt: prop.created_at,
      resolvedAt
    };
  }

  static calculateCompleteness(loc: BusinessLocation): number {
    let score = 0;
    if (loc.title?.trim()) score += 10;
    if (loc.addressLine1?.trim() && loc.city?.trim()) score += 10;
    if (loc.phoneNumber?.trim()) score += 10;
    if (loc.websiteUrl?.trim()) score += 10;
    if (loc.primaryCategory?.trim()) score += 15;
    if (loc.additionalCategories && loc.additionalCategories.length > 0) score += 10;
    if (loc.description && loc.description.length >= 100) score += 15;
    if (loc.regularHours && loc.regularHours.length >= 5) score += 10;
    if (loc.services && loc.services.length >= 3) score += 10;
    return Math.min(100, score);
  }

  private static mapLocation(row: any): BusinessLocation {
    return {
      id: row.id,
      orgId: row.org_id,
      googleLocationId: row.google_location_id,
      accountId: row.account_id,
      title: row.title,
      addressLine1: row.address_line1,
      city: row.city,
      state: row.state,
      postalCode: row.postal_code,
      country: row.country,
      latitude: row.latitude,
      longitude: row.longitude,
      phoneNumber: row.phone_number,
      websiteUrl: row.website_url,
      primaryCategory: row.primary_category,
      additionalCategories: JSON.parse(row.additional_categories || '[]'),
      description: row.description,
      regularHours: JSON.parse(row.regular_hours || '[]'),
      specialHours: JSON.parse(row.special_hours || '[]'),
      attributes: JSON.parse(row.attributes || '{}'),
      services: JSON.parse(row.services || '[]'),
      verificationStatus: row.verification_status,
      syncStatus: row.sync_status,
      lastSyncAt: row.last_sync_at,
      completenessScore: row.completeness_score
    };
  }
}
