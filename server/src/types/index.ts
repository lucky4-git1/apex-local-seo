export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'informational';
export type Confidence = 'high' | 'medium' | 'low';
export type Status = 'open' | 'in_progress' | 'resolved' | 'ignored';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  whiteLabelLogo?: string;
  agencyBrandName?: string;
  createdAt: string;
}

export interface RegularHoursDay {
  day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface SpecialHourPeriod {
  startDate: string;
  endDate: string;
  isClosed: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface BusinessLocation {
  id: string;
  orgId: string;
  googleLocationId: string;
  accountId: string;
  title: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  phoneNumber: string;
  websiteUrl: string;
  primaryCategory: string;
  additionalCategories: string[];
  description: string;
  regularHours: RegularHoursDay[];
  specialHours: SpecialHourPeriod[];
  attributes: Record<string, boolean | string>;
  services: string[];
  verificationStatus: 'VERIFIED' | 'UNVERIFIED' | 'PENDING_REVIEW';
  syncStatus: 'SYNCED' | 'OUT_OF_SYNC' | 'SYNCING' | 'ERROR';
  lastSyncAt: string;
  completenessScore: number;
}

export interface ProfileChangeProposal {
  id: string;
  locationId: string;
  field: string;
  originalValue: string;
  proposedValue: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SYNCED';
  submittedBy: string;
  note?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface SEOAuditFinding {
  id: string;
  auditId: string;
  category: 
    | 'business_info_consistency'
    | 'category_relevance'
    | 'description_and_services'
    | 'website_alignment'
    | 'local_keywords'
    | 'location_content'
    | 'reviews_recency_coverage'
    | 'media_freshness'
    | 'duplicate_listings'
    | 'technical_on_page'
    | 'structured_data'
    | 'competitor_opportunity';
  severity: Severity;
  confidence: Confidence;
  title: string;
  evidence: string;
  dataSource: string;
  explanation: string;
  remediation: string;
  estimatedEffort: 'low' | 'medium' | 'high';
  status: Status;
  dateDetected: string;
  verificationResult?: string;
  linkedTaskId?: string;
}

export interface SEOAudit {
  id: string;
  locationId: string;
  score: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  status: 'completed' | 'running';
  completedAt: string;
  findings: SEOAuditFinding[];
}

export interface RankScanPoint {
  id: string;
  scanId: string;
  lat: number;
  lng: number;
  gridRow: number;
  gridCol: number;
  rank: number | null; // null if > 20
  competitors: { name: string; rank: number }[];
}

export interface RankScan {
  id: string;
  locationId: string;
  keyword: string;
  gridDimension: 3 | 5 | 7;
  radiusKm: number;
  centerLat: number;
  centerLng: number;
  arp: number; // Average Rank Position (visible <= 20)
  atrp: number; // Average Total Rank Position (all points)
  solv: number; // Share of Local Voice (% in top 3)
  top3Count: number;
  top10Count: number;
  unrankedCount: number;
  totalPoints: number;
  status: 'completed' | 'running' | 'failed';
  createdAt: string;
  points?: RankScanPoint[];
}

export interface Review {
  id: string;
  locationId: string;
  authorName: string;
  authorPhotoUrl?: string;
  starRating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  reviewDate: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  responseStatus: 'UNANSWERED' | 'DRAFTED' | 'APPROVED' | 'PUBLISHED';
  replyText?: string;
  replyDate?: string;
  replyAuthor?: string;
  sourceId: string;
  escalationFlag: boolean;
  escalationReason?: string;
  assignedTo?: string;
  notes?: string;
}

export interface Post {
  id: string;
  locationId: string;
  postType: 'STANDARD' | 'EVENT' | 'OFFER';
  summary: string;
  ctaType: 'LEARN_MORE' | 'ACTION_CALL' | 'BOOK' | 'ORDER' | 'SHOP' | 'SIGN_UP' | 'NONE';
  ctaUrl?: string;
  mediaUrl?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';
  scheduledFor?: string;
  publishedAt?: string;
  failureReason?: string;
  campaignLabel?: string;
  eventTitle?: string;
  eventStartDate?: string;
  eventEndDate?: string;
  couponCode?: string;
  createdAt: string;
}

export interface QuestionAnswer {
  id: string;
  locationId: string;
  authorName: string;
  questionText: string;
  createTime: string;
  answerText?: string;
  answerStatus: 'UNANSWERED' | 'DRAFTED' | 'PUBLISHED';
  answerAuthor?: string;
  answerTime?: string;
}

export interface Competitor {
  id: string;
  locationId: string;
  businessName: string;
  address: string;
  rating: number;
  reviewCount: number;
  primaryCategory: string;
  estimatedSolv: number;
  targetKeywords: string[];
  distanceKm: number;
  observationDate: string;
}

export interface DailyPerformanceMetric {
  date: string;
  desktopSearchImpressions: number;
  mobileSearchImpressions: number;
  desktopMapsImpressions: number;
  mobileMapsImpressions: number;
  callClicks: number;
  websiteClicks: number;
  directionRequests: number;
  conversations: number;
  bookings: number;
}

export interface DailySearchKeyword {
  keyword: string;
  impressions: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TaskChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface TaskComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface Task {
  id: string;
  orgId: string;
  locationId: string;
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'in_review' | 'done';
  assigneeName: string;
  dueDate: string;
  sourceCategory: string;
  sourceId?: string;
  checklist: TaskChecklistItem[];
  comments: TaskComment[];
  createdAt: string;
  completedAt?: string;
}

export interface Report {
  id: string;
  orgId: string;
  locationId: string;
  title: string;
  type: 'executive_monthly' | 'audit_remediation' | 'competitor_benchmark';
  dateRangeStart: string;
  dateRangeEnd: string;
  executiveSummary: string;
  metrics: {
    totalImpressions: number;
    impressionsChange: number;
    websiteClicks: number;
    websiteClicksChange: number;
    callClicks: number;
    callClicksChange: number;
    directionRequests: number;
    directionRequestsChange: number;
    averageRank: number;
    solv: number;
    newReviewsCount: number;
    averageReviewRating: number;
    reviewResponseRate: number;
    postsPublished: number;
    resolvedTasksCount: number;
  };
  recommendations: string[];
  createdAt: string;
}

export interface ActivityLogItem {
  id: string;
  orgId: string;
  locationId: string;
  actor: string;
  action: string;
  details: string;
  timestamp: string;
}
