export interface AdminDashboardStats {
  // Existing
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

  // New
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

export interface ModerationItem {
  id: string;
  title: string;
  type: 'product' | 'event' | 'recipe' | 'reel';
  authorOrSeller: string;
  date: string;
  allergens?: string[];
  price?: string;
  eventDate?: string;
  location?: string;
  reelId?: string;
  reviewStatus?: 'unreviewed' | 'reviewed' | 'removed';
  videoUrl?: string;
  thumbnailUrl?: string;
  authorAvatar?: string;
  authorUsername?: string;
  caption?: string;
  viewsCount?: number;
  likesCount?: number;
  commentsCount?: number;
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
