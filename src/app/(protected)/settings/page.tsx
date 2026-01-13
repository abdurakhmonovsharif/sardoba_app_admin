"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SectionHeader } from "@/components/common/section-header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HealthGrid } from "@/components/common/health-grid";
import {
  useChangePasswordMutation,
  useFetchSystemHealthQuery,
} from "@/services/base-api";
import { toast } from "sonner";

const schema = z.object({
  current_password: z.string().min(4),
  new_password: z.string().min(6),
});

type FormValues = z.infer<typeof schema>;

export default function SettingsPage() {
  const { data: health } = useFetchSystemHealthQuery();
  const [changePassword, { isLoading: changing }] = useChangePasswordMutation();
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await changePassword(values).unwrap();
      toast.success("Пароль обновлён");
      form.reset();
    } catch (error) {
      console.error(error);
      toast.error("Не удалось обновить пароль");
    }
  });

  return (
    <div className="space-y-6">
      <SectionHeader title="Системные настройки" description="Управление доступом и диагностика сервисов" />
      <Card>
        <CardHeader>
          <CardTitle>Смена пароля</CardTitle>
          <CardDescription>/auth/staff/change-password</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit} className="space-y-4 p-6 pt-0">
          <div>
            <label className="text-xs uppercase text-muted-foreground">Текущий пароль</label>
            <Input type="password" {...form.register("current_password")} />
          </div>
          <div>
            <label className="text-xs uppercase text-muted-foreground">Новый пароль</label>
            <Input type="password" {...form.register("new_password")} />
          </div>
          <Button type="submit" isLoading={changing}>
            Обновить пароль
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Диагностика сервисов</CardTitle>
          <CardDescription>Проверка доступности сервисов</CardDescription>
        </CardHeader>
        <div className="p-6 pt-0">
          <HealthGrid statuses={health} />
        </div>
      </Card>
    </div>
  );
}
