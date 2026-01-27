"use client";

import { useMemo, useState } from "react";
import { RefreshCcw } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/tables/data-table";
import { UserFilterBar } from "@/components/forms/user-filter-bar";
import { SectionHeader } from "@/components/common/section-header";
import { UserDetailDrawer } from "@/components/users/user-detail-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetUsersQuery, useSyncUserByIdMutation, useSyncUsersMutation } from "@/services/base-api";
import type { User } from "@/types";
import { formatDate } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import { toast } from "sonner";

export default function UsersPage() {
  const staff = useAppSelector((state) => state.auth.staff);
  const isWaiter = staff?.role === "waiter";
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [batchSize, setBatchSize] = useState(500);
  const [syncingUserId, setSyncingUserId] = useState<number | null>(null);
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
  const [syncUsers, { isLoading: syncingUsers }] = useSyncUsersMutation();
  const [syncUserById] = useSyncUserByIdMutation();
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
    {
      header: "",
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
          leftIcon={<RefreshCcw size={16} />}
          isLoading={syncingUserId === row.original.id}
          onClick={(event) => {
            event.stopPropagation();
            handleSyncUser(row.original.id);
          }}
        >
          Sync
        </Button>
      ),
      meta: { align: "right" },
    },
  ];

  const handleSearch = (value: string) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, search: value }));
  };
  const handleSyncUser = async (id: number) => {
    setSyncingUserId(id);
    try {
      const result = await syncUserById(id).unwrap();
      if (result?.success === false) {
        toast.error(result?.error ?? "Не удалось синхронизировать пользователя");
      } else {
        toast.success("Синхронизация пользователя запущена");
      }
    } catch (error) {
      console.error(error);
      toast.error("Не удалось синхронизировать пользователя");
    } finally {
      setSyncingUserId(null);
    }
  };
  const handleSync = async () => {
    const size = Math.max(1, Number(batchSize) || 0);
    try {
      await syncUsers({ batch_size: size }).unwrap();
      toast.success("Синхронизация пользователей запущена");
    } catch (error) {
      console.error(error);
      toast.error("Не удалось запустить синхронизацию");
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Управление клиентами"
        description="Поиск, редактирование и аудит участников программы лояльности"
        action={
          isWaiter ? (
            <Badge variant="outline" className="text-sm">
              Клиентов: {data?.total ?? 0}
            </Badge>
          ) : (
            <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value) || 0)}
                  className="w-28"
                  placeholder="batch_size"
                />
                <Button variant="outline" onClick={handleSync} isLoading={syncingUsers}>
                  Синхронизировать пользователей
                </Button>
              </div>
              <p className="text-xs text-muted-foreground sm:text-sm">Клиентов: {data?.total ?? 0}</p>
            </div>
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
          <div
            key={user.id}
            role="button"
            tabIndex={isWaiter ? -1 : 0}
            onClick={isWaiter ? undefined : () => setSelectedUserId(user.id)}
            onKeyDown={(event) => {
              if (isWaiter) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setSelectedUserId(user.id);
              }
            }}
            aria-disabled={isWaiter}
            className="rounded-2xl border border-border/70 bg-white p-4 text-left shadow-sm transition hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed"
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
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                leftIcon={<RefreshCcw size={16} />}
                isLoading={syncingUserId === user.id}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleSyncUser(user.id);
                }}
              >
                Sync
              </Button>
            </div>
          </div>
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
