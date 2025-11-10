import type * as React from "react";
import {
  ActivitySquare,
  BellRing,
  Cpu,
  FilePieChart,
  FolderArchive,
  LayoutDashboard,
  ListChecks,
  Newspaper,
  Settings2,
  Siren,
  Users2,
} from "lucide-react";
import type { StaffRole } from "@/types";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  roles?: StaffRole[];
  badge?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Users", href: "/users", icon: Users2 },
  { title: "Cashback & Loyalty", href: "/cashback", icon: ActivitySquare },
  { title: "Staff", href: "/staff", icon: ListChecks, roles: ["manager"] },
  { title: "News", href: "/news", icon: Newspaper },
  { title: "Notifications", href: "/notifications", icon: BellRing },
  { title: "Catalog", href: "/catalog", icon: FolderArchive },
  { title: "Media", href: "/media", icon: FilePieChart },
  { title: "Reports", href: "/reports", icon: Siren },
  { title: "Settings", href: "/settings", icon: Settings2 },
  { title: "Audit & Ops", href: "/audit", icon: Cpu, roles: ["manager"] },
];
