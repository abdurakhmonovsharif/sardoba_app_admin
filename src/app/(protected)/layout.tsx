import * as React from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/auth/protected-route";

export const metadata: Metadata = {
  title: "Sardoba Admin",
};

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
