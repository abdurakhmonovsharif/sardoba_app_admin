"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SectionHeader } from "@/components/common/section-header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useGetNotificationsQuery,
  useSaveNotificationMutation,
} from "@/services/base-api";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
});

type Values = z.infer<typeof schema>;

export default function NotificationsPage() {
  const { data } = useGetNotificationsQuery({ page: 1, page_size: 20 });
  const [saveNotification, { isLoading }] = useSaveNotificationMutation();
  const form = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await saveNotification(values).unwrap();
      toast.success("Notification queued");
      form.reset({ title: "", description: "" });
    } catch (error) {
      console.error(error);
      toast.error("Unable to send notification");
    }
  });

  return (
    <div className="space-y-6">
      <SectionHeader title="Notifications" description="Compose push campaigns" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Composer</CardTitle>
            <CardDescription>/notifications endpoint</CardDescription>
          </CardHeader>
          <form onSubmit={onSubmit} className="space-y-4 p-6 pt-0">
            <div>
              <label className="text-xs uppercase text-muted-foreground">Title</label>
              <Input {...form.register("title")} placeholder="Promo title" />
            </div>
            <div>
              <label className="text-xs uppercase text-muted-foreground">Description</label>
              <Textarea rows={4} {...form.register("description")} placeholder="Notification body" />
            </div>
            <Button type="submit" isLoading={isLoading}>
              Publish notification
            </Button>
          </form>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
            <CardDescription>Recent notification payloads</CardDescription>
          </CardHeader>
          <div className="space-y-3 p-6 pt-0 text-sm">
            {data?.data?.length ? (
              data.data.map((item) => (
                <div key={item.id} className="rounded-xl border border-border/70 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{item.title}</p>
                    <Badge>{formatDate(item.created_at)}</Badge>
                  </div>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No notifications sent</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
