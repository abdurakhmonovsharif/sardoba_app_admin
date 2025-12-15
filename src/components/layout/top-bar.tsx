"use client";

import { Bell, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/auth-slice";
import { MobileNav } from "./mobile-nav";

export function TopBar() {
  const staff = useAppSelector((state) => state.auth.staff);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleLogout = () => {
    dispatch(logout());
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center gap-4 border-b border-border/60 bg-white/80 px-4 py-4 backdrop-blur lg:px-6">
      <MobileNav />
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <Button variant="outline" className="rounded-full p-2" aria-label="Уведомления">
          <Bell className="h-4 w-4" />
        </Button>
        {staff && (
          <div className="text-right">
            <p className="text-sm font-semibold">{staff.name}</p>
            <p className="text-xs text-muted-foreground">{staff.role.toUpperCase()}</p>
          </div>
        )}
        <Button variant="outline" onClick={handleLogout} leftIcon={<LogOut className="h-4 w-4" />}>
          Выйти
        </Button>
      </div>
    </header>
  );
}
