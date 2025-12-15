export type StaffRole = "manager" | "waiter";

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthResponse {
  staff: StaffMember;
  tokens: TokenPair;
}

export interface StaffMember {
  id: number;
  name: string;
  phone: string;
  role: StaffRole;
  branch?: string;
  branch_id?: number;
  referral_code?: string;
  last_login_at?: string;
  failed_attempts?: number;
  created_at?: string;
  updated_at?: string;
  clients_count?: number;
}

export interface StaffPagination {
  page: number;
  size: number;
  total: number;
}

export interface StaffListResponse {
  pagination: StaffPagination;
  items: StaffMember[];
}

export interface WaiterCreatePayload {
  name: string;
  phone: string;
  password: string;
  branch_id?: number;
  referral_code?: string;
}

export interface WaiterUpdatePayload {
  name?: string;
  phone?: string;
  password?: string;
  branch_id?: number;
  referral_code?: string;
}

export interface AuthState {
  staff: StaffMember | null;
  token: string | null;
  refresh: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error?: string | null;
  hydrated: boolean;
}

export interface DashboardMetrics {
  totalClients: number;
  activeWaiters: number;
  cashbackIssued: number;
  avgCashbackPerUser: number;
  loyaltyDistribution: Array<{ label: string; value: number; color: string }>;
  newsCount: number;
  redisHealthy: boolean;
  postgresHealthy: boolean;
  queueHealthy: boolean;
}

export interface ActivityItem {
  id: string;
  type: "auth" | "otp" | "cashback" | "news";
  description: string;
  created_at: string;
  status: "success" | "warning" | "error";
}

export interface SystemHealth {
  name: string;
  status: "healthy" | "degraded" | "down";
  message: string;
}

export interface LoyaltySummary {
  current_points: number;
  current_level: string;
  next_level?: string;
  next_level_threshold?: number;
  progress_percent?: number;
  next_level_cashback_percent?: number;
}

export interface User {
  id: number;
  first_name?: string;
  last_name?: string;
  name?: string;
  phone: string;
  waiter?: StaffMember;
  waiter_id?: number;
  photo_url?: string;
  profile_photo_url?: string;
  dob?: string;
  date_of_birth?: string;
  cashback_balance?: number;
  level?: string;
  is_active?: boolean;
  loyalty?: LoyaltySummary;
  created_at?: string;
  updated_at?: string;
  email?: string | null;
  gender?: string | null;
  surname?: string | null;
  middleName?: string | null;
  is_deleted?: boolean;
  transactions?: Transaction[];
  files?: MediaFile[];
}

export interface Transaction {
  id: number;
  amount: number;
  description: string;
  created_at: string;
  branch?: string;
  source?: string;
  staff?: StaffMember;
  balance_before?: number | null;
  balance_after?: number | null;
  staff_id?: number | null;
}

export interface OtpLog {
  id: number;
  phone: string;
  status: "sent" | "failed";
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface CashbackPayload {
  user_id: number;
  amount: number;
  description?: string;
  branch_id?: number;
  source?: string;
}

export interface CashbackTransaction extends Transaction {
  user: Pick<User, "id" | "first_name" | "last_name">;
}

export interface LoyaltyAnalytics {
  tierCounts: Array<{ tier: string; users: number }>;
  nearNextTier: Array<{ user: User; missingPoints: number }>;
  averagePoints: number;
}

export interface NewsItem {
  id: number;
  title: string;
  description: string;
  image_url?: string;
  starts_at?: string;
  ends_at?: string;
  priority?: number;
  is_active: boolean;
}

export interface NotificationItem {
  id: number;
  title: string;
  description: string;
  created_at: string;
}

export interface NotificationDraft {
  id?: number;
  title: string;
  description: string;
}

export interface Category {
  id: number;
  name: string;
  image_url?: string;
  is_active: boolean;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  category: Category;
  image_url?: string;
  is_active: boolean;
}

export interface MediaFile {
  id: number;
  name: string;
  url: string;
  type: string;
  referenced_by: number;
  created_at: string;
}

export interface WaiterStat {
  staff_id: number;
  staff_name: string;
  clients_count?: number;
  transactions?: number;
  total_cashback?: number;
}

export interface LeaderboardRow {
  user: User;
  total_cashback: number;
  transactions: number;
}

export interface SystemSetting {
  key: string;
  value: string;
  description?: string;
}

export interface AuthLog {
  id: number;
  actor_type: "user" | "staff";
  actor_id: number;
  event: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface AuditLog {
  id: number;
  actor: StaffMember;
  action: string;
  entity: string;
  entity_id: number;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  created_at: string;
}

export interface FileUploadResponse {
  url: string;
  id: number;
}

export interface ApiError {
  status: number;
  message: string;
  data?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}
