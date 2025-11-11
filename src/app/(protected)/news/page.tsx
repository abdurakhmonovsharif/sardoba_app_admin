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
  useUploadNewsAssetMutation,
} from "@/services/base-api";
import type { NewsItem } from "@/types";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  priority: z.enum(["low", "normal", "high"]),
});

type NewsValues = z.infer<typeof schema>;

export default function NewsPage() {
  const { data } = useGetNewsQuery({ page: 1, page_size: 20 });
  const [saveNews, { isLoading }] = useSaveNewsMutation();
  const [deleteNews] = useDeleteNewsMutation();
  const [uploadAsset] = useUploadNewsAssetMutation();
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const form = useForm<NewsValues>({ resolver: zodResolver(schema), defaultValues: { priority: "normal" } });

  useEffect(() => {
    if (editing) {
      form.reset({
        title: editing.title,
        description: editing.description,
        starts_at: editing.starts_at?.split("T")[0],
        ends_at: editing.ends_at?.split("T")[0],
        priority: (editing.priority as NewsValues["priority"]) ?? "normal",
      });
    } else {
      form.reset({ title: "", description: "", starts_at: "", ends_at: "", priority: "normal" });
    }
  }, [editing, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await saveNews({ ...values, id: editing?.id }).unwrap();
      toast.success(editing ? "News updated" : "News published");
      setEditing(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save news");
    }
  });

  const handleDelete = async (id: number) => {
    try {
      await deleteNews(id).unwrap();
      toast.success("News removed");
    } catch (error) {
      console.error(error);
      toast.error("Unable to delete");
    }
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!editing?.id || !event.target.files?.length) return;
    const formData = new FormData();
    formData.append("image", event.target.files[0]);
    formData.append("news_id", String(editing.id));
    await uploadAsset(formData).unwrap();
    toast.success("Image uploaded");
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="News" description="Push announcements to the mobile app" />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{editing ? "Update news" : "Create news"}</CardTitle>
            <CardDescription>/news endpoints</CardDescription>
          </CardHeader>
          <form onSubmit={onSubmit} className="space-y-4 p-6 pt-0">
            <div>
              <label className="text-xs uppercase text-muted-foreground">Title</label>
              <Input {...form.register("title")} />
            </div>
            <div>
              <label className="text-xs uppercase text-muted-foreground">Description</label>
              <Textarea rows={4} {...form.register("description")} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase text-muted-foreground">Starts</label>
                <Input type="date" {...form.register("starts_at")} />
              </div>
              <div>
                <label className="text-xs uppercase text-muted-foreground">Ends</label>
                <Input type="date" {...form.register("ends_at")} />
              </div>
            </div>
            <div>
              <label className="text-xs uppercase text-muted-foreground">Priority</label>
              <select className="w-full rounded-lg border border-input px-3 py-2" {...form.register("priority")}> 
??? need to finish select options etc.*
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
            {editing && (
              <div>
                <label className="text-xs uppercase text-muted-foreground">Image</label>
                <input type="file" accept="image/*" className="w-full text-sm" onChange={handleUpload} />
              </div>
            )}
            <Button type="submit" isLoading={isLoading}>
              {editing ? "Save changes" : "Publish news"}
            </Button>
            {editing && (
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Cancel
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
                  <Badge variant={item.priority === "high" ? "danger" : "default"}>{item.priority}</Badge>
                </CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-4 text-xs text-muted-foreground">
                  <span>Active: {item.is_active ? "Yes" : "No"}</span>
                  <span>Window: {formatDate(item.starts_at ?? "")}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditing(item)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No news entries yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
