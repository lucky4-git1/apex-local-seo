import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || path.join(dbDir, 'local_seo.db');
export const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const fallbackPath = path.resolve(process.cwd(), 'server/src/db/schema.sql');
  const finalPath = fs.existsSync(schemaPath) ? schemaPath : fallbackPath;

  if (fs.existsSync(finalPath)) {
    const schemaSql = fs.readFileSync(finalPath, 'utf8');
    db.exec(schemaSql);
  }

  // Check if organizations table is populated
  const orgCheck = db.prepare('SELECT COUNT(*) as count FROM organizations').get() as { count: number };
  if (orgCheck.count === 0) {
    seedDatabase();
  }
}

function seedDatabase() {
  console.log('[DB] Seeding comprehensive local SEO platform fixtures...');

  // 1. Organization
  db.prepare(`
    INSERT INTO organizations (id, name, slug, plan, white_label_logo, agency_brand_name, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'org-apex-growth',
    'Apex Growth Marketing',
    'apex-growth',
    'agency_pro',
    '/assets/agency-logo.svg',
    'Apex Growth Local SEO Suite',
    new Date(Date.now() - 90 * 86400000).toISOString()
  );

  // 2. Locations
  const location1 = {
    id: 'loc-apex-dental',
    org_id: 'org-apex-growth',
    google_location_id: 'locations/10839201948271039',
    account_id: 'accounts/928172948201',
    title: 'Apex Dental Studio - Downtown',
    address_line1: '720 4th Ave, Suite 300',
    city: 'Seattle',
    state: 'WA',
    postal_code: '98104',
    country: 'US',
    latitude: 47.6042,
    longitude: -122.3308,
    phone_number: '+1 (206) 555-0192',
    website_url: 'https://apexdentalstudio.example.com',
    primary_category: 'Dentist',
    additional_categories: JSON.stringify(['Cosmetic Dentist', 'Dental Clinic', 'Teeth Whitening Service', 'Emergency Dental Service']),
    description: 'Premier dental practice in Downtown Seattle specializing in comprehensive cosmetic dentistry, Invisalign, dental implants, teeth whitening, and emergency dental care with state-of-the-art 3D imaging and gentle sedation.',
    regular_hours: JSON.stringify([
      { day: 'MONDAY', openTime: '08:00', closeTime: '17:00', isClosed: false },
      { day: 'TUESDAY', openTime: '08:00', closeTime: '17:00', isClosed: false },
      { day: 'WEDNESDAY', openTime: '08:00', closeTime: '18:00', isClosed: false },
      { day: 'THURSDAY', openTime: '08:00', closeTime: '17:00', isClosed: false },
      { day: 'FRIDAY', openTime: '08:00', closeTime: '15:00', isClosed: false },
      { day: 'SATURDAY', openTime: '09:00', closeTime: '13:00', isClosed: false },
      { day: 'SUNDAY', openTime: '00:00', closeTime: '00:00', isClosed: true }
    ]),
    special_hours: JSON.stringify([
      { startDate: '2026-11-26', endDate: '2026-11-26', isClosed: true },
      { startDate: '2026-12-25', endDate: '2026-12-25', isClosed: true },
      { startDate: '2026-12-31', endDate: '2026-12-31', isClosed: false, openTime: '08:00', closeTime: '12:00' }
    ]),
    attributes: JSON.stringify({
      has_wheelchair_accessible_entrance: true,
      has_wheelchair_accessible_restroom: true,
      requires_appointments: true,
      accepts_new_patients: true,
      languages_spoken: 'English, Spanish',
      payment_credit_cards: true
    }),
    services: JSON.stringify([
      'Invisalign Clear Aligners',
      'Porcelain Veneers',
      'Dental Implants',
      'Emergency Tooth Extraction',
      'Teeth Whitening',
      'Routine Hygiene & Cleaning',
      'Dental Crowns & Bridges',
      'Sedation Dentistry'
    ]),
    verification_status: 'VERIFIED',
    sync_status: 'SYNCED',
    last_sync_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    completeness_score: 92
  };

  const location2 = {
    id: 'loc-beacon-law',
    org_id: 'org-apex-growth',
    google_location_id: 'locations/39482019482759102',
    account_id: 'accounts/928172948201',
    title: 'Beacon Hill Law Group',
    address_line1: '100 Cambridge St, 14th Floor',
    city: 'Boston',
    state: 'MA',
    postal_code: '02114',
    country: 'US',
    latitude: 42.3601,
    longitude: -71.0620,
    phone_number: '+1 (617) 555-8832',
    website_url: 'https://beaconhilllaw.example.com',
    primary_category: 'Personal Injury Attorney',
    additional_categories: JSON.stringify(['Trial Attorney', 'Legal Services', 'Law Firm']),
    description: 'Beacon Hill Law Group provides aggressive representation for personal injury, motor vehicle accidents, and wrongful death cases throughout Greater Boston and Massachusetts.',
    regular_hours: JSON.stringify([
      { day: 'MONDAY', openTime: '08:30', closeTime: '17:30', isClosed: false },
      { day: 'TUESDAY', openTime: '08:30', closeTime: '17:30', isClosed: false },
      { day: 'WEDNESDAY', openTime: '08:30', closeTime: '17:30', isClosed: false },
      { day: 'THURSDAY', openTime: '08:30', closeTime: '17:30', isClosed: false },
      { day: 'FRIDAY', openTime: '08:30', closeTime: '17:00', isClosed: false },
      { day: 'SATURDAY', openTime: '00:00', closeTime: '00:00', isClosed: true },
      { day: 'SUNDAY', openTime: '00:00', closeTime: '00:00', isClosed: true }
    ]),
    special_hours: JSON.stringify([]),
    attributes: JSON.stringify({
      online_appointments: true,
      onsite_services: true,
      has_restroom: true
    }),
    services: JSON.stringify([
      'Car Accident Claims',
      'Motorcycle Accidents',
      'Wrongful Death Litigation',
      'Premises Liability',
      'Slip and Fall Cases'
    ]),
    verification_status: 'VERIFIED',
    sync_status: 'SYNCED',
    last_sync_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    completeness_score: 78
  };

  const insertLoc = db.prepare(`
    INSERT INTO business_locations (
      id, org_id, google_location_id, account_id, title, address_line1, city, state, postal_code,
      country, latitude, longitude, phone_number, website_url, primary_category, additional_categories,
      description, regular_hours, special_hours, attributes, services, verification_status, sync_status,
      last_sync_at, completeness_score
    ) VALUES (
      @id, @org_id, @google_location_id, @account_id, @title, @address_line1, @city, @state, @postal_code,
      @country, @latitude, @longitude, @phone_number, @website_url, @primary_category, @additional_categories,
      @description, @regular_hours, @special_hours, @attributes, @services, @verification_status, @sync_status,
      @last_sync_at, @completeness_score
    )
  `);

  insertLoc.run(location1);
  insertLoc.run(location2);

  // 3. SEO Audits & Findings for Location 1
  const audit1Id = 'audit-apex-dental-latest';
  db.prepare(`
    INSERT INTO seo_audits (id, location_id, score, critical_count, high_count, medium_count, low_count, status, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(audit1Id, 'loc-apex-dental', 81, 1, 3, 4, 2, 'completed', new Date(Date.now() - 12 * 3600000).toISOString());

  const findings = [
    {
      id: 'fnd-1',
      audit_id: audit1Id,
      category: 'reviews_recency_coverage',
      severity: 'critical',
      confidence: 'high',
      title: 'Unanswered 1-star negative review flagged for over 14 days',
      evidence: 'Review by "Marcus Vance" left on 2026-10-09 (1-star) has no merchant reply. Google local ranking algorithms correlate fast owner response with engagement health.',
      data_source: 'Google Business Profile Reviews API',
      explanation: 'Customer left a complaint citing scheduling delay. Leaving negative reviews unanswered harms conversion and signals profile abandonment to local search ranking factors.',
      remediation: 'Draft an empathetic, policy-compliant response acknowledging the experience and providing a direct clinic manager phone number.',
      estimated_effort: 'low',
      status: 'open',
      date_detected: '2026-10-10'
    },
    {
      id: 'fnd-2',
      audit_id: audit1Id,
      category: 'business_info_consistency',
      severity: 'high',
      confidence: 'high',
      title: 'Website URL missing Google UTM tracking parameters',
      evidence: 'Current profile website URL is "https://apexdentalstudio.example.com" without UTM source/medium tags.',
      data_source: 'Google Business Profile Location Information API',
      explanation: 'Without UTM tags, Google Analytics miscategorizes valuable GBP organic clicks into direct or standard organic traffic, obscuring true local search ROI.',
      remediation: 'Append ?utm_source=google&utm_medium=organic&utm_campaign=gbp_seattle_downtown to destination URL.',
      estimated_effort: 'low',
      status: 'open',
      date_detected: '2026-10-15'
    },
    {
      id: 'fnd-3',
      audit_id: audit1Id,
      category: 'media_freshness',
      severity: 'high',
      confidence: 'high',
      title: 'No new interior/exterior clinic photos uploaded in 45 days',
      evidence: 'Last photo upload was detected 48 days ago. Top 3 competitors in Seattle Downtown post 4.2 customer/clinic photos monthly.',
      data_source: 'Google Business Profile Media API & Competitor Crawl',
      explanation: 'Google Maps rewards active profiles with higher impression share when rich photo and media freshness signals are maintained.',
      remediation: 'Upload 3-5 high-resolution photos of newly updated treatment rooms and reception team.',
      estimated_effort: 'medium',
      status: 'in_progress',
      date_detected: '2026-10-18'
    },
    {
      id: 'fnd-4',
      audit_id: audit1Id,
      category: 'category_relevance',
      severity: 'medium',
      confidence: 'high',
      title: 'High-volume secondary category "Pediatric Dentist" not configured',
      evidence: 'Competitors ranking in Top 3 for "family dental Seattle" include Pediatric Dentist in additional categories.',
      data_source: 'Local Search Competitor Analysis',
      explanation: 'Adding relevant secondary categories where supported expands the keyword eligibility footprint in surrounding neighborhoods.',
      remediation: 'Evaluate whether pediatric preventative care matches clinical scope and add as secondary category.',
      estimated_effort: 'low',
      status: 'open',
      date_detected: '2026-10-20'
    },
    {
      id: 'fnd-5',
      audit_id: audit1Id,
      category: 'structured_data',
      severity: 'medium',
      confidence: 'medium',
      title: 'Website schema.org/Dentist missing medicalSpecialty and openingHoursSpecification',
      evidence: 'Destination landing page has basic LocalBusiness schema but lacks specific Dentist medicalSpecialty and priceRange.',
      data_source: 'Landing Page DOM & JSON-LD Parser',
      explanation: 'Search engines correlate on-page structured data with GBP entity attributes to build localized knowledge graph confidence.',
      remediation: 'Deploy schema.org/Dentist JSON-LD snippet matching exact GBP operating hours and coordinates.',
      estimated_effort: 'medium',
      status: 'open',
      date_detected: '2026-10-21'
    },
    {
      id: 'fnd-6',
      audit_id: audit1Id,
      category: 'duplicate_listings',
      severity: 'low',
      confidence: 'high',
      title: 'No duplicate or conflicting listings detected on Google Maps',
      evidence: 'Verified phone (206) 555-0192 and address 720 4th Ave have zero unverified claimant duplicates within 200m radius.',
      data_source: 'Google Places API & Map Entity Graph',
      explanation: 'Listing ownership is clean and uncontested.',
      remediation: 'Maintain quarterly monitoring to prevent automated map place creation.',
      estimated_effort: 'low',
      status: 'resolved',
      date_detected: '2026-10-12',
      verification_result: 'Clean entity verification confirmed on 2026-10-12'
    }
  ];

  const insertFinding = db.prepare(`
    INSERT INTO seo_audit_findings (
      id, audit_id, category, severity, confidence, title, evidence, data_source, explanation,
      remediation, estimated_effort, status, date_detected, verification_result, linked_task_id
    ) VALUES (
      @id, @audit_id, @category, @severity, @confidence, @title, @evidence, @data_source, @explanation,
      @remediation, @estimated_effort, @status, @date_detected, @verification_result, @linked_task_id
    )
  `);

  for (const f of findings) {
    insertFinding.run({ ...f, linked_task_id: null, verification_result: f.verification_result || null });
  }

  // 4. Geo-Grid Ranking Scans (5x5 grid = 25 points)
  const scan1Id = 'scan-apex-cosmetic-dentist';
  const centerLat = 47.6042;
  const centerLng = -122.3308;
  const radiusKm = 5.0;
  const gridDim = 5;

  db.prepare(`
    INSERT INTO rank_scans (
      id, location_id, keyword, grid_dimension, radius_km, center_lat, center_lng,
      arp, atrp, solv, top3_count, top10_count, unranked_count, total_points, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    scan1Id,
    'loc-apex-dental',
    'cosmetic dentist seattle',
    gridDim,
    radiusKm,
    centerLat,
    centerLng,
    2.4, // ARP: average position where visible
    4.8, // ATRP: average total position including drop-offs
    64.0, // SoLV: 16 out of 25 in top 3
    16,
    22,
    1,
    25,
    'completed',
    new Date(Date.now() - 24 * 3600000).toISOString()
  );

  // Generate 5x5 grid points
  const insertPoint = db.prepare(`
    INSERT INTO rank_scan_points (id, scan_id, lat, lng, grid_row, grid_col, rank, competitors)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const stepLat = (radiusKm / 111.0) * 0.4;
  const stepLng = (radiusKm / (111.0 * Math.cos(centerLat * Math.PI / 180))) * 0.4;

  let pointIndex = 1;
  for (let r = 0; r < gridDim; r++) {
    for (let c = 0; c < gridDim; c++) {
      const pLat = Number((centerLat + (r - 2) * stepLat).toFixed(5));
      const pLng = Number((centerLng + (c - 2) * stepLng).toFixed(5));
      
      // Calculate realistic rank: best at center (1), degrades towards periphery (4-15 or null)
      const distFromCenter = Math.sqrt(Math.pow(r - 2, 2) + Math.pow(c - 2, 2));
      let rank: number | null = 1;
      if (distFromCenter === 0) rank = 1;
      else if (distFromCenter <= 1.2) rank = Math.min(3, Math.round(1 + distFromCenter * 1.2));
      else if (distFromCenter <= 2.2) rank = Math.round(2 + distFromCenter * 2.0);
      else if (distFromCenter <= 3.0) rank = Math.min(18, Math.round(5 + distFromCenter * 3.5));
      else rank = null; // Unranked beyond periphery

      const comps = [
        { name: 'Seattle Sound Dental', rank: rank === 1 ? 2 : 1 },
        { name: 'Pacific Smile Center', rank: rank === 1 ? 3 : (rank === 2 ? 3 : 2) },
        { name: 'Emerald City Smiles', rank: 4 }
      ];

      insertPoint.run(
        `pt-${scan1Id}-${pointIndex++}`,
        scan1Id,
        pLat,
        pLng,
        r,
        c,
        rank,
        JSON.stringify(comps)
      );
    }
  }

  // Also add an older scan for historical comparison
  const scan2Id = 'scan-apex-cosmetic-dentist-prev';
  db.prepare(`
    INSERT INTO rank_scans (
      id, location_id, keyword, grid_dimension, radius_km, center_lat, center_lng,
      arp, atrp, solv, top3_count, top10_count, unranked_count, total_points, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    scan2Id,
    'loc-apex-dental',
    'cosmetic dentist seattle',
    gridDim,
    radiusKm,
    centerLat,
    centerLng,
    3.2,
    6.5,
    48.0,
    12,
    18,
    3,
    25,
    'completed',
    new Date(Date.now() - 30 * 86400000).toISOString()
  );

  // 5. Reviews
  const reviewsData = [
    {
      id: 'rev-1',
      location_id: 'loc-apex-dental',
      author_name: 'Marcus Vance',
      author_photo_url: '',
      star_rating: 1,
      comment: 'Waited 45 minutes past my scheduled appointment time without any update from the front desk. The dental assistant was polite, but Dr. Miller seemed rushed during the exam and did not explain my treatment options.',
      review_date: new Date(Date.now() - 14 * 86400000).toISOString(),
      sentiment: 'negative',
      response_status: 'UNANSWERED',
      source_id: 'google_rev_981273948',
      escalation_flag: 1,
      escalation_reason: 'Wait time dissatisfaction & doctor communication complaint',
      assigned_to: 'Clinic Manager'
    },
    {
      id: 'rev-2',
      location_id: 'loc-apex-dental',
      author_name: 'Elena Rostova',
      author_photo_url: '',
      star_rating: 5,
      comment: 'I finished my Invisalign treatment here last week and could not be happier! Dr. Miller and Sarah were incredible throughout the whole 9 months. The 3D scan technology made it so clear from day one. Highly recommend Apex Dental!',
      review_date: new Date(Date.now() - 4 * 86400000).toISOString(),
      sentiment: 'positive',
      response_status: 'PUBLISHED',
      reply_text: 'Dear Elena, thank you so much for the wonderful review! Our entire team loved guiding you through your Invisalign journey. Enjoy your gorgeous new smile, and we look forward to seeing you at your next regular check-up!',
      reply_date: new Date(Date.now() - 3 * 86400000).toISOString(),
      reply_author: 'Dr. Miller (Owner)',
      source_id: 'google_rev_102938472',
      escalation_flag: 0
    },
    {
      id: 'rev-3',
      location_id: 'loc-apex-dental',
      author_name: 'David Chen',
      author_photo_url: '',
      star_rating: 4,
      comment: 'Clean modern office and very gentle dental hygienist. Parking downtown is tough and the building garage is expensive, but the dental care itself was top notch.',
      review_date: new Date(Date.now() - 8 * 86400000).toISOString(),
      sentiment: 'positive',
      response_status: 'DRAFTED',
      reply_text: 'Thank you David! We appreciate your feedback and are glad you experienced gentle care with our hygiene team. Note for your next visit: we provide 1-hour validated parking for our patients at the 4th Ave garage!',
      source_id: 'google_rev_771829482',
      escalation_flag: 0
    },
    {
      id: 'rev-4',
      location_id: 'loc-apex-dental',
      author_name: 'Sophia Martinez',
      author_photo_url: '',
      star_rating: 5,
      comment: 'Had an unexpected chipped tooth on Friday afternoon. They fit me in within an hour for emergency dental bonding and made it look completely natural. Lifesavers!',
      review_date: new Date(Date.now() - 11 * 86400000).toISOString(),
      sentiment: 'positive',
      response_status: 'PUBLISHED',
      reply_text: 'Sophia, we are so glad we could get you back to smiling comfortably without delay. Thank you for trusting Apex Dental with your emergency dental care!',
      reply_date: new Date(Date.now() - 10 * 86400000).toISOString(),
      reply_author: 'Apex Dental Care Team',
      source_id: 'google_rev_332194827',
      escalation_flag: 0
    },
    {
      id: 'rev-5',
      location_id: 'loc-apex-dental',
      author_name: 'Brian K.',
      author_photo_url: '',
      star_rating: 2,
      comment: 'Care was decent but my insurance pre-authorization was mishandled and I received an unexpected bill three months later. Need better billing transparency.',
      review_date: new Date(Date.now() - 18 * 86400000).toISOString(),
      sentiment: 'negative',
      response_status: 'DRAFTED',
      reply_text: 'Brian, thank you for bringing this to our attention. Clear billing is essential to us and we want to review your claim immediately. Please contact our billing coordinator Sarah directly at billing@apexdentalstudio.example.com.',
      source_id: 'google_rev_551928374',
      escalation_flag: 1,
      escalation_reason: 'Insurance dispute & surprise billing claim'
    }
  ];

  const insertRev = db.prepare(`
    INSERT INTO reviews (
      id, location_id, author_name, author_photo_url, star_rating, comment, review_date,
      sentiment, response_status, reply_text, reply_date, reply_author, source_id, escalation_flag,
      escalation_reason, assigned_to
    ) VALUES (
      @id, @location_id, @author_name, @author_photo_url, @star_rating, @comment, @review_date,
      @sentiment, @response_status, @reply_text, @reply_date, @reply_author, @source_id, @escalation_flag,
      @escalation_reason, @assigned_to
    )
  `);

  for (const r of reviewsData) {
    insertRev.run({
      ...r,
      author_photo_url: r.author_photo_url || null,
      reply_text: r.reply_text || null,
      reply_date: r.reply_date || null,
      reply_author: r.reply_author || null,
      escalation_reason: r.escalation_reason || null,
      assigned_to: r.assigned_to || null
    });
  }

  // 6. Posts
  const postsData = [
    {
      id: 'post-1',
      location_id: 'loc-apex-dental',
      post_type: 'OFFER',
      summary: '✨ Autumn Teeth Whitening Special! Book your in-office Zoom whitening session before November 15th and receive a complimentary custom take-home maintenance kit ($150 value). Call or book online today.',
      cta_type: 'BOOK',
      cta_url: 'https://apexdentalstudio.example.com/specials?utm_source=google&utm_medium=gbp_post',
      media_url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
      status: 'PUBLISHED',
      published_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      campaign_label: 'Fall Aesthetics 2026',
      coupon_code: 'SMILEFALL26',
      created_at: new Date(Date.now() - 4 * 86400000).toISOString()
    },
    {
      id: 'post-2',
      location_id: 'loc-apex-dental',
      post_type: 'STANDARD',
      summary: 'Did you know that regular dental cleanings remove tartar buildup that brushing alone cannot reach? We are welcoming new patients in Downtown Seattle with convenient evening appointments.',
      cta_type: 'LEARN_MORE',
      cta_url: 'https://apexdentalstudio.example.com/hygiene',
      media_url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80',
      status: 'SCHEDULED',
      scheduled_for: new Date(Date.now() + 2 * 86400000).toISOString(),
      campaign_label: 'General Hygiene Education',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: 'post-3',
      location_id: 'loc-apex-dental',
      post_type: 'EVENT',
      summary: 'Free Invisalign Consultation Day at Apex Dental! Meet with Dr. Miller for a complimentary 3D smile scan and receive $500 off your full treatment plan.',
      cta_type: 'SIGN_UP',
      cta_url: 'https://apexdentalstudio.example.com/invisalign-day',
      media_url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80',
      status: 'DRAFT',
      event_title: 'Downtown Seattle Invisalign Day',
      event_start_date: '2026-11-12T09:00:00Z',
      event_end_date: '2026-11-12T17:00:00Z',
      campaign_label: 'Invisalign Q4',
      created_at: new Date().toISOString()
    }
  ];

  const insertPost = db.prepare(`
    INSERT INTO posts (
      id, location_id, post_type, summary, cta_type, cta_url, media_url, status,
      scheduled_for, published_at, campaign_label, event_title, event_start_date,
      event_end_date, coupon_code, created_at
    ) VALUES (
      @id, @location_id, @post_type, @summary, @cta_type, @cta_url, @media_url, @status,
      @scheduled_for, @published_at, @campaign_label, @event_title, @event_start_date,
      @event_end_date, @coupon_code, @created_at
    )
  `);

  for (const p of postsData) {
    insertPost.run({
      ...p,
      scheduled_for: p.scheduled_for || null,
      published_at: p.published_at || null,
      event_title: p.event_title || null,
      event_start_date: p.event_start_date || null,
      event_end_date: p.event_end_date || null,
      coupon_code: p.coupon_code || null
    });
  }

  // 7. Questions and Answers
  const qnaData = [
    {
      id: 'qna-1',
      location_id: 'loc-apex-dental',
      author_name: 'Jessica Ramos',
      question_text: 'Do you offer sedation dentistry options for patients who experience severe dental anxiety?',
      create_time: new Date(Date.now() - 6 * 86400000).toISOString(),
      answer_text: 'Yes, Jessica! We offer both nitrous oxide (laughing gas) and oral conscious sedation to ensure your comfort during any procedure. Our team is specially trained in gentle, stress-free care.',
      answer_status: 'PUBLISHED',
      answer_author: 'Apex Dental Care Team',
      answer_time: new Date(Date.now() - 5 * 86400000).toISOString()
    },
    {
      id: 'qna-2',
      location_id: 'loc-apex-dental',
      author_name: 'Thomas Wright',
      question_text: 'Do you validate parking for the 4th Avenue garage across the street?',
      create_time: new Date(Date.now() - 1 * 86400000).toISOString(),
      answer_text: null,
      answer_status: 'UNANSWERED',
      answer_author: null,
      answer_time: null
    }
  ];

  const insertQna = db.prepare(`
    INSERT INTO questions_answers (
      id, location_id, author_name, question_text, create_time, answer_text,
      answer_status, answer_author, answer_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const q of qnaData) {
    insertQna.run(
      q.id, q.location_id, q.author_name, q.question_text, q.create_time,
      q.answer_text, q.answer_status, q.answer_author, q.answer_time
    );
  }

  // 8. Competitors
  const competitorsData = [
    {
      id: 'comp-1',
      location_id: 'loc-apex-dental',
      business_name: 'Seattle Sound Dental',
      address: '509 Olive Way, Seattle, WA 98101',
      rating: 4.8,
      review_count: 240,
      primary_category: 'Dentist',
      estimated_solv: 58.0,
      target_keywords: JSON.stringify(['dentist seattle', 'emergency dentist seattle', 'dental clinic downtown']),
      distance_km: 0.7,
      observation_date: new Date().toISOString()
    },
    {
      id: 'comp-2',
      location_id: 'loc-apex-dental',
      business_name: 'Pacific Smile Center',
      address: '1100 2nd Ave, Seattle, WA 98101',
      rating: 4.7,
      review_count: 310,
      primary_category: 'Cosmetic Dentist',
      estimated_solv: 52.0,
      target_keywords: JSON.stringify(['cosmetic dentist seattle', 'teeth whitening seattle', 'veneers']),
      distance_km: 1.1,
      observation_date: new Date().toISOString()
    },
    {
      id: 'comp-3',
      location_id: 'loc-apex-dental',
      business_name: 'Emerald City Smiles',
      address: '600 Stewart St, Seattle, WA 98101',
      rating: 4.5,
      review_count: 185,
      primary_category: 'Dentist',
      estimated_solv: 36.0,
      target_keywords: JSON.stringify(['invisalign seattle', 'dentist near me']),
      distance_km: 1.4,
      observation_date: new Date().toISOString()
    }
  ];

  const insertComp = db.prepare(`
    INSERT INTO competitors (
      id, location_id, business_name, address, rating, review_count, primary_category,
      estimated_solv, target_keywords, distance_km, observation_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const c of competitorsData) {
    insertComp.run(
      c.id, c.location_id, c.business_name, c.address, c.rating, c.review_count,
      c.primary_category, c.estimated_solv, c.target_keywords, c.distance_km, c.observation_date
    );
  }

  // 9. Performance Snapshots (Daily metrics for last 30 days)
  const insertPerf = db.prepare(`
    INSERT INTO performance_snapshots (
      id, location_id, date, desktop_search_impressions, mobile_search_impressions,
      desktop_maps_impressions, mobile_maps_impressions, call_clicks, website_clicks,
      direction_requests, conversations, bookings
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    
    // Create organic daily variance with weekend dips
    const dayOfWeek = d.getDay();
    const multiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.45 : 1.0;
    const baseSearchMob = Math.round((140 + Math.sin(i) * 25) * multiplier);
    const baseSearchDesk = Math.round((60 + Math.cos(i) * 15) * multiplier);
    const baseMapsMob = Math.round((210 + Math.sin(i + 1) * 35) * multiplier);
    const baseMapsDesk = Math.round((45 + Math.cos(i + 2) * 10) * multiplier);
    const calls = Math.round((8 + Math.random() * 6) * multiplier);
    const siteClicks = Math.round((28 + Math.random() * 14) * multiplier);
    const directions = Math.round((14 + Math.random() * 8) * multiplier);
    const convos = Math.round((2 + Math.random() * 3) * multiplier);
    const bookings = Math.round((3 + Math.random() * 4) * multiplier);

    insertPerf.run(
      `perf-apex-${dateStr}`,
      'loc-apex-dental',
      dateStr,
      baseSearchDesk,
      baseSearchMob,
      baseMapsDesk,
      baseMapsMob,
      calls,
      siteClicks,
      directions,
      convos,
      bookings
    );
  }

  // 10. Search Keywords
  const searchKeywordsData = [
    { keyword: 'dentist seattle', impressions: 1420, trend: 'up' },
    { keyword: 'cosmetic dentist near me', impressions: 980, trend: 'up' },
    { keyword: 'emergency dentist downtown seattle', impressions: 740, trend: 'stable' },
    { keyword: 'invisalign seattle wa', impressions: 610, trend: 'up' },
    { keyword: 'teeth whitening downtown seattle', impressions: 450, trend: 'down' },
    { keyword: 'dental clinic 4th ave', impressions: 290, trend: 'stable' }
  ];

  const insertKwd = db.prepare(`
    INSERT INTO search_keywords (id, location_id, keyword, impressions, trend, observation_period)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  searchKeywordsData.forEach((k, idx) => {
    insertKwd.run(`kwd-${idx + 1}`, 'loc-apex-dental', k.keyword, k.impressions, k.trend, 'Last 30 Days');
  });

  // 11. Actionable Tasks
  const tasksData = [
    {
      id: 'task-1',
      org_id: 'org-apex-growth',
      location_id: 'loc-apex-dental',
      title: 'Respond to 1-star negative review from Marcus Vance',
      description: 'Address wait time and lack of treatment options explanation. Emphasize patient satisfaction and provide direct phone line to clinic manager.',
      priority: 'urgent',
      status: 'todo',
      assignee_name: 'Dr. Miller (Owner)',
      due_date: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0],
      source_category: 'Reviews',
      source_id: 'rev-1',
      checklist: JSON.stringify([
        { id: 'c1', text: 'Review clinic encounter notes from 2026-10-09', done: true },
        { id: 'c2', text: 'Generate AI response draft using empathetic professional tone', done: true },
        { id: 'c3', text: 'Approve and publish response to Google Business Profile', done: false }
      ]),
      comments: JSON.stringify([
        { id: 'cm1', author: 'Local SEO Specialist', text: 'Generated high-compliance draft. Dr. Miller please review before publishing.', createdAt: new Date(Date.now() - 4 * 3600000).toISOString() }
      ]),
      created_at: new Date(Date.now() - 24 * 3600000).toISOString()
    },
    {
      id: 'task-2',
      org_id: 'org-apex-growth',
      location_id: 'loc-apex-dental',
      title: 'Append UTM Campaign Parameters to Website Destination URL',
      description: 'Update Google Business Profile website link to include ?utm_source=google&utm_medium=organic&utm_campaign=gbp_seattle to attribute conversion in GA4.',
      priority: 'high',
      status: 'in_progress',
      assignee_name: 'Digital Marketing Team',
      due_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      source_category: 'Audit',
      source_id: 'fnd-2',
      checklist: JSON.stringify([
        { id: 'c1', text: 'Verify destination URL landing page accepts UTM queries without redirection drop', done: true },
        { id: 'c2', text: 'Submit proposed profile change in Platform', done: false }
      ]),
      comments: JSON.stringify([]),
      created_at: new Date(Date.now() - 48 * 3600000).toISOString()
    },
    {
      id: 'task-3',
      org_id: 'org-apex-growth',
      location_id: 'loc-apex-dental',
      title: 'Upload 5 high-resolution interior practice photos',
      description: 'Refresh media signals on Google Business Profile to outpace competitors who post 4+ photos per month.',
      priority: 'medium',
      status: 'todo',
      assignee_name: 'Front Office Coordinator',
      due_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      source_category: 'Audit',
      source_id: 'fnd-3',
      checklist: JSON.stringify([
        { id: 'c1', text: 'Photograph 3D iTero scanner in treatment room 2', done: false },
        { id: 'c2', text: 'Photograph renovated patient welcome lounge', done: false },
        { id: 'c3', text: 'Upload photos via Media Management', done: false }
      ]),
      comments: JSON.stringify([]),
      created_at: new Date(Date.now() - 12 * 3600000).toISOString()
    }
  ];

  const insertTask = db.prepare(`
    INSERT INTO tasks (
      id, org_id, location_id, title, description, priority, status, assignee_name,
      due_date, source_category, source_id, checklist, comments, created_at
    ) VALUES (
      @id, @org_id, @location_id, @title, @description, @priority, @status, @assignee_name,
      @due_date, @source_category, @source_id, @checklist, @comments, @created_at
    )
  `);

  for (const t of tasksData) {
    insertTask.run(t);
  }

  // 12. Profile Change Proposals
  db.prepare(`
    INSERT INTO profile_change_proposals (
      id, location_id, field, original_value, proposed_value, status, submitted_by, note, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'prop-1',
    'loc-apex-dental',
    'website_url',
    'https://apexdentalstudio.example.com',
    'https://apexdentalstudio.example.com?utm_source=google&utm_medium=organic&utm_campaign=gbp_seattle',
    'PENDING_REVIEW',
    'Local SEO Specialist',
    'Append standard Google Analytics 4 tracking parameters to track phone calls and online bookings from GBP.',
    new Date(Date.now() - 6 * 3600000).toISOString()
  );

  // 13. Reports
  db.prepare(`
    INSERT INTO reports (
      id, org_id, location_id, title, type, date_range_start, date_range_end,
      executive_summary, metrics, recommendations, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'rep-oct-2026',
    'org-apex-growth',
    'loc-apex-dental',
    'Monthly Local SEO Executive Performance — October 2026',
    'executive_monthly',
    '2026-09-24',
    '2026-10-23',
    'Apex Dental Studio experienced strong local search growth in October 2026. Share of Local Voice (SoLV) reached 64.0% across the 5km Downtown Seattle grid (+16% improvement). Search and Maps impressions generated 348 high-intent customer actions including 124 direct phone calls and 148 online appointment clicks.',
    JSON.stringify({
      totalImpressions: 13420,
      impressionsChange: 14.8,
      websiteClicks: 842,
      websiteClicksChange: 18.2,
      callClicks: 218,
      callClicksChange: 11.5,
      directionRequests: 390,
      directionRequestsChange: 8.7,
      averageRank: 2.4,
      solv: 64.0,
      newReviewsCount: 8,
      averageReviewRating: 4.6,
      reviewResponseRate: 80.0,
      postsPublished: 4,
      resolvedTasksCount: 6
    }),
    JSON.stringify([
      'Resolve the 1-star negative review response to maintain a 100% owner response rate.',
      'Deploy the proposed UTM parameter URL update to accurately attribute appointment conversions.',
      'Schedule 2 localized posts per week featuring Invisalign and autumn cosmetic specials.'
    ]),
    new Date().toISOString()
  );

  // 14. Activity Logs
  const activityLogs = [
    { actor: 'Local SEO Specialist', action: 'PROPOSED_FIELD_CHANGE', details: 'Proposed URL tracking parameter update on Apex Dental Studio.', timestamp: new Date(Date.now() - 6 * 3600000).toISOString() },
    { actor: 'System Rank Scanner', action: 'SCAN_COMPLETED', details: 'Completed 5x5 geo-grid rank scan for "cosmetic dentist seattle" with 64.0% SoLV.', timestamp: new Date(Date.now() - 24 * 3600000).toISOString() },
    { actor: 'Dr. Miller (Owner)', action: 'REPLY_PUBLISHED', details: 'Published owner response to review by Elena Rostova (5-stars).', timestamp: new Date(Date.now() - 3 * 86400000).toISOString() },
    { actor: 'AI Content Assistant', action: 'POST_SCHEDULED', details: 'Scheduled standard educational post for 2026-10-25.', timestamp: new Date(Date.now() - 1 * 86400000).toISOString() }
  ];

  const insertAct = db.prepare(`
    INSERT INTO activity_logs (id, org_id, location_id, actor, action, details, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  activityLogs.forEach((a, idx) => {
    insertAct.run(`act-${idx + 1}`, 'org-apex-growth', 'loc-apex-dental', a.actor, a.action, a.details, a.timestamp);
  });

  console.log('[DB] Seeding finished successfully.');
}
