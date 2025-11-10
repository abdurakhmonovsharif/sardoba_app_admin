"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

export function Tabs({ defaultValue, value: controlledValue, onValueChange, children }: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const value = controlledValue ?? internalValue;
  const setValue = (next: string) => {
    if (controlledValue === undefined) {
      setInternalValue(next);
    }
    onValueChange?.(next);
  };
  return <TabsContext.Provider value={{ value, setValue }}>{children}</TabsContext.Provider>;
}

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("inline-flex rounded-full bg-muted p-1", className)} {...props} />;
}

export function TabsTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("TabsTrigger must be used within Tabs");
  const isActive = ctx.value === value;
  return (
    <button
      onClick={() => ctx.setValue(value)}
      className={cn(
        "rounded-full px-4 py-1 text-sm font-medium transition",
        isActive ? "bg-white text-foreground shadow" : "text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("TabsContent must be used within Tabs");
  if (ctx.value !== value) return null;
  return <div>{children}</div>;
}
