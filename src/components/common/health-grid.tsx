import { cn } from "@/lib/utils";
import type { SystemHealth } from "@/types";

const colorMap: Record<SystemHealth["status"], string> = {
  healthy: "text-emerald-600",
  degraded: "text-amber-600",
  down: "text-destructive",
};

export function HealthGrid({ statuses }: { statuses?: SystemHealth[] }) {
  if (!statuses?.length) return null;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {statuses.map((status) => (
        <div key={status.name} className="rounded-xl border border-border/70 bg-white p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">
            {status.name === "postgres"
              ? "PostgreSQL"
              : status.name === "redis"
                ? "Redis cache"
                : status.name === "queue"
                  ? "Фоновая очередь"
                  : status.name}
          </p>
          <p className={cn("text-lg font-semibold capitalize", colorMap[status.status])}>
            {status.status === "healthy" && "OK"}
            {status.status === "degraded" && "Замедление"}
            {status.status === "down" && "Недоступно"}
          </p>
          <p className="text-xs text-muted-foreground">
            {status.name === "postgres" && status.message?.toLowerCase().includes("reachable")
              ? "База данных доступна"
              : status.name === "redis" && status.message?.toLowerCase().includes("backend")
                ? "Кэш отвечает"
                : status.name === "queue" && status.message?.toLowerCase().includes("redis")
                  ? "Очередь на Redis"
                  : status.message}
          </p>
        </div>
      ))}
    </div>
  );
}
