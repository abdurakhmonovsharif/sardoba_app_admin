"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";

export function Sidebar() {
  const pathname = usePathname();
  const staff = useAppSelector((state) => state.auth.staff);

  return (
    <aside className="hidden w-72 flex-col border-r border-border/60 bg-white px-5 py-6 shadow-sm lg:flex">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Sardoba Admin</p>
        <h1 className="text-2xl font-semibold">Control Center</h1>
        {process.env.NEXT_PUBLIC_ENV_LABEL && (
          <span className="mt-2 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
            {process.env.NEXT_PUBLIC_ENV_LABEL}
          </span>
        )}
      </div>
      <nav className="flex-1 space-y-2">
        {NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(staff?.role ?? "waiter")).map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:bg-muted/70",
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
      {staff && (
        <div className="mt-6 rounded-2xl border border-border/70 bg-muted/50 p-4 text-sm">
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <p className="font-semibold">{staff.name}</p>
          <p className="text-xs capitalize text-muted-foreground">{staff.role}</p>
        </div>
      )}
    </aside>
  );
}
