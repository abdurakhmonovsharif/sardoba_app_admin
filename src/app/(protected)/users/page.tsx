"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/tables/data-table";
import { UserFilterBar } from "@/components/forms/user-filter-bar";
import { SectionHeader } from "@/components/common/section-header";
import { UserDetailDrawer } from "@/components/users/user-detail-drawer";
import { Button } from "@/components/ui/button";
import { useGetUsersQuery } from "@/services/base-api";
import type { User } from "@/types";
import { formatDate } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";

export default function UsersPage() {
  const staff = useAppSelector((state) => state.auth.staff);
  const isWaiter = staff?.role === "waiter";
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const queryParams = useMemo(() => {
    const params: Record<string, string | number | boolean> = {
      page,
      page_size: 100,
    };
    if (filters.search) params.search = filters.search;
    if (filters.loyalty) params.loyalty = filters.loyalty;
    if (isWaiter && staff?.id) {
      params.waiter = staff.id;
    } else if (filters.waiter) {
      params.waiter = filters.waiter;
    }
    return params;
  }, [filters, page, isWaiter, staff?.id]);
  const { data } = useGetUsersQuery(queryParams);
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.page_size ?? 10)));

  const columns: ColumnDef<User>[] = [
    {
      header: "Клиент",
      accessorKey: "first_name",
      cell: ({ row }) => {
        const fullName = row.original.name ?? `${row.original.first_name ?? ""} ${row.original.last_name ?? ""}`.trim();
        return (
          <div>
            <p className="font-semibold">{fullName || `Клиент #${row.original.id}`}</p>
            <p className="text-xs text-muted-foreground">{row.original.phone}</p>
          </div>
        );
      },
    },
    {
      header: "Официант",
      accessorKey: "waiter",
      cell: ({ row }) => row.original.waiter?.name ?? (row.original.waiter_id ? `#${row.original.waiter_id}` : "—"),
    },
    {
      header: "Лояльность",
      accessorKey: "loyalty",
      cell: ({ row }) => (
        <Badge>
          {row.original.loyalty?.current_level ?? row.original.level ?? "—"} (
          {row.original.loyalty?.current_points ?? row.original.cashback_balance ?? 0} баллов)
        </Badge>
      ),
    },
    {
      header: "Статус",
      accessorKey: "is_active",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active === false ? "danger" : "success"}>
          {row.original.is_active === false ? "Неактивен" : "Активен"}
        </Badge>
      ),
    },
    {
      header: "Дата рождения",
      accessorKey: "date_of_birth",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.date_of_birth ?? "")}
        </span>
      ),
    },
    {
      header: "Дата регистрации",
      accessorKey: "created_at",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
  ];

  const handleSearch = (value: string) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, search: value }));
  };
  console.log(data);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Управление клиентами"
        description="Поиск, редактирование и аудит участников программы лояльности"
        action={
          isWaiter && (
            <Badge variant="outline" className="text-sm">
              Клиентов: {data?.total ?? 0}
            </Badge>
          )
        }
      />

      <UserFilterBar
        onChange={(next) => {
          setPage(1);
          setFilters(next);
        }}
        hideWaiter={isWaiter}
      />

      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          total={data?.total}
          page={data?.page ?? page}
          pageSize={data?.page_size ?? 10}
          onPageChange={setPage}
          onSearch={handleSearch}
          onRowClick={isWaiter ? undefined : (row) => setSelectedUserId(row.id)}
          showSearch={!isWaiter}
        />
      </div>

      <div className="grid gap-3 md:hidden">
        {(data?.data ?? []).map((user) => (
          <button
            key={user.id}
            onClick={isWaiter ? undefined : () => setSelectedUserId(user.id)}
            className="rounded-2xl border border-border/70 bg-white p-4 text-left shadow-sm transition hover:border-primary/50 disabled:cursor-not-allowed"
            disabled={isWaiter}
          >
            {(() => {
              const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
              const displayName = user.name ?? (fullName || null);
              return (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{displayName || `Клиент #${user.id}`}</p>
                    <p className="text-xs text-muted-foreground">{user.phone}</p>
                  </div>
                  <Badge variant={user.is_active === false ? "danger" : "success"}>
                    {user.is_active === false ? "Неактивен" : "Активен"}
                  </Badge>
                </div>
              );
            })()}
            <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
              <span>{user.waiter?.name ?? (user.waiter_id ? `Официант #${user.waiter_id}` : "Без официанта")}</span>
              <span>{formatDate(user.created_at ?? "")}</span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Лояльность: {user.loyalty?.current_level ?? user.level ?? "—"} • {user.loyalty?.current_points ?? user.cashback_balance ?? 0} баллов
            </div>
          </button>
        ))}
        {!data?.data?.length && <p className="text-sm text-muted-foreground">Клиентов нет</p>}

        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Назад
          </Button>
          <span>
            Страница {page} из {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Далее
          </Button>
        </div>
      </div>

      <UserDetailDrawer userId={selectedUserId} isOpen={selectedUserId !== null} onClose={() => setSelectedUserId(null)} />
    </div>
  );
}
