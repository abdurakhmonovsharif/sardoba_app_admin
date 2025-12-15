"use client";

import Link from "next/link";
import { Activity, Gift, ShieldCheck, Users2 } from "lucide-react";
import { MetricCard } from "@/components/common/metric-card";
import { ActivityFeed } from "@/components/common/activity-feed";
import { HealthGrid } from "@/components/common/health-grid";
import { LoyaltyPieChart } from "@/components/charts/loyalty-pie";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SectionHeader } from "@/components/common/section-header";
import {
  useFetchDashboardMetricsQuery,
  useFetchRecentActivityQuery,
  useFetchSystemHealthQuery,
  useGetLoyaltyAnalyticsQuery,
  useGetNewsQuery,
} from "@/services/base-api";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const { data: metrics } = useFetchDashboardMetricsQuery();
  const { data: activity } = useFetchRecentActivityQuery();
  const { data: health } = useFetchSystemHealthQuery();
  const { data: loyalty } = useGetLoyaltyAnalyticsQuery();
  const { data: news } = useGetNewsQuery({ page: 1, page_size: 4 });

  return (
    <div className="space-y-10">
      <SectionHeader title="Центр мониторинга" description="Отслеживание программы лояльности и инфраструктуры" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Зарегистрированные клиенты" value={metrics?.totalClients ?? 0} icon={Users2} />
        <MetricCard title="Активные официанты" value={metrics?.activeWaiters ?? 0} icon={ShieldCheck} />
        <MetricCard title="Выданный кэшбэк" value={metrics?.cashbackIssued ?? 0} currency icon={Gift} />
        <MetricCard title="Средний кэшбэк на клиента" value={metrics?.avgCashbackPerUser ?? 0} currency icon={Activity} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Уровни лояльности</CardTitle>
            <CardDescription>Распределение клиентов по уровням</CardDescription>
          </CardHeader>
          <LoyaltyPieChart data={loyalty} />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Последняя активность</CardTitle>
            <CardDescription>Авторизации, OTP, начисления/списания кэшбэка</CardDescription>
          </CardHeader>
          <div className="p-6 pt-0">
            <ActivityFeed activity={activity} />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Состояние платформы</CardTitle>
            <CardDescription>Redis, Postgres, очереди</CardDescription>
          </CardHeader>
          <div className="p-6 pt-0">
            <HealthGrid statuses={health} />
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Новости</CardTitle>
            <CardDescription>Последние объявления</CardDescription>
          </CardHeader>
          <div className="space-y-4 p-6 pt-0 text-sm">
            {news?.data?.length ? (
              news.data.map((item) => (
                <div key={item.id} className="rounded-xl border border-border/60 p-3">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">Новости отсутствуют</p>
            )}
            <Link href="/news" className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium">
              Открыть новости
            </Link>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Финансовый срез</CardTitle>
          <CardDescription>Итоги из статистики кэшбэка</CardDescription>
        </CardHeader>
        <div className="grid gap-4 p-6 pt-0 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Начисленный кэшбэк</p>
            <p className="text-2xl font-semibold">{formatCurrency(metrics?.cashbackIssued ?? 0)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Активных новостей</p>
            <p className="text-2xl font-semibold">{metrics?.newsCount ?? 0}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Redis</p>
            <p className="text-2xl font-semibold">{metrics?.redisHealthy ? "OK" : "Проверить"}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
