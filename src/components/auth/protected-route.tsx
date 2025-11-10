"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { useAppSelector } from "@/store/hooks";
import type { StaffRole } from "@/types";

const roleRank: Record<StaffRole, number> = {
  waiter: 1,
  manager: 2,
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  minRole?: StaffRole;
}

export function ProtectedRoute({ children, minRole = "waiter" }: ProtectedRouteProps) {
  const auth = useAppSelector((state) => state.auth);
  const router = useRouter();

  React.useEffect(() => {
    if (!auth.hydrated) return;

    if (!auth.token) {
      router.replace("/login");
    } else if (auth.staff && roleRank[auth.staff.role] < roleRank[minRole]) {
      router.replace("/dashboard");
    }
  }, [auth.hydrated, auth.staff, auth.token, minRole, router]);

  if (!auth.hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Checking permissions...</p>
      </div>
    );
  }

  if (!auth.token) {
    return null;
  }

  if (auth.staff && roleRank[auth.staff.role] < roleRank[minRole]) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Insufficient permissions</p>
      </div>
    );
  }

  return <>{children}</>;
}
