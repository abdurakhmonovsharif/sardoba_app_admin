"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { SectionHeader } from "@/components/common/section-header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import {
  useGetCategoriesQuery,
  useGetProductsQuery,
  useSyncMenuMutation,
} from "@/services/base-api";
import type { Product } from "@/types";
import { toast } from "sonner";
import { Select } from "@/components/ui/select";

export default function CatalogPage() {
  const [productPage, setProductPage] = useState(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(13);
  const { data: categories } = useGetCategoriesQuery();
  const productParams: Record<string, string | number | boolean> = {
    page: productPage,
    page_size: 25,
    ...(selectedCategoryId ? { category_id: selectedCategoryId } : {}),
  };
  const { data: products } = useGetProductsQuery(productParams);
  const [syncMenu, { isLoading: syncingMenu }] = useSyncMenuMutation();
  const selectedCategory = categories?.find((c) => c.id === selectedCategoryId);
  const totalPages = Math.max(1, Math.ceil((products?.total ?? 0) / (products?.page_size ?? 25)));

  const productColumns: ColumnDef<Product>[] = [
    {
      header: "Товар",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-md border border-border/60 bg-muted/40">
            {row.original.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.original.image_url} alt={row.original.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[11px] text-muted-foreground">Нет фото</div>
            )}
          </div>
          <div>
            <p className="font-semibold">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">ID: {row.original.id}</p>
          </div>
        </div>
      ),
    },
    { header: "Категория", cell: ({ row }) => row.original.category.name },
    { header: "Цена", cell: ({ row }) => `${row.original.price.toLocaleString()} UZS` },
    {
      header: "Статус",
      cell: ({ row }) => (row.original.is_active ? "Активен" : "Скрыт"),
    },
  ];

  return (
    <div className="space-y-6 px-2 pb-6 md:px-0">
      <SectionHeader
        title="Каталог"
        description="Только просмотр. Управление через Ikko."
        action={
          <Button
            onClick={async () => {
              try {
                await syncMenu().unwrap();
                toast.success("Синхронизация запущена");
              } catch (error) {
                console.error(error);
                toast.error("Не удалось запустить синхронизацию");
              }
            }}
            isLoading={syncingMenu}
            variant="outline"
          >
            Синхронизировать с Ikko
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Категории</CardTitle>
          <CardDescription>Синхронизированы с Ikko; только чтение</CardDescription>
        </CardHeader>
        <div className="gap-3 p-6 pt-0 md:hidden">
          <p className="text-sm text-muted-foreground">Выберите категорию</p>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 overflow-hidden rounded-md border border-border/60 bg-muted/40">
              {selectedCategory?.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedCategory.image_url} alt={selectedCategory.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[11px] text-muted-foreground">Нет фото</div>
              )}
            </div>
            <Select
              value={selectedCategoryId?.toString() ?? ""}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : null;
                setSelectedCategoryId(val);
                setProductPage(1);
              }}
            >
              <option value="">Все категории</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="hidden gap-2 p-6 pt-0 text-sm md:grid md:grid-cols-2 lg:grid-cols-3">
          {categories?.length ? (
            categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setProductPage(1);
                  setSelectedCategoryId((prev) => (prev === category.id ? null : category.id));
                }}
                className={`rounded-lg border px-4 py-3 text-left transition ${
                  selectedCategoryId === category.id
                    ? "border-primary bg-primary/5"
                    : "border-border/70 hover:border-primary/40"
                }`}
              >
                <div className="mb-2 h-10 w-10 overflow-hidden rounded-md border border-border/60 bg-muted/40">
                  {category.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={category.image_url} alt={category.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[11px] text-muted-foreground">
                      Нет фото
                    </div>
                  )}
                </div>
                <p className="font-semibold">{category.name}</p>
                <p className="text-xs text-muted-foreground">ID категории: {category.id}</p>
              </button>
            ))
          ) : (
            <p className="text-muted-foreground">Категории недоступны.</p>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Список товаров</CardTitle>
          <CardDescription>Только просмотр; изменения в Ikko</CardDescription>
        </CardHeader>
        <div className="p-6 pt-0">
          {selectedCategoryId && (
            <p className="mb-3 text-sm text-muted-foreground">
              Фильтр по категории ID {selectedCategoryId}. Выберите другую категорию, чтобы изменить фильтр.
            </p>
          )}
          <div className="hidden md:block">
            <DataTable
              columns={productColumns}
              data={products?.data ?? []}
              total={products?.total}
              page={products?.page ?? productPage}
              pageSize={products?.page_size ?? 25}
              onPageChange={setProductPage}
              showSearch={false}
            />
          </div>

          <div className="grid gap-3 md:hidden">
            {(products?.data ?? []).map((product) => (
              <div key={product.id} className="rounded-2xl border border-border/70 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 overflow-hidden rounded-md border border-border/60 bg-muted/40">
                    {product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[11px] text-muted-foreground">
                        Нет фото
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-xs text-muted-foreground">ID: {product.id}</p>
                    <p className="text-xs text-muted-foreground">Категория: {product.category.name}</p>
                  </div>
                  <span className="text-sm font-semibold">{product.price.toLocaleString()} UZS</span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Статус: {product.is_active ? "Активен" : "Скрыт"}
                </div>
              </div>
            ))}
            {!products?.data?.length && <p className="text-sm text-muted-foreground">Нет товаров</p>}

            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <Button
                variant="outline"
                size="sm"
                disabled={(products?.page ?? productPage) <= 1}
                onClick={() => setProductPage((p) => Math.max(1, p - 1))}
              >
                Назад
              </Button>
              <span>
                Страница {products?.page ?? productPage} из {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={(products?.page ?? productPage) >= totalPages}
                onClick={() => setProductPage((p) => Math.min(totalPages, p + 1))}
              >
                Далее
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
