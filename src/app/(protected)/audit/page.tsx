"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeader } from "@/components/common/section-header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useGetAuthLogsQuery,
  useGetOtpLogsQuery,
  useGetValidationLogsQuery,
  useGetAuditLogsQuery,
} from "@/services/base-api";
import { formatDate } from "@/lib/utils";

export default function AuditPage() {
  const [tab, setTab] = useState("auth");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const authLogs = useGetAuthLogsQuery({ page, page_size: pageSize }, { skip: tab !== "auth" });
  const otpLogs = useGetOtpLogsQuery({ page, page_size: pageSize }, { skip: tab !== "otp" });
  const validationLogs = useGetValidationLogsQuery({ page, page_size: pageSize }, { skip: tab !== "validation" });
  const auditLogs = useGetAuditLogsQuery({ page, page_size: pageSize }, { skip: tab !== "audit" });

  const currentQuery =
    tab === "auth"
      ? authLogs
      : tab === "otp"
        ? otpLogs
        : tab === "validation"
          ? validationLogs
          : auditLogs;

  const renderList = () => {
    switch (tab) {
      case "auth":
        return (
          <LogList
            items={authLogs.data?.data?.map((log) => ({
              id: log.id,
              title: log.event,
              subtitle: [
                log.user?.name ? `Пользователь: ${log.user.name}` : null,
                log.phone ? `Телефон: ${log.phone}` : null,
                log.ip ? `IP: ${log.ip}` : null,
                `Субъект ${log.actor_type} #${log.actor_id}`,
              ]
                .filter(Boolean)
                .join(" · "),
              timestamp: log.created_at,
            }))}
            isLoading={authLogs.isFetching}
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
            isLoading={otpLogs.isFetching}
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
            isLoading={validationLogs.isFetching}
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
            isLoading={auditLogs.isFetching}
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
          <Tabs
            defaultValue="auth"
            value={tab}
            onValueChange={(value) => {
              setTab(value);
              setPage(1);
            }}
          >
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
            <div className="space-y-4">
              {renderList()}
              <Pagination
                page={page}
                pageSize={pageSize}
                total={currentQuery.data?.total ?? 0}
                isLoading={currentQuery.isFetching}
                onPageChange={setPage}
              />
            </div>
          </Tabs>
        </div>
      </Card>
    </div>
  );
}

function LogList({
  items,
  isLoading,
}: {
  items?: { id: number | string; title: string; subtitle?: string; timestamp: string }[];
  isLoading?: boolean;
}) {
  if (isLoading) return <p className="text-sm text-muted-foreground">Загрузка...</p>;
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

function Pagination({
  page,
  pageSize,
  total,
  isLoading,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
}) {
  const hasPrev = page > 1;
  const hasNext = page * pageSize < total;

  if (!total) return null;

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Страница {page} · {Math.min(page * pageSize, total)} из {total}
      </span>
      <div className="space-x-2">
        <Button variant="outline" size="sm" disabled={!hasPrev || isLoading} onClick={() => onPageChange(page - 1)}>
          Назад
        </Button>
        <Button variant="outline" size="sm" disabled={!hasNext || isLoading} onClick={() => onPageChange(page + 1)}>
          Далее
        </Button>
      </div>
    </div>
  );
}
