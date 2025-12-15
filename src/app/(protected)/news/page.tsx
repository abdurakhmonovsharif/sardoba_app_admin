"use client";

import { useEffect, useState, type ChangeEvent } from "react";
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
  useGetNewsQuery,
  useSaveNewsMutation,
  useDeleteNewsMutation,
  useUploadNewsImageMutation,
  useDeleteNewsImageMutation,
} from "@/services/base-api";
import type { NewsItem } from "@/types";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

const PRIORITY_SELECT_VALUES = ["0", "1", "2"] as const;
type PriorityValue = (typeof PRIORITY_SELECT_VALUES)[number];
const PRIORITY_OPTIONS = [
  { value: 0, label: "Низкий" },
  { value: 1, label: "Нормальный" },
  { value: 2, label: "Высокий" },
] as const;
const DEFAULT_PRIORITY: PriorityValue = PRIORITY_SELECT_VALUES[1];

const getPriorityLabel = (value?: number) =>
  PRIORITY_OPTIONS.find((option) => option.value === value)?.label ?? "Нормальный";
const getPriorityVariant = (value?: number) => (value === 2 ? "danger" : "default");
const getFileNameFromUrl = (url?: string) => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.pathname.split("/").pop()?.split("?")[0] ?? null;
  } catch {
    const trimmed = url.split("?")[0];
    return trimmed.split("/").pop() ?? null;
  }
};

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  priority: z.enum(PRIORITY_SELECT_VALUES),
});

type NewsValues = z.infer<typeof schema>;

export default function NewsPage() {
  const { data, refetch } = useGetNewsQuery({ page: 1, page_size: 20 });
  const [saveNews, { isLoading }] = useSaveNewsMutation();
  const [deleteNews] = useDeleteNewsMutation();
  const [uploadImage] = useUploadNewsImageMutation();
  const [deleteNewsImage] = useDeleteNewsImageMutation();
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setUploadingImage] = useState(false);
  const form = useForm<NewsValues>({
    resolver: zodResolver(schema),
    defaultValues: { priority: DEFAULT_PRIORITY },
  });

  useEffect(() => {
    if (editing) {
      form.reset({
        title: editing.title,
        description: editing.description,
        starts_at: editing.starts_at?.split("T")[0],
        ends_at: editing.ends_at?.split("T")[0],
        priority:
          editing.priority !== undefined
            ? (String(editing.priority) as PriorityValue)
            : DEFAULT_PRIORITY,
      });
      setUploadedImageUrl(null);
    } else {
      form.reset({ title: "", description: "", starts_at: "", ends_at: "", priority: DEFAULT_PRIORITY });
    }
  }, [editing, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      ...values,
      priority: Number(values.priority),
      id: editing?.id,
      image_url: editing?.image_url ?? uploadedImageUrl ?? undefined,
    };
    try {
      await saveNews(payload).unwrap();
      toast.success(editing ? "Новость обновлена" : "Новость опубликована");
      await refetch();
      if (!editing) {
        form.reset({ title: "", description: "", starts_at: "", ends_at: "", priority: DEFAULT_PRIORITY });
        setUploadedImageUrl(null);
      }
      setEditing(null);
    } catch (error) {
      console.error(error);
      toast.error("Не удалось сохранить новость");
    }
  });

  const handleDelete = async (id: number) => {
    try {
      await deleteNews(id).unwrap();
      toast.success("Новость удалена");
    } catch (error) {
      console.error(error);
      toast.error("Не удалось удалить");
    }
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await uploadImage(formData).unwrap();
      toast.success("Изображение загружено");
      if (editing) {
        setEditing((prev) => (prev ? { ...prev, image_url: response.url } : prev));
      } else {
        setUploadedImageUrl(response.url);
      }
    } catch (error) {
      console.error(error);
      toast.error("Ошибка загрузки изображения");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleDeleteImage = async () => {
    if (!editing?.image_url) {
      return;
    }
    const fileName = getFileNameFromUrl(editing.image_url);
    if (!fileName) {
      toast.error("Не удалось определить имя файла");
      return;
    }
    try {
      await deleteNewsImage(fileName).unwrap();
      toast.success("Изображение удалено");
      setEditing((prev) => (prev ? { ...prev, image_url: undefined } : prev));
    } catch (error) {
      console.error(error);
      toast.error("Не удалось удалить изображение");
    }
  };

  const handleClearUploadedImage = async () => {
    if (!uploadedImageUrl) return;
    const fileName = getFileNameFromUrl(uploadedImageUrl);
    if (!fileName) {
      setUploadedImageUrl(null);
      return;
    }
    try {
      await deleteNewsImage(fileName).unwrap();
      toast.success("Изображение удалено");
    } catch (error) {
      console.error(error);
      toast.error("Не удалось удалить изображение");
    } finally {
      setUploadedImageUrl(null);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Новости" description="Рассылка объявлений в мобильное приложение" />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{editing ? "Редактировать новость" : "Создать новость"}</CardTitle>
            <CardDescription>Эндпоинты /news</CardDescription>
          </CardHeader>
          <form onSubmit={onSubmit} className="space-y-4 p-6 pt-0">
            <div>
              <label className="text-xs uppercase text-muted-foreground">Заголовок</label>
              <Input {...form.register("title")} />
            </div>
            <div>
              <label className="text-xs uppercase text-muted-foreground">Описание</label>
              <Textarea rows={4} {...form.register("description")} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase text-muted-foreground">Начало</label>
                <Input type="date" {...form.register("starts_at")} />
              </div>
              <div>
                <label className="text-xs uppercase text-muted-foreground">Окончание</label>
                <Input type="date" {...form.register("ends_at")} />
              </div>
            </div>
            <div>
              <label className="text-xs uppercase text-muted-foreground">Приоритет</label>
              <select className="w-full rounded-lg border border-input px-3 py-2" {...form.register("priority")}>
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={String(option.value)}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-xs uppercase text-muted-foreground">Изображение</label>
              <input
                type="file"
                accept="image/*"
                className="w-full text-sm"
                onChange={handleUpload}
                disabled={isUploadingImage}
              />
              {isUploadingImage && <p className="text-xs text-muted-foreground">Загрузка изображения…</p>}
              {!editing && uploadedImageUrl && (
                <div className="space-y-2">
                  <p className="text-xs uppercase text-muted-foreground">Выбранное изображение</p>
                  <div className="rounded-md border border-border/50 bg-muted/50 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={uploadedImageUrl}
                      alt="Pending news preview"
                      className="h-28 w-full rounded-sm object-cover"
                    />
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={handleClearUploadedImage}>
                    Очистить выбор
                  </Button>
                </div>
              )}
              {editing?.image_url && (
                <div className="space-y-2">
                  <p className="text-xs uppercase text-muted-foreground">Текущее изображение</p>
                  <div className="rounded-md border border-border/50 bg-muted/50 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={editing.image_url}
                      alt={`${editing.title} preview`}
                      className="h-28 w-full rounded-sm object-cover"
                    />
                  </div>
                  <Button type="button" variant="destructive" size="sm" onClick={handleDeleteImage}>
                    Удалить изображение
                  </Button>
                </div>
              )}
            </div>
            <Button type="submit" isLoading={isLoading}>
              {editing ? "Сохранить" : "Опубликовать"}
            </Button>
            {editing && (
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Отмена
              </Button>
            )}
          </form>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {data?.data?.length ? (
            data.data.map((item) => (
              <Card key={item.id} className="border border-border/70">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                  <Badge variant={getPriorityVariant(item.priority)}>{getPriorityLabel(item.priority)}</Badge>
                </CardHeader>
                {item.image_url && (
                  <div className="px-6 pb-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image_url}
                      alt={`${item.title} preview`}
                      className="h-40 w-full rounded-md object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-4 text-xs text-muted-foreground">
                  <span>Активно: {item.is_active ? "Да" : "Нет"}</span>
                  <span>Окно: {formatDate(item.starts_at ?? "")}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditing(item)}>
                      Редактировать
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
                      Удалить
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Новостей пока нет</p>
          )}
        </div>
      </div>
    </div>
  );
}
