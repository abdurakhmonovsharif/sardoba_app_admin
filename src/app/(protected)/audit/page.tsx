"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeader } from "@/components/common/section-header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  useGetAuthLogsQuery,
  useGetOtpLogsQuery,
  useGetValidationLogsQuery,
  useGetAuditLogsQuery,
} from "@/services/base-api";
import { formatDate } from "@/lib/utils";

export default function AuditPage() {
  const [tab, setTab] = useState("auth");
  const authLogs = useGetAuthLogsQuery({ page: 1, page_size: 20 }, { skip: tab !== "auth" });
  const otpLogs = useGetOtpLogsQuery({ page: 1, page_size: 20 }, { skip: tab !== "otp" });
  const validationLogs = useGetValidationLogsQuery({ page: 1, page_size: 20 }, { skip: tab !== "validation" });
  const auditLogs = useGetAuditLogsQuery({ page: 1, page_size: 20 }, { skip: tab !== "audit" });

  const renderList = () => {
    switch (tab) {
      case "auth":
        return (
          <LogList
            items={authLogs.data?.data?.map((log) => ({
              id: log.id,
              title: log.event,
              subtitle: `Субъект ${log.actor_type} #${log.actor_id}`,
              timestamp: log.created_at,
            }))}
          />
        );
      case "otp":
        return (
          <LogList
            items={otpLogs.data?.data?.map((log) => ({
              id: log.id,
              title: `${log.phone} - ${log.status}`,
              subtitle: log.metadata ? JSON.stringify(log.metadata) : "",
              timestamp: log.created_at,
            }))}
          />
        );
      case "validation":
        return (
          <LogList
            items={validationLogs.data?.data?.map((log, index) => ({
              id: index,
              title: JSON.stringify(log),
              subtitle: "Ошибка валидации",
              timestamp: new Date().toISOString(),
            }))}
          />
        );
      case "audit":
        return (
          <LogList
            items={auditLogs.data?.data?.map((log) => ({
              id: log.id,
              title: `${log.actor.name} ${log.action}`,
              subtitle: `${log.entity} #${log.entity_id}`,
              timestamp: log.created_at,
            }))}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Аудит и мониторинг" description="Логи авторизаций, OTP и валидационные ошибки" />
      <Card>
        <CardHeader>
          <CardTitle>Логи</CardTitle>
          <CardDescription>Онлайн данные из таблиц аудита</CardDescription>
        </CardHeader>
        <div className="p-6 pt-0">
          <Tabs defaultValue="auth" value={tab} onValueChange={setTab}>
            <TabsList className="mb-4">
              {[
                { value: "auth", label: "Авторизация" },
                { value: "otp", label: "OTP" },
                { value: "validation", label: "Валидация" },
                { value: "audit", label: "Действия админов" },
              ].map((item) => (
                <TabsTrigger key={item.value} value={item.value}>
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <div>{renderList()}</div>
          </Tabs>
        </div>
      </Card>
    </div>
  );
}

function LogList({ items }: { items?: { id: number | string; title: string; subtitle?: string; timestamp: string }[] }) {
  if (!items?.length) return <p className="text-sm text-muted-foreground">Нет записей</p>;
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="rounded-xl border border-border/70 p-3">
          <p className="font-semibold">{item.title}</p>
          {item.subtitle && <p className="text-xs text-muted-foreground">{item.subtitle}</p>}
          <p className="text-xs text-muted-foreground">{formatDate(item.timestamp)}</p>
        </li>
      ))}
    </ul>
  );
}
