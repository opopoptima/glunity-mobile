export interface AdminDashboardStats {
  // Core
  totalUsers: number;
  usersGrowth: number;
  verifiedSellers: number;
  pendingSellersCount: number;
  approvalRatePercentage: number | null;
  pendingModeration: {
    total: number;
    products: number;
    events: number;
    recipes: number;
    reels: number;
  };
  activityTimeline: Array<{
    day: string;
    patients: number;
    moderations: number;
    reels: number;
    events: number;
  }>;
  contentCategories: Array<{
    name: string;
    percentage: number;
    color: string;
  }>;
  userDistribution: {
    celiac: number;
    seller: number;
    health: number;
  };

  // Extended
  period?: string;
  periodLabel?: string;
  newUsersInPeriod?: number;
  contentSubmittedInPeriod?: number;
  registrationsByDay?: Array<{ date: string; count: number }>;
  activeUsers?: { dau: number; wau: number; mau: number };
  onlineNow?: number;
  topByXp?: Array<{ _id: string; fullName: string; points: number; avatar?: string; level?: number }>;
  moderationPreview?: Array<{
    _id: string;
    type: 'recipe' | 'event' | 'product' | 'reel';
    title: string;
    authorName: string;
    submittedAt: string;
    thumbnail?: string;
  }>;
  recentRegistrations?: Array<{
    _id: string;
    fullName: string;
    profileType: string;
    location: string;
    createdAt: string;
    avatar?: string;
  }>;
  platformHealth?: {
    notifications: number;
    emailsSent: number;
    apiLatency: string;
    dbStatus: string;
  };
  questionnaireStats?: {
    totalSurveyed: number;
    hasInsufficientData: boolean;
    isGlobalFallback: boolean;
    dataSourceLabel: string;
    symptoms: Array<{ id: string; label: string; count: number; pct: number; prevalencePct: number; color: string }>;
    severity: {
      mild: { count: number; pct: number };
      moderate: { count: number; pct: number };
      severe: { count: number; pct: number };
      hasData: boolean;
    };
    clinicalDiagnosisPct: number;
    clinicalDiagnosisCount: number;
    familyHistoryPct: number;
    familyHistoryCount: number;
    ageGroups: Array<{ label: string; count: number; pct: number }>;
    ageGroupsHasData: boolean;
    dietaryPreferences: Array<{ id: string; label: string; count: number; pct: number }>;
    dietaryHasData: boolean;
    gender: {
      female: { count: number; pct: number };
      male: { count: number; pct: number };
      other: { count: number; pct: number };
    };
  };
  authMethodStats?: {
    total: number;
    email:    { count: number; pct: number };
    google:   { count: number; pct: number };
    facebook: { count: number; pct: number };
  };
}

export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'revision_requested' | 'resubmitted' | 'draft' | 'all';

export interface ModerationItem {
  id: string;
  type: 'product' | 'event' | 'recipe' | 'reel';
  title: string;
  // Product fields
  images?: string[];
  ingredients?: string[];
  price?: string;
  category?: string;
  isGlutenFree?: boolean;
  certifiedGF?: boolean;
  sellerName?: string;
  sellerEmail?: string;
  shopName?: string;
  // Recipe fields
  photos?: string[];
  description?: string;
  steps?: string[];
  nutritionInfo?: Record<string, unknown>;
  authorName?: string;
  authorEmail?: string;
  // Event/Reel fields
  authorOrSeller?: string;
  eventDate?: string;
  location?: string;
  // Moderation state
  moderationStatus: ModerationStatus;
  moderationReason?: string;
  moderationNotes?: string;
  approvedAt?: string;
  approvedByName?: string;
  moderatedAt?: string;
  moderatedByName?: string;
  date: string;
  updatedAt?: string;
}

export interface ModerationStats {
  pendingProducts: number;
  pendingRecipes: number;
  pendingReels: number;
  pendingSellerVerifications: number;
  pendingShopUpdates: number;
  totalPending: number;
  approvedToday: number;
  rejectedToday: number;
  revisionRequests: number;
  verifiedSellers: number;
}

export interface SellerVerificationDossier {
  id: string;
  storeName: string;
  ownerName: string;
  email: string;
  phone: string;
  siret: string;
  address: string;
  certifications: string;
  documents: string[];
  submittedDate: string;
  // New moderation fields
  sellerVerificationStatus: 'draft' | 'pending' | 'approved' | 'rejected' | 'revision_requested' | 'resubmitted';
  sellerVerificationReason?: string;
  sellerVerificationNotes?: string;
  sellerBadge: 'none' | 'verified';
  isVerifiedSeller: boolean;
  verifiedAt?: string;
  storeInfo?: Record<string, unknown>;
}

export interface ChangedField {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface ShopModerationItem {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  currentStoreName: string;
  currentData: Record<string, unknown>;
  proposedData: Record<string, unknown>;
  changedFields: ChangedField[];
  moderationStatus: 'pending' | 'approved' | 'rejected';
  reason?: string;
  notes?: string;
  moderatedAt?: string;
  moderatedByName?: string;
  submittedAt: string;
}

export interface ModerationHistoryEntry {
  id: string;
  entityType: 'product' | 'recipe' | 'seller_verification' | 'seller_badge' | 'shop';
  entityId: string;
  entityTitle: string;
  action: string;
  previousStatus: string;
  newStatus: string;
  adminId?: string;
  adminName: string;
  adminAvatar?: string;
  ownerId?: string;
  ownerName: string;
  shopName?: string;
  reason?: string;
  notes?: string;
  changedFields?: ChangedField[];
  createdAt: string;
}

export interface ModerationHistoryDetail extends ModerationHistoryEntry {
  snapshot?: Record<string, unknown>;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminUserListItem {
  id: string;
  fullName: string;
  email: string;
  profileType: 'celiac' | 'pro_commerce' | 'pro_health' | 'admin';
  status: 'active' | 'suspended';
  joinedDate: string;
  city: string;
  points?: number;
  streakDays?: number;
}

export interface PatientResourceItem {
  id: string;
  type: 'article' | 'document' | 'video';
  title: string;
  excerpt?: string;
  body?: string;
  fileUrl?: string | null;
  videoUrl?: string | null;
  category: string;
  author: string;
  viewsCount: number;
  clicksCount: number;
  status: 'Published' | 'Draft';
  isPublished?: boolean;
  isFeatured?: boolean;
  readMinutes?: number;
  coverImageUrl?: string | null;
  date: string;
}

export interface ResourceAnalyticsDTO {
  totalResources: number;
  articlesCount: number;
  documentsCount: number;
  videosCount: number;
  totalViews: number;
  totalClicks: number;
}

export interface UserStats {
  posts: number;
  comments: number;
  events: number;
  followers: number;
  reports: number;
  warnings: number;
  deletedContent: number;
  logins: number;
  purchases: number;
  reviews: number;
}

export interface RiskAnalysis {
  score: 'low' | 'medium' | 'high';
  scoreLabel: string;
  reports: number;
  spamFlags: number;
  deletedPosts: number;
  prevSuspensions: number;
  toxicityScore: number;
  fakeAccountIndicator: 'low' | 'medium' | 'high';
}

export interface ActivityTimelineItem {
  id: string;
  type: 'event' | 'post' | 'comment' | 'profile' | 'purchase' | 'login' | 'report' | 'delete' | 'warning' | 'suspension';
  title: string;
  description: string;
  date: string;
  icon: string;
  color: string;
}

export interface ContentPreviewItem {
  id: string;
  title: string;
  previewText: string;
  date: string;
  status?: string;
  extraInfo?: string;
}

export interface ReportItem {
  id: string;
  reporter: string;
  category: string;
  description: string;
  date: string;
  evidence: string;
  status: 'pending' | 'resolved' | 'dismissed' | 'escalated';
}

export interface ModerationHistoryItem {
  id: string;
  action: string;
  adminName: string;
  date: string;
  reason: string;
  duration?: string;
}

export interface EnrichedUserDetail {
  user: AdminUserListItem;
  phone: string;
  location: string;
  accountAge: string;
  lastActiveLabel: string;
  stats: UserStats;
  risk: RiskAnalysis;
  timeline: ActivityTimelineItem[];
  tabsData: {
    posts: ContentPreviewItem[];
    comments: ContentPreviewItem[];
    events: ContentPreviewItem[];
    marketplace: ContentPreviewItem[];
    reviews: ContentPreviewItem[];
    purchases: ContentPreviewItem[];
  };
  reports: ReportItem[];
  history: ModerationHistoryItem[];
}
