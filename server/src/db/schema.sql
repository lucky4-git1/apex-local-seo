CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'agency_pro',
  white_label_logo TEXT,
  agency_brand_name TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS business_locations (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  google_location_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  title TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  phone_number TEXT NOT NULL,
  website_url TEXT NOT NULL,
  primary_category TEXT NOT NULL,
  additional_categories TEXT NOT NULL DEFAULT '[]',
  description TEXT NOT NULL,
  regular_hours TEXT NOT NULL DEFAULT '[]',
  special_hours TEXT NOT NULL DEFAULT '[]',
  attributes TEXT NOT NULL DEFAULT '{}',
  services TEXT NOT NULL DEFAULT '[]',
  verification_status TEXT NOT NULL DEFAULT 'VERIFIED',
  sync_status TEXT NOT NULL DEFAULT 'SYNCED',
  last_sync_at TEXT NOT NULL,
  completeness_score INTEGER NOT NULL DEFAULT 85,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS profile_change_proposals (
  id TEXT PRIMARY KEY,
  location_id TEXT NOT NULL,
  field TEXT NOT NULL,
  original_value TEXT NOT NULL,
  proposed_value TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
  submitted_by TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL,
  resolved_at TEXT,
  FOREIGN KEY (location_id) REFERENCES business_locations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS seo_audits (
  id TEXT PRIMARY KEY,
  location_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  critical_count INTEGER NOT NULL DEFAULT 0,
  high_count INTEGER NOT NULL DEFAULT 0,
  medium_count INTEGER NOT NULL DEFAULT 0,
  low_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  completed_at TEXT NOT NULL,
  FOREIGN KEY (location_id) REFERENCES business_locations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS seo_audit_findings (
  id TEXT PRIMARY KEY,
  audit_id TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  confidence TEXT NOT NULL,
  title TEXT NOT NULL,
  evidence TEXT NOT NULL,
  data_source TEXT NOT NULL,
  explanation TEXT NOT NULL,
  remediation TEXT NOT NULL,
  estimated_effort TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  date_detected TEXT NOT NULL,
  verification_result TEXT,
  linked_task_id TEXT,
  FOREIGN KEY (audit_id) REFERENCES seo_audits(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rank_scans (
  id TEXT PRIMARY KEY,
  location_id TEXT NOT NULL,
  keyword TEXT NOT NULL,
  grid_dimension INTEGER NOT NULL,
  radius_km REAL NOT NULL,
  center_lat REAL NOT NULL,
  center_lng REAL NOT NULL,
  arp REAL NOT NULL,
  atrp REAL NOT NULL,
  solv REAL NOT NULL,
  top3_count INTEGER NOT NULL,
  top10_count INTEGER NOT NULL,
  unranked_count INTEGER NOT NULL,
  total_points INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TEXT NOT NULL,
  FOREIGN KEY (location_id) REFERENCES business_locations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rank_scan_points (
  id TEXT PRIMARY KEY,
  scan_id TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  grid_row INTEGER NOT NULL,
  grid_col INTEGER NOT NULL,
  rank INTEGER,
  competitors TEXT NOT NULL DEFAULT '[]',
  FOREIGN KEY (scan_id) REFERENCES rank_scans(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  location_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_photo_url TEXT,
  star_rating INTEGER NOT NULL,
  comment TEXT NOT NULL,
  review_date TEXT NOT NULL,
  sentiment TEXT NOT NULL,
  response_status TEXT NOT NULL DEFAULT 'UNANSWERED',
  reply_text TEXT,
  reply_date TEXT,
  reply_author TEXT,
  source_id TEXT NOT NULL,
  escalation_flag INTEGER NOT NULL DEFAULT 0,
  escalation_reason TEXT,
  assigned_to TEXT,
  notes TEXT,
  FOREIGN KEY (location_id) REFERENCES business_locations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  location_id TEXT NOT NULL,
  post_type TEXT NOT NULL,
  summary TEXT NOT NULL,
  cta_type TEXT NOT NULL,
  cta_url TEXT,
  media_url TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  scheduled_for TEXT,
  published_at TEXT,
  failure_reason TEXT,
  campaign_label TEXT,
  event_title TEXT,
  event_start_date TEXT,
  event_end_date TEXT,
  coupon_code TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (location_id) REFERENCES business_locations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS questions_answers (
  id TEXT PRIMARY KEY,
  location_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  question_text TEXT NOT NULL,
  create_time TEXT NOT NULL,
  answer_text TEXT,
  answer_status TEXT NOT NULL DEFAULT 'UNANSWERED',
  answer_author TEXT,
  answer_time TEXT,
  FOREIGN KEY (location_id) REFERENCES business_locations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS competitors (
  id TEXT PRIMARY KEY,
  location_id TEXT NOT NULL,
  business_name TEXT NOT NULL,
  address TEXT NOT NULL,
  rating REAL NOT NULL,
  review_count INTEGER NOT NULL,
  primary_category TEXT NOT NULL,
  estimated_solv REAL NOT NULL,
  target_keywords TEXT NOT NULL DEFAULT '[]',
  distance_km REAL NOT NULL,
  observation_date TEXT NOT NULL,
  FOREIGN KEY (location_id) REFERENCES business_locations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS performance_snapshots (
  id TEXT PRIMARY KEY,
  location_id TEXT NOT NULL,
  date TEXT NOT NULL,
  desktop_search_impressions INTEGER NOT NULL DEFAULT 0,
  mobile_search_impressions INTEGER NOT NULL DEFAULT 0,
  desktop_maps_impressions INTEGER NOT NULL DEFAULT 0,
  mobile_maps_impressions INTEGER NOT NULL DEFAULT 0,
  call_clicks INTEGER NOT NULL DEFAULT 0,
  website_clicks INTEGER NOT NULL DEFAULT 0,
  direction_requests INTEGER NOT NULL DEFAULT 0,
  conversations INTEGER NOT NULL DEFAULT 0,
  bookings INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (location_id) REFERENCES business_locations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS search_keywords (
  id TEXT PRIMARY KEY,
  location_id TEXT NOT NULL,
  keyword TEXT NOT NULL,
  impressions INTEGER NOT NULL,
  trend TEXT NOT NULL DEFAULT 'stable',
  observation_period TEXT NOT NULL,
  FOREIGN KEY (location_id) REFERENCES business_locations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  location_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  assignee_name TEXT NOT NULL,
  due_date TEXT NOT NULL,
  source_category TEXT NOT NULL,
  source_id TEXT,
  checklist TEXT NOT NULL DEFAULT '[]',
  comments TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES business_locations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  location_id TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  date_range_start TEXT NOT NULL,
  date_range_end TEXT NOT NULL,
  executive_summary TEXT NOT NULL,
  metrics TEXT NOT NULL,
  recommendations TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES business_locations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  location_id TEXT NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  timestamp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_conversations (
  id TEXT PRIMARY KEY,
  location_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  proposals TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  FOREIGN KEY (location_id) REFERENCES business_locations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shared_client_reports (
  id TEXT PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  report_id TEXT NOT NULL,
  org_id TEXT NOT NULL,
  location_id TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES business_locations(id) ON DELETE CASCADE
);
