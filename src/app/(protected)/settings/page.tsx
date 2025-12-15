"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SectionHeader } from "@/components/common/section-header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useGetSystemSettingsQuery,
  useFlushCacheMutation,
  useChangePasswordMutation,
  useGetDbRevisionQuery,
  usePingServiceQuery,
} from "@/services/base-api";
import { toast } from "sonner";

const schema = z.object({
  current_password: z.string().min(4),
  new_password: z.string().min(6),
});

type FormValues = z.infer<typeof schema>;

export default function SettingsPage() {
  const { data: settings } = useGetSystemSettingsQuery();
  const { data: revision } = useGetDbRevisionQuery();
  const redis = usePingServiceQuery({ service: "redis" });
  const postgres = usePingServiceQuery({ service: "postgres" });
  const queue = usePingServiceQuery({ service: "queue" });
  const [flushCache, { isLoading: flushing }] = useFlushCacheMutation();
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

  const handleFlushCache = async () => {
    try {
      await flushCache().unwrap();
      toast.success("Кэш Redis очищен");
    } catch (error) {
      console.error(error);
      toast.error("Не удалось очистить кэш");
    }
  };

  const describe = (query: { data?: { status: string; message?: string }; error?: unknown }) => ({
    status: query.data?.status ?? (query.error ? "down" : "checking"),
    message: query.data?.message ?? (query.error ? "Недоступно" : "Ожидание ответа"),
  });

  const services = [
    { name: "Redis", ...describe(redis) },
    { name: "Postgres", ...describe(postgres) },
    { name: "Queue", ...describe(queue) },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader title="Системные настройки" description="Просмотр окружения и служебные инструменты" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Окружение</CardTitle>
            <CardDescription>Переменные среды (только просмотр)</CardDescription>
          </CardHeader>
          <div className="space-y-3 p-6 pt-0 text-sm">
            <div className="flex items-center justify-between rounded-xl border border-border/70 p-3">
              <span>API URL</span>
              <span className="font-mono text-xs">{process.env.NEXT_PUBLIC_API_URL ?? ""}</span>
            </div>
            {settings?.map((setting) => (
              <div key={setting.key} className="rounded-xl border border-border/70 p-3">
                <p className="text-xs uppercase text-muted-foreground">{setting.key}</p>
                <p className="font-semibold">{setting.value}</p>
              </div>
            ))}
            <Button variant="outline" onClick={handleFlushCache} isLoading={flushing}>
              Очистить кэш Redis
            </Button>
            <p className="text-xs text-muted-foreground">Версия Alembic: {revision?.revision ?? "неизвестно"}</p>
          </div>
        </Card>
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Диагностика сервисов</CardTitle>
          <CardDescription>Проверка доступности сервисов</CardDescription>
        </CardHeader>
        <div className="grid gap-4 p-6 pt-0 md:grid-cols-3">
          {services.map((service) => (
            <div key={service.name} className="rounded-xl border border-border/70 p-3">
              <p className="text-sm font-semibold">{service.name}</p>
              <p className="text-xs text-muted-foreground">{service.status}</p>
              <p className="text-xs text-muted-foreground">{service.message ?? "—"}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
