import Cookies from "js-cookie";

const TOKEN_KEY = "sardoba_admin_token";
const REFRESH_KEY = "sardoba_admin_refresh";
const STAFF_KEY = "sardoba_admin_staff";

const isBrowser = () => typeof window !== "undefined";

const cookieOptions = () => ({
  sameSite: "strict" as const,
  secure: typeof window !== "undefined" ? window.location.protocol === "https:" : true,
});

export const persistAuth = (token: string, refresh: string, staff: unknown) => {
  if (!isBrowser()) return;
  Cookies.set(TOKEN_KEY, token, { ...cookieOptions(), expires: 7 });
  Cookies.set(REFRESH_KEY, refresh, { ...cookieOptions(), expires: 30 });
  if (staff) {
    localStorage.setItem(STAFF_KEY, JSON.stringify(staff));
  }
};

export const clearAuth = () => {
  if (!isBrowser()) return;
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(REFRESH_KEY);
  localStorage.removeItem(STAFF_KEY);
};

export const readAuth = () => {
  if (!isBrowser()) return { token: null, refresh: null, staff: null };
  try {
    const token = Cookies.get(TOKEN_KEY) ?? null;
    const refresh = Cookies.get(REFRESH_KEY) ?? null;
    const staffRaw = localStorage.getItem(STAFF_KEY);
    return {
      token,
      refresh,
      staff: staffRaw ? JSON.parse(staffRaw) : null,
    };
  } catch (error) {
    console.error("Failed to read auth cache", error);
    return { token: null, refresh: null, staff: null };
  }
};
