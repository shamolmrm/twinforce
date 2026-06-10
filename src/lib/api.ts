/**
 * Typed API client — connects the TwinForce frontend to the Hono backend.
 * Handles JWT storage, automatic token refresh, and typed responses.
 */

export const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;

// ─── Token Management ────────────────────────────────────────────────────────
const TOKEN_KEY = "tf_access_token";
const REFRESH_KEY = "tf_refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// ─── Core Fetch ──────────────────────────────────────────────────────────────
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) { clearTokens(); return null; }
    const { data } = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && retry) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;
      refreshQueue.forEach((cb) => cb(newToken));
      refreshQueue = [];
      if (newToken) return request<T>(path, options, false);
    } else {
      return new Promise<T>((resolve, reject) => {
        refreshQueue.push(async (newToken) => {
          if (newToken) resolve(await request<T>(path, options, false));
          else reject(new Error("Authentication required"));
        });
      });
    }
    clearTokens();
    throw new Error("Session expired. Please log in again.");
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? data.message ?? `HTTP ${res.status}`);
  return data as T;
}

const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (body: { email: string; password: string; fullName: string; organizationName: string }) =>
    api.post<{ data: { user: ApiUser; accessToken: string; refreshToken: string } }>("/api/v1/auth/register", body),

  login: (body: { email: string; password: string }) =>
    api.post<{ data: { user: ApiUser; accessToken: string; refreshToken: string } }>("/api/v1/auth/login", body),

  logout: () => api.post("/api/v1/auth/logout"),

  me: () => api.get<{ data: ApiUser }>("/api/v1/auth/me"),

  forgotPassword: (email: string) => api.post("/api/v1/auth/forgot-password", { email }),

  resetPassword: (token: string, password: string) =>
    api.post("/api/v1/auth/reset-password", { token, password }),

  magicLink: (email: string) => api.post("/api/v1/auth/magic-link", { email }),

  // Exchanges a Supabase OAuth/magic-link token for our own JWT pair.
  // Called from /auth/callback after Supabase redirects back with hash tokens.
  oauthSync: (supabaseToken: string) =>
    api.post<{ data: { user: ApiUser; accessToken: string; refreshToken: string } }>(
      "/api/v1/auth/oauth/sync",
      { supabaseToken },
    ),
};

// ─── OAuth URL Helpers ────────────────────────────────────────────────────────
// Builds the Supabase OAuth redirect URL for a given provider.
// The callback lands on /auth/callback where we exchange the Supabase token
// for our own JWT via authApi.oauthSync().
export function getOAuthUrl(provider: "google" | "github" | "azure"): string {
  const callbackUrl = typeof window !== "undefined"
    ? `${window.location.origin}/auth/callback`
    : "/auth/callback";
  if (SUPABASE_URL) {
    return `${SUPABASE_URL}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(callbackUrl)}`;
  }
  // Fallback: route through our backend which redirects to Supabase
  const providerRoute = provider === "azure" ? "microsoft" : provider;
  return `${BASE_URL}/api/v1/auth/${providerRoute}`;
}

// ─── Users ───────────────────────────────────────────────────────────────────
export const usersApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<{ data: ApiUser[]; total: number }>(`/api/v1/users?${new URLSearchParams(params as any)}`),

  get: (id: string) => api.get<{ data: ApiUser }>(`/api/v1/users/${id}`),
  me: () => api.get<{ data: ApiUser }>("/api/v1/users/me"),

  update: (id: string, body: Partial<ApiUser>) =>
    api.put<{ data: ApiUser }>(`/api/v1/users/${id}`, body),

  invite: (body: { email: string; role: string }) =>
    api.post<{ data: { inviteToken: string } }>("/api/v1/users/invite", body),
};

// ─── Organization ────────────────────────────────────────────────────────────
export const orgApi = {
  current: () => api.get<{ data: ApiOrg }>("/api/v1/organizations/current"),
  update: (body: Partial<ApiOrg>) => api.put<{ data: ApiOrg }>("/api/v1/organizations/current", body),
  stats: () => api.get<{ data: OrgStats }>("/api/v1/organizations/current/stats"),
  members: () => api.get<{ data: ApiUser[] }>("/api/v1/organizations/current/members"),
};

// ─── Twins ───────────────────────────────────────────────────────────────────
export const twinsApi = {
  list: () => api.get<{ data: ApiTwin[] }>("/api/v1/twins"),
  get: (id: string) => api.get<{ data: ApiTwin }>(`/api/v1/twins/${id}`),
  create: (body: { name: string; personalityConfig?: Record<string, unknown> }) =>
    api.post<{ data: ApiTwin }>("/api/v1/twins", body),
  update: (id: string, body: Partial<ApiTwin>) =>
    api.put<{ data: ApiTwin }>(`/api/v1/twins/${id}`, body),
  delete: (id: string) => api.delete(`/api/v1/twins/${id}`),
  train: (id: string, dataSources: unknown[]) =>
    api.post(`/api/v1/twins/${id}/train`, { dataSources }),
  trainingStatus: (id: string) =>
    api.get<{ data: { job: unknown; twin: ApiTwin } }>(`/api/v1/twins/${id}/training-status`),
  chat: (id: string, message: string, conversationHistory?: ConversationMessage[]) =>
    api.post<{ data: { response: string; confidence_score: number; sources: string[] } }>(
      `/api/v1/twins/${id}/chat`,
      { message, conversationHistory },
    ),
  interactions: (id: string, page = 1) =>
    api.get<{ data: unknown[] }>(`/api/v1/twins/${id}/interactions?page=${page}`),
  memories: (id: string) => api.get<{ data: unknown[] }>(`/api/v1/twins/${id}/memories`),
  analytics: (id: string) => api.get<{ data: unknown }>(`/api/v1/twins/${id}/analytics`),
};

// ─── Meetings ────────────────────────────────────────────────────────────────
export const meetingsApi = {
  list: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<{ data: ApiMeeting[]; total: number }>(`/api/v1/meetings?${new URLSearchParams(params as any)}`),
  get: (id: string) => api.get<{ data: ApiMeeting }>(`/api/v1/meetings/${id}`),
  create: (body: { title: string; platform?: string; scheduledAt?: string }) =>
    api.post<{ data: ApiMeeting }>("/api/v1/meetings", body),
  update: (id: string, body: Partial<ApiMeeting>) =>
    api.put<{ data: ApiMeeting }>(`/api/v1/meetings/${id}`, body),
  delete: (id: string) => api.delete(`/api/v1/meetings/${id}`),
  join: (id: string) => api.post(`/api/v1/meetings/${id}/join`),
  end: (id: string) => api.post(`/api/v1/meetings/${id}/end`),
  transcript: (id: string) => api.get(`/api/v1/meetings/${id}/transcript`),
  summary: (id: string) => api.get(`/api/v1/meetings/${id}/summary`),
  actionItems: (id: string) => api.get<{ data: unknown[] }>(`/api/v1/meetings/${id}/action-items`),
};

// ─── Knowledge ───────────────────────────────────────────────────────────────
export const knowledgeApi = {
  sources: () => api.get<{ data: unknown[] }>("/api/v1/knowledge/sources"),
  createSource: (body: { name: string; sourceType: string; connectionConfig?: unknown }) =>
    api.post("/api/v1/knowledge/sources", body),
  deleteSource: (id: string) => api.delete(`/api/v1/knowledge/sources/${id}`),
  syncSource: (id: string) => api.post(`/api/v1/knowledge/sources/${id}/sync`),
  documents: (params?: { page?: number }) =>
    api.get<{ data: unknown[]; total: number }>(`/api/v1/knowledge/documents?${new URLSearchParams(params as any)}`),
  search: (query: string, topK = 10) =>
    api.post<{ data: unknown }>("/api/v1/knowledge/search", { query, topK }),
  ask: (question: string, twinId?: string) =>
    api.post<{ data: { answer: string; sources: string[]; confidence: number } }>(
      "/api/v1/knowledge/ask",
      { question, twinId },
    ),
};

// ─── Email ───────────────────────────────────────────────────────────────────
export const emailApi = {
  accounts: () => api.get<{ data: unknown[] }>("/api/v1/email/accounts"),
  threads: () => api.get<{ data: unknown[] }>("/api/v1/email/threads"),
  drafts: () => api.get<{ data: unknown[] }>("/api/v1/email/drafts"),
  generateDraft: (body: { twinId: string; threadContext: string; recipient: string; tone?: string }) =>
    api.post<{ data: unknown }>("/api/v1/email/drafts/generate", body),
  approveDraft: (id: string) => api.put(`/api/v1/email/drafts/${id}/approve`),
  sendDraft: (id: string) => api.post(`/api/v1/email/drafts/${id}/send`),
};

// ─── Billing ─────────────────────────────────────────────────────────────────
export const billingApi = {
  plans: () => api.get<{ data: ApiPlan[] }>("/api/v1/billing/plans"),
  subscription: () => api.get<{ data: unknown }>("/api/v1/billing/subscription"),
  createSubscription: (planSlug: string, billingCycle: "monthly" | "yearly") =>
    api.post<{ data: { checkoutUrl: string | null } }>("/api/v1/billing/subscription/create", { planSlug, billingCycle }),
  cancelSubscription: () => api.post("/api/v1/billing/subscription/cancel"),
  invoices: () => api.get<{ data: unknown[] }>("/api/v1/billing/invoices"),
  portal: () => api.post<{ data: { url: string } }>("/api/v1/billing/portal"),
};

// ─── Analytics ───────────────────────────────────────────────────────────────
export const analyticsApi = {
  dashboard: () => api.get<{ data: DashboardStats }>("/api/v1/analytics/dashboard"),
  twins: () => api.get<{ data: unknown[] }>("/api/v1/analytics/twins"),
  meetings: (days?: number) =>
    api.get<{ data: unknown }>(`/api/v1/analytics/meetings${days ? `?days=${days}` : ""}`),
  productivity: () => api.get<{ data: unknown }>("/api/v1/analytics/productivity"),
  usage: () => api.get<{ data: unknown[] }>("/api/v1/analytics/usage"),
};

// ─── Notifications ───────────────────────────────────────────────────────────
export const notificationsApi = {
  list: () => api.get<{ data: ApiNotification[]; unreadCount: number }>("/api/v1/notifications"),
  markRead: (id: string) => api.put(`/api/v1/notifications/${id}/read`),
  markAllRead: () => api.put("/api/v1/notifications/read-all"),
  delete: (id: string) => api.delete(`/api/v1/notifications/${id}`),
};

// ─── Admin API (super_admin only) ─────────────────────────────────────────────
export const adminApi = {
  dashboard: () =>
    api.get<{ data: AdminDashboardData }>("/api/v1/admin/dashboard"),

  organizations: (params?: { page?: number; limit?: number }) =>
    api.get<{ data: AdminOrg[]; total: number; page: number; limit: number }>(
      `/api/v1/admin/organizations?${new URLSearchParams(params as any)}`,
    ),

  organization: (id: string) =>
    api.get<{ data: { organization: AdminOrg; users: ApiUser[]; twins: unknown[]; meetings: ApiMeeting[]; subscription: unknown } }>(
      `/api/v1/admin/organizations/${id}`,
    ),

  updateOrgStatus: (id: string, status: "active" | "suspended" | "cancelled") =>
    api.patch<{ data: AdminOrg }>(`/api/v1/admin/organizations/${id}/status`, { status }),

  users: (params?: { page?: number; limit?: number }) =>
    api.get<{ data: AdminUser[]; total: number; page: number; limit: number }>(
      `/api/v1/admin/users?${new URLSearchParams(params as any)}`,
    ),

  updateUserStatus: (id: string, status: "active" | "suspended" | "banned") =>
    api.patch(`/api/v1/admin/users/${id}/status`, { status }),

  auditLogs: (params?: { page?: number; limit?: number }) =>
    api.get<{ data: AdminAuditLog[]; total: number; page: number; limit: number }>(
      `/api/v1/admin/audit-logs?${new URLSearchParams(params as any)}`,
    ),

  analytics: (days?: number) =>
    api.get<{ data: AdminAnalytics }>(`/api/v1/admin/analytics?days=${days ?? 30}`),

  plans: () =>
    api.get<{ data: ApiPlan[] }>("/api/v1/admin/plans"),

  createPlan: (body: Partial<ApiPlan>) =>
    api.post<{ data: ApiPlan }>("/api/v1/admin/plans", body),
};

// ─── Types ───────────────────────────────────────────────────────────────────
export type ApiUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  organizationId: string;
  department?: string | null;
  jobTitle?: string | null;
  avatarUrl?: string | null;
  status: string;
  lastLoginAt?: string | null;
  createdAt: string;
};

export type ApiOrg = {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
  logoUrl?: string | null;
  plan: string;
  status: string;
  maxEmployees: number;
  createdAt: string;
};

export type ApiTwin = {
  id: string;
  name: string;
  status: string;
  trainingProgress: number;
  confidenceScore: string;
  isActive: boolean;
  totalInteractions: number;
  lastTrainedAt: string | null;
  userId: string;
  organizationId: string;
  createdAt: string;
};

export type ApiMeeting = {
  id: string;
  title: string | null;
  platform: string | null;
  status: string;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  durationMinutes: number | null;
  summary: string | null;
  organizationId: string;
  createdAt: string;
};

export type ApiPlan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceMonthly: string;
  priceYearly: string;
  maxEmployees: number | null;
  maxTwins: number | null;
  features: string[];
};

export type ApiNotification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  readAt: string | null;
  actionUrl: string | null;
  createdAt: string;
};

export type OrgStats = {
  totalUsers: number;
  activeTwins: number;
  totalMeetings: number;
  totalInteractions: number;
  recentSnapshots: unknown[];
};

export type DashboardStats = OrgStats;

export type ConversationMessage = { role: "user" | "assistant"; content: string };

// ─── Admin Types ─────────────────────────────────────────────────────────────
export type AdminStats = {
  totalOrganizations: number;
  totalUsers: number;
  totalTwins: number;
  totalMeetings: number;
  activeSubscriptions: number;
  mrrUsd: number;
  arrUsd: number;
};

export type AdminOrg = ApiOrg & {
  userCount: number;
  twinCount: number;
  subscription: { planName: string; status: string; priceMonthly: string } | null;
};

export type AdminUser = ApiUser & {
  organizationName: string;
};

export type AdminAuditLog = {
  id: string;
  organizationId: string | null;
  userId: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  ipAddress: string | null;
  status: string;
  createdAt: string;
};

export type AdminDashboardData = {
  stats: AdminStats;
  recentOrganizations: Partial<AdminOrg>[];
  recentUsers: Partial<AdminUser>[];
  recentAuditLogs: AdminAuditLog[];
};

export type AdminAnalytics = {
  periodDays: number;
  newOrganizations: number;
  newUsers: number;
  newTwins: number;
  newMeetings: number;
  currentMrr: number;
  currentArr: number;
};
