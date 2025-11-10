"use client";

import { PropsWithChildren, useEffect, useMemo } from "react";
import { Provider } from "react-redux";
import { makeStore, type AppStore } from ".";
import { hydrateAuth } from "./auth-slice";
import { readAuth } from "@/lib/storage";

export function StoreProvider({ children }: PropsWithChildren) {
  const store = useMemo<AppStore>(() => makeStore(), []);

  useEffect(() => {
    const cached = readAuth();
    store.dispatch(
      hydrateAuth({
        token: cached.token,
        refresh: cached.refresh,
        staff: cached.staff,
      }),
    );
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
