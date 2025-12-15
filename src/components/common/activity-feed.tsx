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

const translateDescription = (text: string) => {
  if (!text) return text;

  const staffLoginMatch = text.match(/^Staff login for\s+(\+?\d+)/i);
  if (staffLoginMatch) {
    return `Вход сотрудника ${staffLoginMatch[1]}`;
  }

  const failedLoginMatch = text.match(/^Failed login attempt for\s+(\+?\d+)/i);
  if (failedLoginMatch) {
    return `Неудачная попытка входа для ${failedLoginMatch[1]}`;
  }

  if (/^Staff login for\b/i.test(text)) {
    return "Вход сотрудника";
  }

  if (/^Failed login attempt for\b/i.test(text)) {
    return "Неудачная попытка входа";
  }

  const cashbackDeductedMatch = text.match(/^Cashback deducted:\s*(.*)$/i);
  if (cashbackDeductedMatch) {
    const details = cashbackDeductedMatch[1];
    return details ? `Списан кэшбэк: ${details}` : "Списан кэшбэк";
  }

  return text;
};

export function ActivityFeed({ activity }: ActivityFeedProps) {
  if (!activity) {
    return <p className="text-sm text-muted-foreground">Нет недавних событий</p>;
  }

  return (
    <ul className="space-y-4">
      {activity.map((item) => (
        <li key={item.id} className="rounded-xl border border-border/70 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">{translateDescription(item.description)}</p>
              <p className="text-xs text-muted-foreground">{formatDate(item.created_at)}</p>
            </div>
            <Badge variant={statusVariant[item.status]}>
              {item.status === "success" && "Успех"}
              {item.status === "warning" && "Предупреждение"}
              {item.status === "error" && "Ошибка"}
            </Badge>
          </div>
        </li>
      ))}
    </ul>
  );
}
