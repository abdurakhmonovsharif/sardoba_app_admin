"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Camera, X as CloseIcon } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { SectionHeader } from "@/components/common/section-header";
import { Card } from "@/components/ui/card";
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
  toAbsoluteUrl,
} from "@/services/base-api";
import type { NewsItem } from "@/types";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { DataTable } from "@/components/tables/data-table";
import { Modal } from "@/components/ui/modal";

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
  title: z.string().min(3, "Минимум 3 символа"),
  description: z.string().min(5, "Минимум 5 символов"),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  priority: z.enum(PRIORITY_SELECT_VALUES),
});

type NewsValues = z.infer<typeof schema>;

export default function NewsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const { data, refetch } = useGetNewsQuery({ page: currentPage, page_size: 20 });
  const [saveNews, { isLoading }] = useSaveNewsMutation();
  const [deleteNews] = useDeleteNewsMutation();
  const [uploadImage] = useUploadNewsImageMutation();
  const [deleteNewsImage] = useDeleteNewsImageMutation();
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setUploadingImage] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      setIsModalOpen(true);
    }
  }, [editing, form]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    setUploadedImageUrl(null);
    form.reset({ title: "", description: "", starts_at: "", ends_at: "", priority: DEFAULT_PRIORITY });
  };

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
      handleCloseModal();
    } catch (error) {
      console.error(error);
      toast.error("Не удалось сохранить новость");
    }
  });

  const handleDelete = async (id: number) => {
    try {
      await deleteNews(id).unwrap();
      toast.success("Новость удалена");
      await refetch();
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
    formData.append("image", file);
    try {
      const response = await uploadImage(formData).unwrap();
      toast.success("Изображение загружено");
      const url = response.image_url || response.url;
      if (editing) {
        setEditing((prev) => (prev ? { ...prev, image_url: url } : prev));
      } else {
        setUploadedImageUrl(url);
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
    if (!editing?.image_url) return;
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

  const columns: ColumnDef<NewsItem>[] = [
    {
      header: "Изображение",
      cell: ({ row }) => {
        const url = row.original.image_url;
        return (
          <div className="h-12 w-20 overflow-hidden rounded-lg bg-muted border">
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={toAbsoluteUrl(url)} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground uppercase">Нет фото</div>
            )}
          </div>
        );
      },
    },
    {
      header: "Заголовок",
      cell: ({ row }) => <span className="font-medium line-clamp-1">{row.original.title}</span>,
    },
    {
      header: "Описание",
      cell: ({ row }) => <span className="text-muted-foreground text-xs line-clamp-2">{row.original.description}</span>,
    },
    {
      header: "Приоритет",
      cell: ({ row }) => (
        <Badge variant={getPriorityVariant(row.original.priority)}>{getPriorityLabel(row.original.priority)}</Badge>
      ),
    },
    {
      header: "Активно",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "success" : "default"}>
          {row.original.is_active ? "Да" : "Нет"}
        </Badge>
      ),
    },
    {
      header: "Дата",
      cell: ({ row }) => (
        <div className="text-xs text-muted-foreground">
          <p>{formatDate(row.original.starts_at)}</p>
          <p>{formatDate(row.original.ends_at)}</p>
        </div>
      ),
    },
    {
      header: "Действия",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(row.original);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.original.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const currentImageUrl = editing?.image_url ?? uploadedImageUrl;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Новости"
        description="Рассылка объявлений в мобильное приложение"
        action={
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 px-5 py-2.5 transition-all hover:shadow-lg active:scale-[0.98]">
            <span className="font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Создать новость</span>
          </Button>
        }
      />

      <Card>
        <div className="p-6">
          <DataTable
            columns={columns}
            data={data?.data ?? []}
            total={data?.total}
            page={currentPage}
            onPageChange={setCurrentPage}
            pageSize={20}
          />
        </div>
      </Card>

      <Modal
        title={editing ? "Редактировать новость" : "Создать новость"}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs uppercase font-medium text-muted-foreground">Заголовок</label>
            <Input {...form.register("title")} placeholder="Название новости" />
            {form.formState.errors.title && <p className="text-[10px] text-destructive">{form.formState.errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase font-medium text-muted-foreground">Описание</label>
            <Textarea rows={4} {...form.register("description")} placeholder="Текст объявления" />
            {form.formState.errors.description && <p className="text-[10px] text-destructive">{form.formState.errors.description.message}</p>}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase font-medium text-muted-foreground">Начало</label>
              <Input type="date" {...form.register("starts_at")} />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase font-medium text-muted-foreground">Окончание</label>
              <Input type="date" {...form.register("ends_at")} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase font-medium text-muted-foreground">Приоритет</label>
            <select className="w-full rounded-lg border border-input px-3 py-2 text-sm bg-white" {...form.register("priority")}>
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={String(option.value)}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-xs uppercase font-medium text-muted-foreground">Изображение</label>

            {!currentImageUrl && !isUploadingImage && (
              <div className="relative group">
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="cursor-pointer file:cursor-pointer"
                  onChange={handleUpload}
                />
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground group-hover:text-primary transition-colors">
                  <Camera className="h-4 w-4" />
                </div>
              </div>
            )}

            {isUploadingImage && (
              <div className="flex h-32 w-full flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="mt-2 text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Загрузка...</span>
              </div>
            )}

            {currentImageUrl && (
              <div className="group relative h-40 w-full overflow-hidden rounded-xl border border-border/50 bg-muted/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={toAbsoluteUrl(currentImageUrl)}
                  alt="Preview"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <label
                    htmlFor="image-edit"
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/40 transition-all hover:scale-110"
                    title="Change image"
                  >
                    <Plus className="h-5 w-5" />
                    <input id="image-edit" type="file" accept="image/*" className="sr-only" onChange={handleUpload} />
                  </label>
                  <button
                    type="button"
                    onClick={editing ? handleDeleteImage : handleClearUploadedImage}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/60 text-white backdrop-blur-md hover:bg-destructive/90 transition-all hover:scale-110"
                    title="Delete image"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={handleCloseModal}>
              Отмена
            </Button>
            <Button type="submit" className="flex-1" isLoading={isLoading}>
              {editing ? "Save Changes" : "Create News"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
