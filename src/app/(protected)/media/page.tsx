"use client";

import { useState } from "react";
import Image from "next/image";
import { SectionHeader } from "@/components/common/section-header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useGetMediaLibraryQuery,
  useDeleteMediaMutation,
} from "@/services/base-api";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function MediaPage() {
  const [page, setPage] = useState(1);
  const { data } = useGetMediaLibraryQuery({ page, page_size: 12 });
  const [deleteMedia] = useDeleteMediaMutation();
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.page_size ?? 12)));

  const handleDelete = async (id: number) => {
    try {
      await deleteMedia(id).unwrap();
      toast.success("Файл удалён");
    } catch (error) {
      console.error(error);
      toast.error("Не удалось удалить файл");
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Файлы и медиа" description="Хранилище изображений профилей, новостей и товаров" />
      <Card>
        <CardHeader>
          <CardTitle>Библиотека</CardTitle>
          <CardDescription>Ссылки из app/core/storage</CardDescription>
        </CardHeader>
        <div className="grid gap-4 p-6 pt-0 sm:grid-cols-2 lg:grid-cols-3">
          {data?.data?.length ? (
            data.data.map((file) => (
            <div key={file.id} className="rounded-2xl border border-border/70 p-4">
              {file.type.startsWith("image") && (
                <div className="relative mb-3 h-40 w-full overflow-hidden rounded-xl bg-muted/50">
                  <Image src={file.url} alt={file.name} fill unoptimized className="object-cover" />
                </div>
              )}
              <p className="font-semibold">{file.name}</p>
              <p className="text-xs text-muted-foreground">Используется в {file.referenced_by} объектах</p>
              <p className="text-xs text-muted-foreground">Загружено {formatDate(file.created_at)}</p>
              <div className="mt-3 flex gap-2">
                <a
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 items-center justify-center rounded-lg border border-border px-3 text-xs font-medium"
                >
                  Предпросмотр
                </a>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(file.id)}>
                  Удалить
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Файлы не загружены</p>
        )}
        </div>
        <div className="flex items-center justify-between px-6 pb-6 text-sm text-muted-foreground">
          <span>
            Страница {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Назад
            </Button>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Далее
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
