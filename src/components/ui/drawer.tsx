"use client";

import { X } from "lucide-react";
import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface DrawerProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  widthClass?: string;
  children: React.ReactNode;
}

export function Drawer({ title, isOpen, onClose, widthClass = "max-w-3xl", children }: DrawerProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <div className={cn("fixed inset-0 z-50", isOpen ? "pointer-events-auto" : "pointer-events-none")}>
      <div
        role="button"
        tabIndex={-1}
        aria-label="Close drawer"
        onClick={onClose}
        onKeyDown={(event) => event.key === "Escape" && onClose()}
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity",
          isOpen ? "opacity-100" : "opacity-0",
        )}
      />
      <aside
        className={cn(
          "absolute right-0 top-0 flex h-full w-full flex-col bg-white shadow-2xl transition-transform dark:bg-slate-900",
          widthClass,
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Details</p>
            <h3 className="text-xl font-semibold">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-border p-2 text-muted-foreground transition hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}
