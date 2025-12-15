"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { SectionHeader } from "@/components/common/section-header";
import { RoleGate } from "@/components/auth/role-gate";
import { CashbackForm } from "@/components/forms/cashback-form";
import { DataTable } from "@/components/tables/data-table";
import { LoyaltyPieChart } from "@/components/charts/loyalty-pie";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useGetCashbackTransactionsQuery,
  useGetLoyaltyAnalyticsQuery,
  useLazyExportCashbackQuery,
} from "@/services/base-api";
import type { CashbackTransaction } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CashbackPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", branch: "" });
  const { data: transactions } = useGetCashbackTransactionsQuery({
    page,
    page_size: 10,
    search: filters.search,
    branch: filters.branch,
  });
  const { data: analytics } = useGetLoyaltyAnalyticsQuery();
  const [exportCashback, { isFetching: isExporting }] = useLazyExportCashbackQuery();

  const columns: ColumnDef<CashbackTransaction>[] = [
    {
      header: "Клиент",
      cell: ({ row }) => (
        <div>
          <p className="font-semibold">
            {row.original.user.first_name} {row.original.user.last_name}
          </p>
          <p className="text-xs text-muted-foreground">ID: {row.original.user.id}</p>
        </div>
      ),
    },
    {
      header: "Сумма",
      accessorKey: "amount",
      cell: ({ row }) => <span className="font-semibold text-emerald-600">{formatCurrency(row.original.amount)}</span>,
    },
    {
      header: "Филиал",
      accessorKey: "branch",
      cell: ({ row }) => row.original.branch ?? "—",
    },
    {
      header: "Источник",
      accessorKey: "source",
      cell: ({ row }) => <Badge>{row.original.source ?? "Ручной"}</Badge>,
    },
    {
      header: "Сотрудник",
      cell: ({ row }) => row.original.staff?.name ?? "—",
    },
    {
      header: "Создано",
      accessorKey: "created_at",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.created_at)}</span>,
    },
  ];

  const handleExport = async (format: "csv" | "xlsx") => {
    const blob = await exportCashback({ format }).unwrap();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cashback.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <SectionHeader title="Кэшбэк и лояльность" description="Ручные корректировки и аналитика" />

      <RoleGate minRole="manager">
        <Card>
          <CardHeader>
            <CardTitle>Ручное начисление</CardTitle>
            <CardDescription>Только для менеджеров — /cashback/add</CardDescription>
          </CardHeader>
          <div className="p-6 pt-0">
            <CashbackForm />
          </div>
        </Card>
      </RoleGate>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Транзакции</CardTitle>
            <CardDescription>Фильтр по филиалу или поиск по телефону/ID клиента</CardDescription>
          </CardHeader>
          <div className="flex flex-wrap gap-3 px-6">
            <Input
              placeholder="Поиск клиента"
              value={filters.search}
              onChange={(event) => {
                setPage(1);
                setFilters((prev) => ({ ...prev, search: event.target.value }));
              }}
            />
            <Input
              placeholder="Филиал"
              value={filters.branch}
              onChange={(event) => {
                setPage(1);
                setFilters((prev) => ({ ...prev, branch: event.target.value }));
              }}
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleExport("csv")} isLoading={isExporting}>
                Экспорт CSV
              </Button>
              <Button variant="outline" onClick={() => handleExport("xlsx")} isLoading={isExporting}>
                Экспорт Excel
              </Button>
            </div>
          </div>
          <div className="p-6">
            <DataTable
              columns={columns}
              data={transactions?.data ?? []}
              total={transactions?.total}
              page={transactions?.page ?? page}
              pageSize={transactions?.page_size ?? 10}
              onPageChange={setPage}
            />
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Аналитика лояльности</CardTitle>
            <CardDescription>Клиенты близко к повышению уровня</CardDescription>
          </CardHeader>
          <div className="space-y-4 p-6 pt-0 text-sm">
            <LoyaltyPieChart data={analytics} />
            <div className="space-y-3">
              {analytics?.nearNextTier?.length ? (
                analytics.nearNextTier.slice(0, 4).map((item) => (
                  <div key={item.user.id} className="rounded-xl border border-border/60 p-3">
                    <p className="font-semibold">
                      {item.user.first_name} {item.user.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Нужен {item.missingPoints} балл(ов) до уровня {item.user.loyalty?.next_level ?? "—"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">Нет клиентов близко к следующему уровню</p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
