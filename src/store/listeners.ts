import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { setCredentials, logout } from "./auth-slice";
import { clearAuth, persistAuth } from "@/lib/storage";
import type { RootState } from ".";
import type { AuthPayload } from "./auth-slice";

export const authListenerMiddleware = createListenerMiddleware();

authListenerMiddleware.startListening({
  matcher: isAnyOf(setCredentials),
  effect: async (action, listenerApi) => {
    const payload = action.payload as AuthPayload;
    const state = listenerApi.getState() as RootState;
    const staff = payload.staff ?? state.auth.staff ?? null;
    persistAuth(payload.token, payload.refresh, staff);
  },
});

authListenerMiddleware.startListening({
  actionCreator: logout,
  effect: async () => {
    clearAuth();
  },
});
