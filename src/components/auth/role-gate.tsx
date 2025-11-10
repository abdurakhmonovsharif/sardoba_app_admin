"use client";

import * as React from "react";
import { useAppSelector } from "@/store/hooks";
import type { StaffRole } from "@/types";

const roleRank: Record<StaffRole, number> = {
  waiter: 1,
  manager: 2,
};

interface RoleGateProps {
  minRole: StaffRole;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RoleGate({ minRole, fallback = null, children }: RoleGateProps) {
  const staff = useAppSelector((state) => state.auth.staff);
  if (!staff) return null;
  return roleRank[staff.role] >= roleRank[minRole] ? <>{children}</> : <>{fallback}</>;
}
