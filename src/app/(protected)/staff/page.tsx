"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { SectionHeader } from "@/components/common/section-header";
import { DataTable } from "@/components/tables/data-table";
import { RoleGate } from "@/components/auth/role-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  useGetStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  useRegenerateReferralCodeMutation,
} from "@/services/base-api";
import type { StaffMember } from "@/types";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().min(7),
  role: z.enum(["manager", "waiter"]),
  branch: z.string().optional(),
});

type StaffFormValues = z.infer<typeof schema>;

export default function StaffPage() {
  const { data: staff } = useGetStaffQuery();
  const [createStaff, { isLoading: isCreating }] = useCreateStaffMutation();
  const [updateStaff, { isLoading: isUpdating }] = useUpdateStaffMutation();
  const [deleteStaff] = useDeleteStaffMutation();
  const [regenerateCode] = useRegenerateReferralCodeMutation();
  const [editing, setEditing] = useState<StaffMember | null>(null);

  const form = useForm<StaffFormValues>({ resolver: zodResolver(schema), defaultValues: { role: "waiter" } });

  useEffect(() => {
    if (editing) {
      form.reset({
        name: editing.name,
        phone: editing.phone,
        role: editing.role,
        branch: editing.branch ?? "",
      });
    } else {
      form.reset({ name: "", phone: "", role: "waiter", branch: "" });
    }
  }, [editing, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (editing) {
        await updateStaff({ id: editing.id, body: values }).unwrap();
        toast.success("Сотрудник обновлён");
      } else {
        await createStaff(values).unwrap();
        toast.success("Сотрудник создан");
      }
      setEditing(null);
      form.reset();
    } catch (error) {
      console.error(error);
      toast.error("Не удалось выполнить операцию");
    }
  });

  const handleDelete = async (id: number) => {
    try {
      await deleteStaff(id).unwrap();
      toast.success("Сотрудник удалён");
    } catch (error) {
      console.error(error);
      toast.error("Не удалось удалить");
    }
  };

  const handleRegenerate = async (id: number) => {
    try {
      await regenerateCode(id).unwrap();
      toast.success("Реферальный код обновлён");
    } catch (error) {
      console.error(error);
      toast.error("Не удалось обновить реферальный код");
    }
  };

  const columns: ColumnDef<StaffMember>[] = [
    { header: "Имя", accessorKey: "name" },
    { header: "Телефон", accessorKey: "phone" },
    {
      header: "Роль",
      cell: ({ row }) => <Badge>{row.original.role}</Badge>,
    },
    { header: "Филиал", accessorKey: "branch" },
    {
      header: "Реферальный код",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono">{row.original.referral_code ?? "—"}</span>
          {row.original.role === "waiter" && (
            <Button variant="outline" size="sm" onClick={() => handleRegenerate(row.original.id)}>
              Обновить
            </Button>
          )}
        </div>
      ),
    },
    {
      header: "Действия",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(row.original)}>
            Редактировать
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(row.original.id)}>
            Удалить
          </Button>
        </div>
      ),
    },
  ];

  return (
    <RoleGate minRole="manager" fallback={<p className="text-sm text-muted-foreground">Доступ только для менеджера</p>}>
      <div className="space-y-6">
        <SectionHeader title="Управление персоналом" description="Контроль доступа официантов и менеджеров" />

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{editing ? "Редактировать сотрудника" : "Создать сотрудника"}</CardTitle>
              <CardDescription>Эндпоинты /auth/staff</CardDescription>
            </CardHeader>
            <form onSubmit={onSubmit} className="space-y-4 p-6 pt-0">
              <div>
                <label className="text-xs uppercase text-muted-foreground">Имя</label>
                <Input {...form.register("name")} />
              </div>
              <div>
                <label className="text-xs uppercase text-muted-foreground">Телефон</label>
                <Input {...form.register("phone")} />
              </div>
              <div>
                <label className="text-xs uppercase text-muted-foreground">Роль</label>
                <Select {...form.register("role")}>
                  <option value="waiter">Официант</option>
                  <option value="manager">Менеджер</option>
                </Select>
              </div>
              <div>
                <label className="text-xs uppercase text-muted-foreground">Филиал</label>
                <Input {...form.register("branch")} />
              </div>
              <Button type="submit" isLoading={editing ? isUpdating : isCreating}>
                {editing ? "Сохранить" : "Создать"}
              </Button>
              {editing && (
                <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                  Отмена
                </Button>
              )}
            </form>
          </Card>

          <Card className="lg:row-span-2">
            <CardHeader>
              <CardTitle>Список сотрудников</CardTitle>
              <CardDescription>Роли и реферальные коды официантов</CardDescription>
            </CardHeader>
            <div className="p-6 pt-0">
              <DataTable columns={columns} data={staff ?? []} total={staff?.length} page={1} pageSize={staff?.length ?? 10} />
            </div>
          </Card>
        </div>
      </div>
    </RoleGate>
  );
}
