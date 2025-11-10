"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import * as React from "react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS } from "@/config/navigation";
import { useAppSelector } from "@/store/hooks";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const staff = useAppSelector((state) => state.auth.staff);

  return (
    <div className="lg:hidden">
      <Button variant="outline" className="rounded-full p-2" onClick={() => setOpen(true)}>
        <Menu className="h-4 w-4" />
      </Button>
      <Drawer title="Navigation" isOpen={open} onClose={() => setOpen(false)} widthClass="max-w-sm">
        <nav className="space-y-2">
          {NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(staff?.role ?? "waiter")).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block rounded-xl px-4 py-2 text-sm font-medium",
                pathname.startsWith(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground",
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>
      </Drawer>
    </div>
  );
}
