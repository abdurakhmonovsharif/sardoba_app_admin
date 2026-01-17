"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { ColumnDef } from "@tanstack/react-table";
import { SectionHeader } from "@/components/common/section-header";
import { RoleGate } from "@/components/auth/role-gate";
import { DataTable } from "@/components/tables/data-table";
import {
  useCreateWaiterMutation,
  useDeleteWaiterMutation,
  useGetWaiterByIdQuery,
  useGetWaitersQuery,
  useRegenerateReferralCodeMutation,
  useUpdateWaiterMutation,
} from "@/services/base-api";
import type { StaffMember, WaiterCreatePayload, WaiterUpdatePayload } from "@/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Select } from "@/components/ui/select";
import { BRANCHES, getBranchLabel } from "@/config/branches";
import { Drawer } from "@/components/ui/drawer";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(7, "Phone is required"),
  branch_id: z.string().optional(),
  password: z
    .union([z.string().min(6, "Password must be at least 6 characters"), z.literal("")])
    .optional(),
  referral_code: z.string().optional(),
});

type WaiterFormValues = z.infer<typeof schema>;

const buildReferralCode = (name = "") => {
  const prefix = name
    .trim()
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 4)
    .toLowerCase();
  const sanitizedPrefix = prefix || "waiter";
  const suffix = Math.floor(1000 + Math.random() * 9000)
    .toString()
    .padStart(4, "0");
  return `${sanitizedPrefix}${suffix}`;
};

export default function WaitersPage() {
  const [filters, setFilters] = useState({ search: "", branch: "" });
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [selectedWaiterId, setSelectedWaiterId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const queryParams = useMemo(() => {
    const params: Record<string, string | number> = {
      page,
      size: 10,
    };
    if (filters.search) {
      params.search = filters.search;
    }
    if (filters.branch) {
      const branchId = Number(filters.branch);
      if (!Number.isNaN(branchId)) {
        params.branch_id = branchId;
      } else {
        params.branch = filters.branch;
      }
    }
    return params;
  }, [filters.search, filters.branch, page]);

  const { data: waiterList } = useGetWaitersQuery(queryParams);
  const { data: selectedWaiter } = useGetWaiterByIdQuery(selectedWaiterId ?? 0, {
    skip: selectedWaiterId === null,
  });

  const [createWaiter, { isLoading: isCreating }] = useCreateWaiterMutation();
  const [updateWaiter, { isLoading: isUpdating }] = useUpdateWaiterMutation();
  const [deleteWaiter] = useDeleteWaiterMutation();
  const [regenerateReferral] = useRegenerateReferralCodeMutation();

  const form = useForm<WaiterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", branch_id: "", password: "", referral_code: "" },
  });

  useEffect(() => {
    if (editing) {
      form.reset({
        name: editing.name,
        phone: editing.phone,
        branch_id: editing.branch_id?.toString() ?? editing.branch ?? "",
        password: "",
        referral_code: editing.referral_code ?? "",
      });
    } else {
      form.reset({ name: "", phone: "", branch_id: "", password: "", referral_code: "" });
    }
  }, [editing, form]);

  const handleSearch = (value: string) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, search: value }));
  };
  const handleBranchFilter = (value: string) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, branch: value }));
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteWaiter(id).unwrap();
      toast.success("Официант удалён");
      if (selectedWaiterId === id) {
        setSelectedWaiterId(null);
        setIsDetailsOpen(false);
      }
      if (editing?.id === id) {
        setEditing(null);
        setIsFormOpen(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("Не удалось удалить официанта");
    }
  };

  const handleRegenerate = async (id: number) => {
    try {
      await regenerateReferral(id).unwrap();
      toast.success("Реферальный код обновлён");
    } catch (error) {
      console.error(error);
      toast.error("Не удалось обновить код");
    }
  };

  const handleGenerateReferral = () => {
    const code = buildReferralCode(form.getValues("name"));
    form.setValue("referral_code", code, { shouldDirty: true });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const branchValue = values.branch_id?.trim();
    const branchId =
      branchValue && !Number.isNaN(Number(branchValue)) ? Number(branchValue) : undefined;
    const password = values.password?.trim();
    const referralCode = values.referral_code?.trim();

    if (!editing && !password) {
      form.setError("password", {
        type: "manual",
        message: "Password is required for new waiters",
      });
      return;
    }

    try {
      if (editing) {
        const payload: WaiterUpdatePayload = {
          name: values.name,
          phone: values.phone,
        };
        if (branchId !== undefined) {
          payload.branch_id = branchId;
        }
        if (password) {
          payload.password = password;
        }
        if (referralCode) {
          payload.referral_code = referralCode;
        }
        await updateWaiter({ id: editing.id, body: payload }).unwrap();
        toast.success("Официант обновлён");
      } else {
        const payload: WaiterCreatePayload = {
          name: values.name,
          phone: values.phone,
          password: password ?? "",
        };
        if (branchId !== undefined) {
          payload.branch_id = branchId;
        }
        if (referralCode) {
          payload.referral_code = referralCode;
        }
        await createWaiter(payload).unwrap();
        toast.success("Официант создан");
      }
      setEditing(null);
      form.reset({ name: "", phone: "", branch_id: "", password: "", referral_code: "" });
      setIsFormOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Не удалось сохранить");
    }
  });

  const columns: ColumnDef<StaffMember>[] = [
    { header: "Имя", accessorKey: "name" },
    { header: "Телефон", accessorKey: "phone" },
    {
      header: "Филиал",
      cell: ({ row }) => {
        const branchValue = row.original.branch_id ?? row.original.branch;
        return getBranchLabel(branchValue) ?? branchValue ?? "—";
      },
    },
    {
      header: "Реферальный код",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono">{row.original.referral_code ?? "—"}</span>
          <Badge variant="outline">{row.original.role}</Badge>
        </div>
      ),
    },
    {
      header: "Клиенты",
      accessorKey: "clients_count",
      cell: ({ row }) => row.original.clients_count ?? 0,
    },
    {
      header: "Последний вход",
      accessorKey: "last_login_at",
      cell: ({ row }) => (row.original.last_login_at ? formatDate(row.original.last_login_at) : "—"),
    },
    {
      header: "Действия",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              setEditing(row.original);
              setIsFormOpen(true);
            }}
          >
            Редактировать
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              handleDelete(row.original.id);
            }}  
          >
            Удалить
          </Button>
        </div>
      ),
    },
  ];

  return (
    <RoleGate minRole="manager">
      <div className="space-y-6">
        <SectionHeader
          title="Управление официантами"
          description="Создание, обновление и просмотр профилей официантов"
          action={
            <Button
              onClick={() => {
                setEditing(null);
                form.reset({ name: "", phone: "", branch_id: "", password: "", referral_code: "" });
                setIsFormOpen(true);
              }}
            >
              Новый официант
            </Button>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle>Список официантов</CardTitle>
            <CardDescription>Реферальные коды и активность входов</CardDescription>
          </CardHeader>
          <div className="p-6 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
              <Input
                type="search"
                value={filters.search}
                onChange={(event) => handleSearch(event.target.value)}
                placeholder="Поиск официантов"
                className="flex-1"
              />
              <div className="w-full md:w-64">
                <label className="text-xs uppercase text-muted-foreground">Филиал</label>
                <Select
                  value={filters.branch}
                  onChange={(event) => handleBranchFilter(event.target.value)}
                  className="mt-1"
                >
                  <option value="">Все филиалы</option>
                  {BRANCHES.map((branch) => (
                    <option key={branch.value} value={branch.value}>
                      {branch.label} ({branch.value})
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <DataTable
              columns={columns}
              data={waiterList?.data ?? []}
              total={waiterList?.total}
              page={waiterList?.page ?? page}
              pageSize={waiterList?.page_size ?? 10}
              onPageChange={setPage}
              onRowClick={(waiter) => {
                setSelectedWaiterId(waiter.id);
                setIsDetailsOpen(true);
              }}
            />
          </div>
        </Card>

        <Drawer
          title={editing ? `Редактировать ${editing.name}` : "Создать официанта"}
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditing(null);
          }}
          widthClass="max-w-xl"
        >
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase text-muted-foreground">Имя</label>
                <Input {...form.register("name")} />
              </div>
              <div>
                <label className="text-xs uppercase text-muted-foreground">Телефон</label>
                <Input {...form.register("phone")} />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase text-muted-foreground">Филиал</label>
                <Select {...form.register("branch_id")}>
                  <option value="">Unassigned</option>
                  {BRANCHES.map((branch) => (
                    <option key={branch.value} value={branch.value}>
                      {branch.label} ({branch.value})
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-xs uppercase text-muted-foreground">Пароль</label>
                <Input type="password" placeholder={editing ? "Необязательно (оставьте пустым)" : ""} {...form.register("password")} />
              </div>
            </div>
            <div>
              <label className="text-xs uppercase text-muted-foreground">Реферальный код</label>
              <div className="flex flex-wrap items-end gap-2">
                <Input
                  {...form.register("referral_code")}
                  placeholder="Опционально (например, name1234)"
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={handleGenerateReferral}>
                  Сгенерировать
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Можно составить код из имени официанта и цифр или оставить пустым.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" isLoading={editing ? isUpdating : isCreating}>
                {editing ? "Сохранить" : "Создать"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditing(null);
                  form.reset({ name: "", phone: "", branch_id: "", password: "", referral_code: "" });
                }}
              >
                Отмена
              </Button>
            </div>
          </form>
        </Drawer>

        <Drawer
          title={selectedWaiter ? selectedWaiter.name : "Детали официанта"}
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedWaiterId(null);
          }}
          widthClass="max-w-2xl"
        >
          {selectedWaiter ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Телефон</p>
                  <p className="font-semibold">{selectedWaiter.phone}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Филиал</p>
                  {(() => {
                    const branchValue = selectedWaiter.branch_id ?? selectedWaiter.branch;
                    return (
                      <p className="font-semibold">
                        {getBranchLabel(branchValue) ?? branchValue ?? "—"}
                      </p>
                    );
                  })()}
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Реферальный код</p>
                  <p className="font-mono text-sm">{selectedWaiter.referral_code ?? "—"}</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Последний вход</p>
                  <p className="font-semibold">
                    {selectedWaiter.last_login_at ? formatDate(selectedWaiter.last_login_at) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Создан</p>
                  <p className="font-semibold">
                    {selectedWaiter.created_at ? formatDate(selectedWaiter.created_at) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Клиенты</p>
                  <p className="font-semibold">{selectedWaiter.clients_count ?? 0}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => handleRegenerate(selectedWaiter.id)}>
                  Обновить код
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsDetailsOpen(false);
                    setSelectedWaiterId(null);
                  }}
                >
                  Закрыть
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Загрузка данных официанта…</p>
          )}
        </Drawer>
      </div>
    </RoleGate>
  );
}
