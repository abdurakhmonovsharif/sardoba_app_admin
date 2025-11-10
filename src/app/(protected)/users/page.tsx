"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/tables/data-table";
import { UserFilterBar } from "@/components/forms/user-filter-bar";
import { SectionHeader } from "@/components/common/section-header";
import { UserDetailDrawer } from "@/components/users/user-detail-drawer";
import { useGetUsersQuery } from "@/services/base-api";
import type { User } from "@/types";
import { formatDate } from "@/lib/utils";

export default function UsersPage() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const queryParams = useMemo(
    () => ({
      page,
      page_size: 10,
      search: filters.search,
      loyalty: filters.loyalty,
      waiter: filters.waiter,
    }),
    [filters, page],
  );
  const { data } = useGetUsersQuery(queryParams);

  const columns: ColumnDef<User>[] = [
    {
      header: "Client",
      accessorKey: "first_name",
      cell: ({ row }) => {
        const fullName = row.original.name ?? `${row.original.first_name ?? ""} ${row.original.last_name ?? ""}`.trim();
        return (
          <div>
            <p className="font-semibold">{fullName || `User #${row.original.id}`}</p>
            <p className="text-xs text-muted-foreground">{row.original.phone}</p>
          </div>
        );
      },
    },
    {
      header: "Waiter",
      accessorKey: "waiter",
      cell: ({ row }) => row.original.waiter?.name ?? (row.original.waiter_id ? `#${row.original.waiter_id}` : "—"),
    },
    {
      header: "Loyalty",
      accessorKey: "loyalty",
      cell: ({ row }) => (
        <Badge>
          {row.original.loyalty?.current_level ?? row.original.level ?? "—"} (
          {row.original.loyalty?.current_points ?? row.original.cashback_balance ?? 0} pts)
        </Badge>
      ),
    },
    {
      header: "Status",
      accessorKey: "is_active",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active === false ? "danger" : "success"}>
          {row.original.is_active === false ? "Inactive" : "Active"}
        </Badge>
      ),
    },
    {
      header: "Joined",
      accessorKey: "created_at",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.created_at ?? row.original.date_of_birth ?? "")}
        </span>
      ),
    },
  ];

  const handleSearch = (value: string) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, search: value }));
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="User management"
        description="Search, edit, and audit loyalty members"
      />

      <UserFilterBar
        onChange={(next) => {
          setPage(1);
          setFilters(next);
        }}
      />

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        total={data?.total}
        page={data?.page ?? page}
        pageSize={data?.page_size ?? 10}
        onPageChange={setPage}
        onSearch={handleSearch}
        onRowClick={(row) => setSelectedUserId(row.id)}
      />

      <UserDetailDrawer userId={selectedUserId} isOpen={Boolean(selectedUserId)} onClose={() => setSelectedUserId(null)} />
    </div>
  );
}
