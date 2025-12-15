"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SectionHeader } from "@/components/common/section-header";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useGetNotificationsQuery,
  useSaveNotificationMutation,
  useDeleteNotificationMutation,
} from "@/services/base-api";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { useState } from "react";

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
});

type Values = z.infer<typeof schema>;

export default function NotificationsPage() {
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);
  const { data } = useGetNotificationsQuery({ page, page_size: PAGE_SIZE });
  const [saveNotification, { isLoading }] = useSaveNotificationMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const form = useForm<Values>({ resolver: zodResolver(schema) });
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await saveNotification(editingId ? { ...values, id: editingId } : values).unwrap();
      toast.success(editingId ? "Уведомление обновлено" : "Уведомление поставлено в очередь");
      form.reset({ title: "", description: "" });
      setEditingId(null);
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Не удалось отправить уведомление");
    }
  });

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Уведомления"
        description="Создание push-кампаний"
        action={
          <Button
            onClick={() => {
              setEditingId(null);
              form.reset({ title: "", description: "" });
              setIsOpen(true);
            }}
          >
            Новое уведомление
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>История</CardTitle>
          <CardDescription>Последние отправленные уведомления</CardDescription>
        </CardHeader>
        <div className="p-6 pt-0">
          {data?.data?.length ? (
            <div className="overflow-x-auto rounded-xl border border-border/70">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Заголовок</th>
                    <th className="px-4 py-3 text-left">Описание</th>
                    <th className="px-4 py-3 text-left whitespace-nowrap">Создано</th>
                    <th className="px-4 py-3 text-left whitespace-nowrap">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((item, idx) => (
                    <tr key={item.id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <td className="px-4 py-3 font-semibold">{item.title}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.description}</td>
                      <td className="px-4 py-3">
                        <Badge>{formatDate(item.created_at)}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingId(item.id);
                              form.reset({ title: item.title, description: item.description });
                              setIsOpen(true);
                            }}
                          >
                            Редактировать
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={async () => {
                              try {
                                await deleteNotification(item.id).unwrap();
                                toast.success("Уведомление удалено");
                              } catch (error) {
                                console.error(error);
                                toast.error("Не удалось удалить");
                              }
                            }}
                          >
                            Удалить
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground">Уведомлений нет</p>
          )}
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <Button
              variant="outline"
              size="sm"
              disabled={(data?.page ?? 1) <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Назад
            </Button>
            <span>
              Страница {data?.page ?? page} из {Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE))}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={(data?.page ?? page) >= Math.ceil((data?.total ?? 0) / PAGE_SIZE)}
              onClick={() => setPage((p) => p + 1)}
            >
              Далее
            </Button>
          </div>
        </div>
      </Card>

      <Drawer
        title={editingId ? "Редактировать уведомление" : "Создать уведомление"}
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setEditingId(null);
        }}
        widthClass="max-w-xl"
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs uppercase text-muted-foreground">Заголовок</label>
            <Input {...form.register("title")} placeholder="Promo title" />
          </div>
          <div>
            <label className="text-xs uppercase text-muted-foreground">Описание</label>
            <Textarea rows={4} {...form.register("description")} placeholder="Текст уведомления" />
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" isLoading={isLoading}>
              {editingId ? "Сохранить" : "Отправить"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsOpen(false);
                setEditingId(null);
              }}
            >
              Отмена
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
