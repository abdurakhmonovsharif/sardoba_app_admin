"use client";

import { useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SectionHeader } from "@/components/common/section-header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import {
  useGetCategoriesQuery,
  useSaveCategoryMutation,
  useGetProductsQuery,
  useSaveProductMutation,
  useSyncMenuMutation,
} from "@/services/base-api";
import type { Category, Product } from "@/types";
import { toast } from "sonner";

const categorySchema = z.object({ name: z.string().min(2) });
const productSchema = z.object({
  name: z.string().min(2),
  price: z.coerce.number().positive(),
  category_id: z.coerce.number(),
});

type CategoryValues = z.infer<typeof categorySchema>;
type ProductValues = z.infer<typeof productSchema>;

export default function CatalogPage() {
  const [productPage, setProductPage] = useState(1);
  const { data: categories } = useGetCategoriesQuery();
  const { data: products } = useGetProductsQuery({ page: productPage, page_size: 10 });
  const [saveCategory, { isLoading: savingCategory }] = useSaveCategoryMutation();
  const [saveProduct, { isLoading: savingProduct }] = useSaveProductMutation();
  const [syncMenu, { isLoading: syncingMenu }] = useSyncMenuMutation();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const categoryForm = useForm<CategoryValues>({ resolver: zodResolver(categorySchema) });
  const productForm = useForm<ProductValues>({ resolver: zodResolver(productSchema) });

  useEffect(() => {
    if (editingCategory) {
      categoryForm.reset({ name: editingCategory.name });
    } else {
      categoryForm.reset({ name: "" });
    }
  }, [editingCategory, categoryForm]);

  useEffect(() => {
    if (editingProduct) {
      productForm.reset({
        name: editingProduct.name,
        price: editingProduct.price,
        category_id: editingProduct.category.id,
      });
    } else {
      productForm.reset({ name: "", price: 0, category_id: categories?.[0]?.id ?? 0 });
    }
  }, [editingProduct, categories, productForm]);

  const handleCategorySubmit = categoryForm.handleSubmit(async (values) => {
    try {
      await saveCategory({ id: editingCategory?.id, name: values.name }).unwrap();
      toast.success("Category saved");
      setEditingCategory(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save category");
    }
  });

  const handleProductSubmit = productForm.handleSubmit(async (values) => {
    try {
      await saveProduct({ id: editingProduct?.id, ...values }).unwrap();
      toast.success("Product saved");
      setEditingProduct(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save product");
    }
  });

  const handleSync = async () => {
    try {
      await syncMenu().unwrap();
      toast.success("Menu sync triggered");
    } catch (error) {
      console.error(error);
      toast.error("Unable to sync catalog");
    }
  };

  const productColumns: ColumnDef<Product>[] = [
    { header: "Product", accessorKey: "name" },
    { header: "Category", cell: ({ row }) => row.original.category.name },
    { header: "Price", cell: ({ row }) => `${row.original.price.toLocaleString()} UZS` },
    {
      header: "Status",
      cell: ({ row }) => (row.original.is_active ? "Active" : "Hidden"),
    },
    {
      header: "Actions",
      cell: ({ row }) => (
        <Button variant="outline" size="sm" onClick={() => setEditingProduct(row.original)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader title="Catalog" description="Menu sync and local overrides" />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{editingCategory ? "Update category" : "Create category"}</CardTitle>
            <CardDescription>app/core/storage integration</CardDescription>
          </CardHeader>
          <form onSubmit={handleCategorySubmit} className="space-y-3 p-6 pt-0">
            <Input placeholder="Desserts" {...categoryForm.register("name")} />
            <Button type="submit" isLoading={savingCategory}>
              {editingCategory ? "Save" : "Create"}
            </Button>
            {editingCategory && (
              <Button variant="ghost" type="button" onClick={() => setEditingCategory(null)}>
                Cancel
              </Button>
            )}
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{editingProduct ? "Update product" : "Create product"}</CardTitle>
            <CardDescription>Images upload through /files</CardDescription>
          </CardHeader>
          <form onSubmit={handleProductSubmit} className="space-y-4 p-6 pt-0">
            <Input placeholder="Latte" {...productForm.register("name")} />
            <Input type="number" placeholder="20000" {...productForm.register("price", { valueAsNumber: true })} />
            <select className="w-full rounded-lg border border-input px-3 py-2" {...productForm.register("category_id", { valueAsNumber: true })}>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-3">
              <Button type="submit" isLoading={savingProduct}>
                {editingProduct ? "Save product" : "Create product"}
              </Button>
              <Button type="button" variant="outline" onClick={handleSync} isLoading={syncingMenu}>
                Sync from Ikko
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product list</CardTitle>
          <CardDescription>Manage price, category assignments</CardDescription>
        </CardHeader>
        <div className="p-6 pt-0">
          <DataTable
            columns={productColumns}
            data={products?.data ?? []}
            total={products?.total}
            page={products?.page ?? productPage}
            pageSize={products?.page_size ?? 10}
            onPageChange={setProductPage}
          />
        </div>
      </Card>
    </div>
  );
}
