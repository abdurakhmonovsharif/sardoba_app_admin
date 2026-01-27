import type * as React from "react";
import {
  BellRing,
  Cpu,
  FilePieChart,
  FolderArchive,
  LayoutDashboard,
  Newspaper,
  Settings2,
  Siren,
  UserCheck,
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
  { title: "Дашборд", href: "/dashboard", icon: LayoutDashboard, roles: ["manager"] },
  { title: "Клиенты", href: "/users", icon: Users2, roles: ["waiter", "manager"] },
  // { title: "Персонал", href: "/staff", icon: ListChecks, roles: ["manager"] },
  { title: "Официанты", href: "/waiters", icon: UserCheck, roles: ["manager"] },
  { title: "Новости", href: "/news", icon: Newspaper, roles: ["manager"] },
  { title: "Уведомления", href: "/notifications", icon: BellRing, roles: ["manager"] },
  { title: "Каталог", href: "/catalog", icon: FolderArchive, roles: ["waiter", "manager"] },
  { title: "Медиа", href: "/media", icon: FilePieChart, roles: ["manager"] },
  { title: "Отчёты", href: "/reports", icon: Siren, roles: ["manager"] },
  { title: "Настройки", href: "/settings", icon: Settings2, roles: ["manager"] },
  { title: "Аудит и DevOps", href: "/audit", icon: Cpu, roles: ["manager"] },
];
