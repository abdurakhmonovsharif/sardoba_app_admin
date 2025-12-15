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
  LoyaltySummary,
  MediaFile,
  NewsItem,
  NotificationDraft,
  NotificationItem,
  OtpLog,
  PaginatedResponse,
  Product,
  StaffMember,
  StaffRole,
  StaffListResponse,
  WaiterCreatePayload,
  WaiterUpdatePayload,
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
  created_at?: string;
  first_name?: string;
  last_name?: string;
  profile_photo_url?: string;
  cashback_balance?: number;
  level?: string;
}

interface BackendLoyalty
  extends Partial<
    Record<
      | "level"
      | "current_level"
      | "current_level_points"
      | "current_level_min_points"
      | "next_level"
      | "next_level_req_points"
      | "next_level_req_level"
      | "points_to_next_level"
      | "next_level_cashback_percent"
      | "next_level_progress"
      | "cashback_balance",
      number | string
    >
  > {}

interface BackendUserDetail extends BackendUserListItem {
  email?: string | null;
  gender?: string | null;
  surname?: string | null;
  middleName?: string | null;
  is_deleted?: boolean;
  updated_at?: string;
  waiter?: StaffMember;
  loyalty?: BackendLoyalty;
  transactions?: Array<
    BackendUserListItem & {
      id: number;
      amount: number;
      description?: string;
      user_id?: number;
      branch?: string | null;
      source?: string | null;
      staff_id?: number | null;
      staff?: StaffMember | null;
      balance_before?: number | null;
      balance_after?: number | null;
    }
  >;
  files?: MediaFile[];
}

interface BackendProduct {
  id: number;
  name: string;
  price: number;
  category_id?: number;
  category?: Category;
  is_active?: boolean;
  image_url?: string | null;
}

const toAbsoluteUrl = (path?: string | null) => {
  if (!path) return path ?? undefined;
  if (/^https?:\/\//i.test(path)) return path;

  const base = process.env.NEXT_PUBLIC_API_URL;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (base) {
    try {
      // new URL keeps host from base and respects leading slash in path (avoids double /api/v1/api/v1)
      return new URL(normalizedPath, base).toString();
    } catch (error) {
      console.warn("Failed to build absolute URL", error);
    }
  }

  return normalizedPath;
};

const mapUserFromList = (item: BackendUserListItem): User => {
  const [first_from_name = item.name, last_from_name = ""] = item.name?.split(" ") ?? [item.name, ""];
  return {
    id: item.id,
    first_name: item.first_name ?? first_from_name,
    last_name: item.last_name ?? last_from_name,
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
    profile_photo_url: toAbsoluteUrl(item.profile_photo_url),
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
    created_at: item.created_at,
  };
};

const mapLoyalty = (item: BackendUserDetail): LoyaltySummary => {
  const source = item.loyalty ?? null;
  const currentPoints =
    (typeof source?.current_level_points === "number" ? source.current_level_points : undefined) ??
    (typeof source?.cashback_balance === "number" ? source.cashback_balance : undefined) ??
    item.cashback_balance ??
    0;

  const nextLevelThreshold =
    (typeof source?.points_to_next_level === "number" ? source.points_to_next_level : undefined) ??
    (typeof source?.next_level_req_points === "number" ? source.next_level_req_points : undefined);

  return {
    current_points: currentPoints,
    current_level:
      (typeof source?.level === "string" ? source.level : undefined) ??
      (typeof source?.current_level === "string" ? source.current_level : undefined) ??
      item.level ??
      "—",
    next_level:
      (typeof source?.next_level_req_level === "string" ? source.next_level_req_level : undefined) ??
      (typeof source?.next_level === "string" ? source.next_level : undefined),
    next_level_threshold: nextLevelThreshold,
    next_level_cashback_percent:
      typeof source?.next_level_cashback_percent === "number" ? source.next_level_cashback_percent : undefined,
    progress_percent: typeof source?.next_level_progress === "number" ? source.next_level_progress : undefined,
  };
};

const mapUserFromDetail = (item: BackendUserDetail): User => {
  const [first_from_name = item.name, ...rest] = item.name?.split(" ") ?? [item.name];
  const last_from_name = rest.join(" ");

  return {
    ...mapUserFromList(item),
    first_name: item.first_name ?? first_from_name,
    last_name: item.last_name ?? last_from_name,
    waiter: normalizeStaffMember(item.waiter) ?? undefined,
    email: item.email ?? null,
    gender: item.gender ?? null,
    surname: item.surname ?? null,
    middleName: item.middleName ?? null,
    is_deleted: item.is_deleted ?? false,
    updated_at: item.updated_at,
    profile_photo_url: toAbsoluteUrl(item.profile_photo_url),
    loyalty: mapLoyalty(item),
    transactions:
      item.transactions?.map((tx) => ({
        id: tx.id,
        amount: tx.amount,
        description: tx.description ?? "Cashback",
        created_at: tx.created_at ?? new Date().toISOString(),
        branch: tx.branch ?? undefined,
        source: tx.source ?? undefined,
        staff: tx.staff ? normalizeStaffMember(tx.staff) ?? undefined : undefined,
        staff_id: tx.staff_id ?? undefined,
        balance_before: tx.balance_before ?? undefined,
        balance_after: tx.balance_after ?? undefined,
      })) ?? [],
    files: item.files?.map((file) => ({
      ...file,
      url: toAbsoluteUrl(file.url) ?? file.url,
    })),
  };
};

const mapProduct = (item: BackendProduct): Product => ({
  id: item.id,
  name: item.name,
  price: item.price,
  category:
    item.category ??
    ({
      id: item.category_id ?? 0,
      name: `Category #${item.category_id ?? "—"}`,
      is_active: true,
      image_url: undefined,
    } satisfies Category),
  image_url: item.image_url ?? undefined,
  is_active: item.is_active ?? true,
});

// Use Next.js API proxy to bypass CORS issues when communicating with backend
const PROXY_BASE_URL = "/api/proxy";

const normalizeRole = (role?: string): StaffRole => {
  const normalized = role?.toLowerCase();
  if (normalized === "manager") return "manager";
  return "waiter";
};

const normalizeStaffMember = (staff?: StaffMember | null): StaffMember | null => {
  if (!staff) return null;
  return { ...staff, role: normalizeRole(staff.role as string) };
};

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
      staff: normalizeStaffMember((source.staff as StaffMember) ?? fallbackStaff ?? null),
    };
  }

  if ("access" in source && "refresh" in source) {
    return {
      token: source.access as string,
      refresh: source.refresh as string,
      staff: normalizeStaffMember((source.staff as StaffMember) ?? fallbackStaff ?? null),
    };
  }

  if ("access_token" in source && "refresh_token" in source) {
    return {
      token: source.access_token as string,
      refresh: source.refresh_token as string,
      staff: normalizeStaffMember(fallbackStaff ?? null),
    };
  }
  return null;
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: PROXY_BASE_URL,
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
  if (result.error?.status === 401 || result.error?.status === 403) {
    const refresh = (api.getState() as RootState)?.auth?.refresh;
    if (!refresh) {
      api.dispatch(logout());
      return result;
    }

    const refreshResult = await rawBaseQuery(
      {
        url: "/auth/refresh",
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
      query: () => ({ url: "/health" }),
      providesTags: ["Dashboard"],
    }),
  getUsers: builder.query<PaginatedResponse<User>, Record<string, string | number | boolean> | undefined>({
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
      transformResponse: (response: BackendUserDetail) => mapUserFromDetail(response),
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
  getCashbackTransactions: builder.query<PaginatedResponse<CashbackTransaction>, Record<string, string | number | boolean> | undefined>({
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
    getWaiters: builder.query<PaginatedResponse<StaffMember>, { search?: string; page?: number; size?: number } | undefined>({
      query: (params) => ({
        url: "/waiters",
        params,
      }),
      transformResponse: (response: StaffListResponse) => ({
        data: response.items,
        total: response.pagination.total,
        page: response.pagination.page,
        page_size: response.pagination.size,
      }),
      providesTags: ["Staff"],
    }),
    getWaiterById: builder.query<StaffMember, number>({
      query: (id) => ({ url: `/waiters/${id}` }),
      providesTags: (_result, _error, id) => [{ type: "Staff", id }],
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
    createWaiter: builder.mutation<StaffMember, WaiterCreatePayload>({
      query: (body) => ({
        url: "/waiters",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Staff"],
    }),
    updateWaiter: builder.mutation<StaffMember, { id: number; body: WaiterUpdatePayload }>({
      query: ({ id, body }) => ({
        url: `/waiters/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Staff", id }, "Staff"],
    }),
    deleteWaiter: builder.mutation<void, number>({
      query: (id) => ({ url: `/waiters/${id}`, method: "DELETE" }),
      invalidatesTags: ["Staff"],
    }),
    getNews: builder.query<PaginatedResponse<NewsItem>, Record<string, string | number | boolean> | undefined>({
      query: (params) => ({
        url: "/news",
        params,
      }),
      transformResponse: (response: PaginatedResponse<NewsItem> | NewsItem[]) => {
        if (Array.isArray(response)) {
          const data = response;
          return {
            data,
            total: data.length,
            page: 1,
            page_size: data.length,
          };
        }
        return response;
      },
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
    uploadNewsImage: builder.mutation<FileUploadResponse, FormData>({
      query: (body) => ({
        url: "/files/news_images",
        method: "POST",
        body,
      }),
      invalidatesTags: ["News", "Media"],
    }),
    deleteNewsImage: builder.mutation<void, string>({
      query: (fileName) => ({
        url: `/files/news_images/${encodeURIComponent(fileName)}`,
        method: "DELETE",
      }),
      invalidatesTags: ["News"],
    }),
  getNotifications: builder.query<PaginatedResponse<NotificationItem>, Record<string, string | number | boolean> | undefined>({
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
    deleteNotification: builder.mutation<void, number>({
      query: (id) => ({ url: `/notifications/${id}`, method: "DELETE" }),
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
  getProducts: builder.query<PaginatedResponse<Product>, Record<string, string | number | boolean> | undefined>({
      query: (params) => ({
        url: "/catalog/products",
        params,
      }),
      transformResponse: (response: PaginatedResponse<Product> | BackendProduct[] | BackendPagination<BackendProduct>) => {
        if (Array.isArray(response)) {
          const data = response.map(mapProduct);
          return {
            data,
            total: data.length,
            page: 1,
            page_size: data.length,
          };
        }

        if ("items" in response && response.items && "pagination" in response) {
          const typed = response as BackendPagination<BackendProduct>;
          return {
            data: typed.items.map(mapProduct),
            total: typed.pagination.total,
            page: typed.pagination.page,
            page_size: typed.pagination.size,
          };
        }

        const paginated = response as PaginatedResponse<BackendProduct>;
        return {
          ...paginated,
          data: paginated.data.map(mapProduct),
        };
      },
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
  getMediaLibrary: builder.query<PaginatedResponse<MediaFile>, Record<string, string | number | boolean> | undefined>({
      query: (params) => ({ url: "/files", params }),
      providesTags: ["Media"],
    }),
    deleteMedia: builder.mutation<void, number>({
      query: (id) => ({ url: `/files/${id}`, method: "DELETE" }),
      invalidatesTags: ["Media"],
    }),
    getWaiterStats: builder.query<WaiterStat[], void>({
      query: () => ({ url: "/cashback/waiter-stats" }),
      transformResponse: (response: WaiterStat[]) =>
        response.map((item) => ({
          ...item,
          clients_count: (item as WaiterStat & { clients_count?: number }).clients_count ?? item.transactions ?? 0,
          total_cashback: (item as WaiterStat & { total_cashback?: number }).total_cashback ?? 0,
          transactions: item.transactions ?? 0,
        })),
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
  getValidationLogs: builder.query<PaginatedResponse<Record<string, unknown>>, Record<string, string | number | boolean> | undefined>({
      query: (params) => ({ url: "/logs/validation", params }),
      providesTags: ["Logs"],
    }),
  getOtpLogs: builder.query<PaginatedResponse<OtpLog>, Record<string, string | number | boolean> | undefined>({
      query: (params) => ({ url: "/logs/otp", params }),
      providesTags: ["Logs"],
    }),
  getAuthLogs: builder.query<PaginatedResponse<AuthLog>, Record<string, string | number | boolean> | undefined>({
      query: (params) => ({ url: "/logs/auth", params }),
      providesTags: ["Logs"],
    }),
  getAuditLogs: builder.query<PaginatedResponse<AuditLog>, Record<string, string | number | boolean> | undefined>({
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
  useGetWaitersQuery,
  useGetWaiterByIdQuery,
  useCreateWaiterMutation,
  useUpdateWaiterMutation,
  useDeleteWaiterMutation,
  useGetNewsQuery,
  useSaveNewsMutation,
  useDeleteNewsMutation,
  useUploadNewsImageMutation,
  useDeleteNewsImageMutation,
  useGetNotificationsQuery,
  useSaveNotificationMutation,
  useDeleteNotificationMutation,
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
