import * as React from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted/40">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <TopBar />
        <main className="flex-1 space-y-8 bg-background px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
