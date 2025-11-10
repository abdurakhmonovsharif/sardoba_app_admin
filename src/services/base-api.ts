import {
  createApi,
  fetchBaseQuery,
  type FetchArgs,
  type BaseQueryFn,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/store";
import {
  logout,
  setAuthFailure,
  setAuthPending,
  setCredentials,
} from "@/store/auth-slice";
import type {
  ActivityItem,
  AuditLog,
  AuthLog,
  AuthResponse,
  TokenPair,
  Category,
  CashbackPayload,
  CashbackTransaction,
  DashboardMetrics,
  FileUploadResponse,
  LeaderboardRow,
  LoyaltyAnalytics,
  MediaFile,
  NewsItem,
  NotificationDraft,
  NotificationItem,
  OtpLog,
  PaginatedResponse,
  Product,
  StaffMember,
  SystemHealth,
  SystemSetting,
  Transaction,
  User,
  WaiterStat,
} from "@/types";

interface BackendPagination<T> {
  pagination: {
    page: number;
    size: number;
    total: number;
  };
  items: T[];
}

interface BackendUserListItem {
  id: number;
  name: string;
  phone: string;
  waiter_id?: number;
  date_of_birth?: string;
  profile_photo_url?: string;
  cashback_balance?: number;
  level?: string;
}

const mapUserFromList = (item: BackendUserListItem): User => {
  const [first_name = item.name, last_name = ""] = item.name?.split(" ") ?? [item.name, ""];
  return {
    id: item.id,
    first_name,
    last_name,
    name: item.name,
    phone: item.phone,
    waiter_id: item.waiter_id,
    waiter: item.waiter_id
      ? {
          id: item.waiter_id,
          name: `Waiter #${item.waiter_id}`,
          phone: "",
          role: "waiter",
        }
      : undefined,
    date_of_birth: item.date_of_birth,
    profile_photo_url: item.profile_photo_url,
    cashback_balance: item.cashback_balance,
    level: item.level,
    loyalty: {
      current_points: item.cashback_balance ?? 0,
      current_level: item.level ?? "—",
      next_level: undefined,
      next_level_threshold: undefined,
      progress_percent: undefined,
    },
    is_active: true,
    created_at: item.date_of_birth ?? new Date().toISOString(),
  };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const normalizeAuthPayload = (
  payload: unknown,
  fallbackStaff?: StaffMember | null,
): { token: string; refresh: string; staff?: StaffMember | null } | null => {
  if (!payload || typeof payload !== "object") return null;
  const source = payload as Record<string, unknown>;

  if ("tokens" in source && source.tokens && typeof source.tokens === "object") {
    const tokens = source.tokens as TokenPair;
    return {
      token: tokens.access_token,
      refresh: tokens.refresh_token,
      staff: (source.staff as StaffMember) ?? fallbackStaff ?? null,
    };
  }

  if ("access" in source && "refresh" in source) {
    return {
      token: source.access as string,
      refresh: source.refresh as string,
      staff: (source.staff as StaffMember) ?? fallbackStaff ?? null,
    };
  }

  if ("access_token" in source && "refresh_token" in source) {
    return {
      token: source.access_token as string,
      refresh: source.refresh_token as string,
      staff: fallbackStaff ?? null,
    };
  }
  return null;
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState)?.auth?.token;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    headers.set("Accept", "application/json");
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    const refresh = (api.getState() as RootState)?.auth?.refresh;
    if (!refresh) {
      api.dispatch(logout());
      return result;
    }

    const refreshResult = await rawBaseQuery(
      {
        url: "/auth/staff/refresh",
        method: "POST",
        body: { refresh, refresh_token: refresh },
      },
      api,
      extraOptions,
    );

    if (refreshResult.data) {
      const normalized = normalizeAuthPayload(refreshResult.data, (api.getState() as RootState).auth.staff);
      if (normalized) {
        api.dispatch(setCredentials(normalized));
        return rawBaseQuery(args, api, extraOptions);
      }
    }

    api.dispatch(logout());
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "sardobaApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Auth",
    "Dashboard",
    "Users",
    "Cashback",
    "Loyalty",
    "Staff",
    "News",
    "Notifications",
    "Catalog",
    "Media",
    "Stats",
    "Settings",
    "Logs",
  ],
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, { phone: string; password: string }>({
      query: (body) => ({
        url: "/auth/staff/login",
        method: "POST",
        body,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        dispatch(setAuthPending());
        try {
          const { data } = await queryFulfilled;
          const normalized = normalizeAuthPayload(data);
          if (normalized) {
            dispatch(setCredentials(normalized));
          } else {
            dispatch(setAuthFailure("Malformed auth response"));
          }
        } catch (error: unknown) {
          dispatch(setAuthFailure((error as { error?: { data?: { detail?: string } } })?.error?.data?.detail));
        }
      },
    }),
    changePassword: builder.mutation<void, { current_password: string; new_password: string }>({
      query: (body) => ({
        url: "/auth/staff/change-password",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),
    fetchDashboardMetrics: builder.query<DashboardMetrics, void>({
      query: () => ({ url: "/dashboard/metrics" }),
      providesTags: ["Dashboard"],
    }),
    fetchRecentActivity: builder.query<ActivityItem[], void>({
      query: () => ({ url: "/dashboard/activity" }),
      providesTags: ["Dashboard"],
    }),
    fetchSystemHealth: builder.query<SystemHealth[], void>({
      query: () => ({ url: "/system/health" }),
      providesTags: ["Dashboard"],
    }),
    getUsers: builder.query<PaginatedResponse<User>, Record<string, string | number | boolean> | void>({
      query: (params) => ({
        url: "/users",
        params,
      }),
      transformResponse: (response: BackendPagination<BackendUserListItem>) => ({
        data: response.items.map(mapUserFromList),
        total: response.pagination.total,
        page: response.pagination.page,
        page_size: response.pagination.size,
      }),
      providesTags: ["Users"],
    }),
    getUserById: builder.query<User, number>({
      query: (id) => ({ url: `/users/${id}` }),
      providesTags: (_result, _error, id) => [{ type: "Users", id }],
    }),
    updateUser: builder.mutation<User, { id: number; body: Partial<User> }>({
      query: ({ id, body }) => ({
        url: `/users/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Users", id }],
    }),
    deactivateUser: builder.mutation<void, { id: number; is_active: boolean }>({
      query: ({ id, is_active }) => ({
        url: `/users/${id}/status`,
        method: "POST",
        body: { is_active },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Users", id }],
    }),
    deleteUser: builder.mutation<void, number>({
      query: (id) => ({ url: `/users/${id}`, method: "DELETE" }),
      invalidatesTags: ["Users"],
    }),
    uploadProfilePhoto: builder.mutation<FileUploadResponse, FormData>({
      query: (body) => ({
        url: "/files/profile-photo",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Users", "Media"],
    }),
    resetLoyaltyLevel: builder.mutation<void, { id: number; level: string }>({
      query: ({ id, level }) => ({
        url: `/cashback/user/${id}/reset-level`,
        method: "POST",
        body: { level },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Users", id }, "Loyalty"],
    }),
    resetWallet: builder.mutation<void, { id: number }>({
      query: ({ id }) => ({
        url: `/cashback/user/${id}/reset-wallet`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Users", id }, "Cashback"],
    }),
    issueCashback: builder.mutation<Transaction, CashbackPayload>({
      query: (body) => ({
        url: "/cashback/add",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Cashback", "Users", "Stats"],
    }),
    getCashbackTransactions: builder.query<PaginatedResponse<CashbackTransaction>, Record<string, string | number | boolean> | void>({
      query: (params) => ({
        url: "/cashback",
        params,
      }),
      providesTags: ["Cashback"],
    }),
    getCashbackByUser: builder.query<{ history: CashbackTransaction[]; loyalty: LoyaltyAnalytics }, number>({
      query: (id) => ({ url: `/cashback/user/${id}` }),
      providesTags: (_result, _error, id) => [{ type: "Users", id }, "Cashback"],
    }),
    getLoyaltyAnalytics: builder.query<LoyaltyAnalytics, void>({
      query: () => ({ url: "/cashback/loyalty-analytics" }),
      providesTags: ["Loyalty"],
    }),
    getStaff: builder.query<StaffMember[], void>({
      query: () => ({ url: "/auth/staff" }),
      providesTags: ["Staff"],
    }),
    createStaff: builder.mutation<StaffMember, Partial<StaffMember>>({
      query: (body) => ({
        url: "/auth/staff",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Staff"],
    }),
    updateStaff: builder.mutation<StaffMember, { id: number; body: Partial<StaffMember> }>({
      query: ({ id, body }) => ({
        url: `/auth/staff/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Staff"],
    }),
    deleteStaff: builder.mutation<void, number>({
      query: (id) => ({ url: `/auth/staff/${id}`, method: "DELETE" }),
      invalidatesTags: ["Staff"],
    }),
    regenerateReferralCode: builder.mutation<{ referral_code: string }, number>({
      query: (id) => ({
        url: `/auth/staff/${id}/referral/regenerate`,
        method: "POST",
      }),
      invalidatesTags: ["Staff"],
    }),
    getNews: builder.query<PaginatedResponse<NewsItem>, Record<string, string | number | boolean> | void>({
      query: (params) => ({
        url: "/news",
        params,
      }),
      providesTags: ["News"],
    }),
    saveNews: builder.mutation<NewsItem, Partial<NewsItem>>({
      query: (body) => ({
        url: body.id ? `/news/${body.id}` : "/news",
        method: body.id ? "PATCH" : "POST",
        body,
      }),
      invalidatesTags: ["News"],
    }),
    deleteNews: builder.mutation<void, number>({
      query: (id) => ({ url: `/news/${id}`, method: "DELETE" }),
      invalidatesTags: ["News"],
    }),
    uploadNewsAsset: builder.mutation<FileUploadResponse, FormData>({
      query: (body) => ({
        url: "/files/news",
        method: "POST",
        body,
      }),
      invalidatesTags: ["News", "Media"],
    }),
    getNotifications: builder.query<PaginatedResponse<NotificationItem>, Record<string, string | number | boolean> | void>({
      query: (params) => ({
        url: "/notifications",
        params,
      }),
      transformResponse: (response: BackendPagination<NotificationItem>) => ({
        data: response.items,
        total: response.pagination.total,
        page: response.pagination.page,
        page_size: response.pagination.size,
      }),
      providesTags: ["Notifications"],
    }),
    saveNotification: builder.mutation<NotificationItem, NotificationDraft>({
      query: (body) => {
        const method = body.id ? "PATCH" : "POST";
        const url = body.id ? `/notifications/${body.id}` : "/notifications";
        const payload = { title: body.title, description: body.description };
        return {
          url,
          method,
          body: payload,
        };
      },
      invalidatesTags: ["Notifications"],
    }),
    getCategories: builder.query<Category[], void>({
      query: () => ({ url: "/catalog/categories" }),
      providesTags: ["Catalog"],
    }),
    saveCategory: builder.mutation<Category, Partial<Category>>({
      query: (body) => ({
        url: body.id ? `/catalog/categories/${body.id}` : "/catalog/categories",
        method: body.id ? "PATCH" : "POST",
        body,
      }),
      invalidatesTags: ["Catalog"],
    }),
    getProducts: builder.query<PaginatedResponse<Product>, Record<string, string | number | boolean> | void>({
      query: (params) => ({
        url: "/catalog/products",
        params,
      }),
      providesTags: ["Catalog"],
    }),
    saveProduct: builder.mutation<Product, Partial<Product>>({
      query: (body) => ({
        url: body.id ? `/catalog/products/${body.id}` : "/catalog/products",
        method: body.id ? "PATCH" : "POST",
        body,
      }),
      invalidatesTags: ["Catalog"],
    }),
    syncMenu: builder.mutation<{ status: string }, void>({
      query: () => ({ url: "/catalog/sync", method: "POST" }),
      invalidatesTags: ["Catalog"],
    }),
    getMediaLibrary: builder.query<PaginatedResponse<MediaFile>, Record<string, string | number | boolean> | void>({
      query: (params) => ({ url: "/files", params }),
      providesTags: ["Media"],
    }),
    deleteMedia: builder.mutation<void, number>({
      query: (id) => ({ url: `/files/${id}`, method: "DELETE" }),
      invalidatesTags: ["Media"],
    }),
    getWaiterStats: builder.query<WaiterStat[], void>({
      query: () => ({ url: "/cashback/waiter-stats" }),
      providesTags: ["Stats"],
    }),
    getTopUsers: builder.query<LeaderboardRow[], void>({
      query: () => ({ url: "/cashback/top-users" }),
      providesTags: ["Stats"],
    }),
    exportUsers: builder.query<Blob, { format?: "csv" | "xlsx" }>({
      query: ({ format = "csv" }) => ({
        url: "/reports/users/export",
        params: { format },
        responseHandler: async (response) => response.blob(),
      }),
    }),
    exportCashback: builder.query<Blob, { format?: "csv" | "xlsx" }>({
      query: ({ format = "csv" }) => ({
        url: "/reports/cashback/export",
        params: { format },
        responseHandler: async (response) => response.blob(),
      }),
    }),
    getSystemSettings: builder.query<SystemSetting[], void>({
      query: () => ({ url: "/system/settings" }),
      providesTags: ["Settings"],
    }),
    flushCache: builder.mutation<{ status: string }, void>({
      query: () => ({ url: "/system/cache/flush", method: "POST" }),
      invalidatesTags: ["Settings"],
    }),
    getValidationLogs: builder.query<PaginatedResponse<Record<string, unknown>>, Record<string, string | number | boolean> | void>({
      query: (params) => ({ url: "/logs/validation", params }),
      providesTags: ["Logs"],
    }),
    getOtpLogs: builder.query<PaginatedResponse<OtpLog>, Record<string, string | number | boolean> | void>({
      query: (params) => ({ url: "/logs/otp", params }),
      providesTags: ["Logs"],
    }),
    getAuthLogs: builder.query<PaginatedResponse<AuthLog>, Record<string, string | number | boolean> | void>({
      query: (params) => ({ url: "/logs/auth", params }),
      providesTags: ["Logs"],
    }),
    getAuditLogs: builder.query<PaginatedResponse<AuditLog>, Record<string, string | number | boolean> | void>({
      query: (params) => ({ url: "/logs/audit", params }),
      providesTags: ["Logs"],
    }),
    getDbRevision: builder.query<{ revision: string }, void>({
      query: () => ({ url: "/devops/alembic" }),
      providesTags: ["Settings"],
    }),
    pingService: builder.query<SystemHealth, { service: "redis" | "postgres" | "queue" }>({
      query: ({ service }) => ({ url: `/system/ping/${service}` }),
    }),
  }),
});

export const {
  useLoginMutation,
  useChangePasswordMutation,
  useFetchDashboardMetricsQuery,
  useFetchRecentActivityQuery,
  useFetchSystemHealthQuery,
  useGetUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useDeactivateUserMutation,
  useDeleteUserMutation,
  useUploadProfilePhotoMutation,
  useResetLoyaltyLevelMutation,
  useResetWalletMutation,
  useIssueCashbackMutation,
  useGetCashbackTransactionsQuery,
  useGetCashbackByUserQuery,
  useGetLoyaltyAnalyticsQuery,
  useGetStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  useRegenerateReferralCodeMutation,
  useGetNewsQuery,
  useSaveNewsMutation,
  useDeleteNewsMutation,
  useUploadNewsAssetMutation,
  useGetNotificationsQuery,
  useSaveNotificationMutation,
  useGetCategoriesQuery,
  useSaveCategoryMutation,
  useGetProductsQuery,
  useSaveProductMutation,
  useSyncMenuMutation,
  useGetMediaLibraryQuery,
  useDeleteMediaMutation,
  useGetWaiterStatsQuery,
  useGetTopUsersQuery,
  useExportUsersQuery,
  useLazyExportUsersQuery,
  useExportCashbackQuery,
  useLazyExportCashbackQuery,
  useGetSystemSettingsQuery,
  useFlushCacheMutation,
  useGetValidationLogsQuery,
  useGetOtpLogsQuery,
  useGetAuthLogsQuery,
  useGetAuditLogsQuery,
  useGetDbRevisionQuery,
  usePingServiceQuery,
} = baseApi;
