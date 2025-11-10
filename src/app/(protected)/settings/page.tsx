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
      toast.success("Password updated");
      form.reset();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update password");
    }
  });

  const handleFlushCache = async () => {
    try {
      await flushCache().unwrap();
      toast.success("Cache flushed");
    } catch (error) {
      console.error(error);
      toast.error("Unable to flush cache");
    }
  };

  const describe = (query: { data?: { status: string; message?: string }; error?: unknown }) => ({
    status: query.data?.status ?? (query.error ? "down" : "checking"),
    message: query.data?.message ?? (query.error ? "Unavailable" : "Pending response"),
  });

  const services = [
    { name: "Redis", ...describe(redis) },
    { name: "Postgres", ...describe(postgres) },
    { name: "Queue", ...describe(queue) },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader title="System settings" description="Environment visibility and operational tools" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Environment</CardTitle>
            <CardDescription>Read-only env variables</CardDescription>
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
              Flush Redis cache
            </Button>
            <p className="text-xs text-muted-foreground">Alembic revision: {revision?.revision ?? "unknown"}</p>
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>/auth/staff/change-password</CardDescription>
          </CardHeader>
          <form onSubmit={onSubmit} className="space-y-4 p-6 pt-0">
            <div>
              <label className="text-xs uppercase text-muted-foreground">Current password</label>
              <Input type="password" {...form.register("current_password")} />
            </div>
            <div>
              <label className="text-xs uppercase text-muted-foreground">New password</label>
              <Input type="password" {...form.register("new_password")} />
            </div>
            <Button type="submit" isLoading={changing}>
              Update password
            </Button>
          </form>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service diagnostics</CardTitle>
          <CardDescription>Ping backing services</CardDescription>
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
