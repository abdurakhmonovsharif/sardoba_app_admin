import { cn } from "@/lib/utils";
import type { SystemHealth } from "@/types";

const colorMap: Record<SystemHealth["status"], string> = {
  healthy: "text-emerald-600",
  degraded: "text-amber-600",
  down: "text-destructive",
};

export function HealthGrid({ statuses }: { statuses?: SystemHealth[] }) {
  if (!statuses) return null;
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {statuses.map((status) => (
        <div key={status.name} className="rounded-xl border border-border/70 bg-white p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">{status.name}</p>
          <p className={cn("text-lg font-semibold capitalize", colorMap[status.status])}>{status.status}</p>
          <p className="text-xs text-muted-foreground">{status.message}</p>
        </div>
      ))}
    </div>
  );
}
