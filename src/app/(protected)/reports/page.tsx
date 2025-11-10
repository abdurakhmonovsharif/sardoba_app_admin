"use client";

import { SectionHeader } from "@/components/common/section-header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useGetWaiterStatsQuery,
  useGetTopUsersQuery,
  useLazyExportUsersQuery,
  useLazyExportCashbackQuery,
} from "@/services/base-api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export default function ReportsPage() {
  const { data: waiterStats } = useGetWaiterStatsQuery();
  const { data: topUsers } = useGetTopUsersQuery();
  const [exportUsers, { isFetching: exportingUsers }] = useLazyExportUsersQuery();
  const [exportTransactions, { isFetching: exportingTx }] = useLazyExportCashbackQuery();

  const downloadUsers = async (format: "csv" | "xlsx") => {
    try {
      const blob = await exportUsers({ format }).unwrap();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `users.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed");
    }
  };

  const downloadCashback = async (format: "csv" | "xlsx") => {
    try {
      const blob = await exportTransactions({ format }).unwrap();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cashback.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed");
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Reports" description="Staff performance and loyalty leaders" />

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => downloadUsers("csv")} isLoading={exportingUsers}>
          Export users CSV
        </Button>
        <Button variant="outline" onClick={() => downloadCashback("xlsx")} isLoading={exportingTx}>
          Export cashback XLSX
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Waiter leaderboard</CardTitle>
            <CardDescription>cashback_service.waiter_stats()</CardDescription>
          </CardHeader>
          <div className="space-y-2 p-6 pt-0 text-sm">
            {waiterStats?.length ? (
              waiterStats.map((stat) => (
                <div key={stat.staff_id} className="flex items-center justify-between rounded-xl border border-border/60 p-3">
                  <div>
                    <p className="font-semibold">{stat.staff_name}</p>
                    <p className="text-xs text-muted-foreground">Transactions: {stat.transactions}</p>
                  </div>
                  <span className="font-semibold text-emerald-600">{formatCurrency(stat.total_cashback)}</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No stats yet</p>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top loyalty users</CardTitle>
            <CardDescription>CashbackService.top_users()</CardDescription>
          </CardHeader>
          <div className="space-y-2 p-6 pt-0 text-sm">
            {topUsers?.length ? (
              topUsers.map((row) => (
                <div key={row.user.id} className="flex items-center justify-between rounded-xl border border-border/60 p-3">
                  <div>
                    <p className="font-semibold">
                      {row.user.first_name} {row.user.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{row.transactions} tx</p>
                  </div>
                  <span className="font-semibold text-primary">{formatCurrency(row.total_cashback)}</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No users found</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
