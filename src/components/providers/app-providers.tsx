"use client";

import { PropsWithChildren } from "react";
import { Toaster } from "sonner";
import { StoreProvider } from "@/store/provider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <StoreProvider>
      {children}
      <Toaster position="top-right" richColors closeButton duration={4000} />
    </StoreProvider>
  );
}
