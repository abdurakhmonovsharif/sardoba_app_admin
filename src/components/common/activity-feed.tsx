import type { ActivityItem } from "@/types";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface ActivityFeedProps {
  activity?: ActivityItem[];
}

const statusVariant: Record<ActivityItem["status"], "success" | "warning" | "danger"> = {
  success: "success",
  warning: "warning",
  error: "danger",
};

export function ActivityFeed({ activity }: ActivityFeedProps) {
  if (!activity) {
    return <p className="text-sm text-muted-foreground">No recent events</p>;
  }

  return (
    <ul className="space-y-4">
      {activity.map((item) => (
        <li key={item.id} className="rounded-xl border border-border/70 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">{item.description}</p>
              <p className="text-xs text-muted-foreground">{formatDate(item.created_at)}</p>
            </div>
            <Badge variant={statusVariant[item.status]}>{item.status}</Badge>
          </div>
        </li>
      ))}
    </ul>
  );
}
