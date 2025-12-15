"use client";

import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { useAppSelector } from "@/store/hooks";
import type { StaffRole } from "@/types";
import { NAV_ITEMS } from "@/config/navigation";

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
  const pathname = usePathname();

  const allowedHrefs = React.useMemo(() => {
    if (!auth.staff) return [];
    return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(auth.staff!.role)).map((item) => item.href);
  }, [auth.staff]);

  React.useEffect(() => {
    if (!auth.hydrated) return;

    if (!auth.token) {
      router.replace("/login");
    } else if (auth.staff && roleRank[auth.staff.role] < roleRank[minRole]) {
      router.replace("/dashboard");
    } else if (auth.staff?.role === "waiter") {
      const isAllowed = allowedHrefs.some((href) => pathname.startsWith(href));
      if (!isAllowed && allowedHrefs.length) {
        router.replace(allowedHrefs[0]);
      }
    }
  }, [auth.hydrated, auth.staff, auth.token, minRole, router, allowedHrefs, pathname]);

  if (!auth.hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Проверяем доступ...</p>
      </div>
    );
  }

  if (!auth.token) {
    return null;
  }

  if (auth.staff && roleRank[auth.staff.role] < roleRank[minRole]) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Недостаточно прав</p>
      </div>
    );
  }

  return <>{children}</>;
}
