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
      header: "User",
      cell: ({ row }) => (
        <div>
          <p className="font-semibold">
            {row.original.user.first_name} {row.original.user.last_name}
          </p>
          <p className="text-xs text-muted-foreground">{row.original.user.id}</p>
        </div>
      ),
    },
    {
      header: "Amount",
      accessorKey: "amount",
      cell: ({ row }) => <span className="font-semibold text-emerald-600">{formatCurrency(row.original.amount)}</span>,
    },
    {
      header: "Branch",
      accessorKey: "branch",
      cell: ({ row }) => row.original.branch ?? "—",
    },
    {
      header: "Source",
      accessorKey: "source",
      cell: ({ row }) => <Badge>{row.original.source ?? "Manual"}</Badge>,
    },
    {
      header: "Staff",
      cell: ({ row }) => row.original.staff?.name ?? "—",
    },
    {
      header: "Created",
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
      <SectionHeader title="Cashback & Loyalty" description="Manual adjustments and analytics" />

      <RoleGate minRole="manager">
        <Card>
          <CardHeader>
            <CardTitle>Manual cashback</CardTitle>
            <CardDescription>Manager only endpoint /cashback/add</CardDescription>
          </CardHeader>
          <div className="p-6 pt-0">
            <CashbackForm />
          </div>
        </Card>
      </RoleGate>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>Filter by branch or search phone / user ID</CardDescription>
          </CardHeader>
          <div className="flex flex-wrap gap-3 px-6">
            <Input
              placeholder="Search user"
              value={filters.search}
              onChange={(event) => {
                setPage(1);
                setFilters((prev) => ({ ...prev, search: event.target.value }));
              }}
            />
            <Input
              placeholder="Branch"
              value={filters.branch}
              onChange={(event) => {
                setPage(1);
                setFilters((prev) => ({ ...prev, branch: event.target.value }));
              }}
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleExport("csv")} isLoading={isExporting}>
                Export CSV
              </Button>
              <Button variant="outline" onClick={() => handleExport("xlsx")} isLoading={isExporting}>
                Export Excel
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
            <CardTitle>Loyalty analytics</CardTitle>
            <CardDescription>Tiers close to promotion</CardDescription>
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
                      Needs {item.missingPoints} pts for {item.user.loyalty?.next_level ?? "next tier"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No users close to next tier</p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
