import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthState, StaffMember } from "@/types";

export interface AuthPayload {
  token: string;
  refresh: string;
  staff?: StaffMember | null;
}

const initialState: AuthState = {
  staff: null,
  token: null,
  refresh: null,
  status: "idle",
  error: null,
  hydrated: false,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrateAuth(state, action: PayloadAction<Partial<AuthState>>) {
      state.staff = action.payload.staff ?? null;
      state.token = action.payload.token ?? null;
      state.refresh = action.payload.refresh ?? null;
      state.status = action.payload.token ? "succeeded" : "idle";
      state.hydrated = true;
    },
    setAuthPending(state) {
      state.status = "loading";
      state.error = null;
      state.hydrated = true;
    },
    setCredentials(state, action: PayloadAction<AuthPayload>) {
      state.status = "succeeded";
      state.error = null;
      state.token = action.payload.token;
      state.refresh = action.payload.refresh;
      if (action.payload.staff) {
        state.staff = action.payload.staff;
      }
      state.hydrated = true;
    },
    setAuthFailure(state, action: PayloadAction<string | null | undefined>) {
      state.status = "failed";
      state.error = action.payload ?? "Authentication failed";
      state.hydrated = true;
    },
    logout(state) {
      state.staff = null;
      state.token = null;
      state.refresh = null;
      state.status = "idle";
      state.error = null;
      state.hydrated = true;
    },
  },
});

export const { hydrateAuth, setAuthPending, setCredentials, setAuthFailure, logout } =
  authSlice.actions;

export default authSlice.reducer;
