import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number;
  change?: string;
  currency?: boolean;
  icon?: LucideIcon;
  gradient?: string;
}

export function MetricCard({ title, value, change, currency, icon: Icon, gradient }: MetricCardProps) {
  return (
    <div className={cn("rounded-2xl border border-border bg-white p-5 shadow-sm", gradient)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold">
            {currency ? formatCurrency(value) : formatNumber(value)}
          </p>
        </div>
        {Icon && (
          <span className="rounded-full bg-primary/10 p-3 text-primary">
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
      {change && <p className="mt-2 text-xs text-emerald-600">{change}</p>}
    </div>
  );
}
