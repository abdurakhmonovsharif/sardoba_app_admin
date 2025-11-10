"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { SectionHeader } from "@/components/common/section-header";
import { DataTable } from "@/components/tables/data-table";
import { RoleGate } from "@/components/auth/role-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  useGetStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  useRegenerateReferralCodeMutation,
} from "@/services/base-api";
import type { StaffMember } from "@/types";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().min(7),
  role: z.enum(["manager", "waiter"]),
  branch: z.string().optional(),
});

type StaffFormValues = z.infer<typeof schema>;

export default function StaffPage() {
  const { data: staff } = useGetStaffQuery();
  const [createStaff, { isLoading: isCreating }] = useCreateStaffMutation();
  const [updateStaff, { isLoading: isUpdating }] = useUpdateStaffMutation();
  const [deleteStaff] = useDeleteStaffMutation();
  const [regenerateCode] = useRegenerateReferralCodeMutation();
  const [editing, setEditing] = useState<StaffMember | null>(null);

  const form = useForm<StaffFormValues>({ resolver: zodResolver(schema), defaultValues: { role: "waiter" } });

  useEffect(() => {
    if (editing) {
      form.reset({
        name: editing.name,
        phone: editing.phone,
        role: editing.role,
        branch: editing.branch ?? "",
      });
    } else {
      form.reset({ name: "", phone: "", role: "waiter", branch: "" });
    }
  }, [editing, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (editing) {
        await updateStaff({ id: editing.id, body: values }).unwrap();
        toast.success("Staff updated");
      } else {
        await createStaff(values).unwrap();
        toast.success("Staff created");
      }
      setEditing(null);
      form.reset();
    } catch (error) {
      console.error(error);
      toast.error("Operation failed");
    }
  });

  const handleDelete = async (id: number) => {
    try {
      await deleteStaff(id).unwrap();
      toast.success("Staff removed");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete");
    }
  };

  const handleRegenerate = async (id: number) => {
    try {
      await regenerateCode(id).unwrap();
      toast.success("Referral regenerated");
    } catch (error) {
      console.error(error);
      toast.error("Unable to regenerate referral");
    }
  };

  const columns: ColumnDef<StaffMember>[] = [
    { header: "Name", accessorKey: "name" },
    { header: "Phone", accessorKey: "phone" },
    {
      header: "Role",
      cell: ({ row }) => <Badge>{row.original.role}</Badge>,
    },
    { header: "Branch", accessorKey: "branch" },
    {
      header: "Referral",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono">{row.original.referral_code ?? "—"}</span>
          {row.original.role === "waiter" && (
            <Button variant="outline" size="sm" onClick={() => handleRegenerate(row.original.id)}>
              Regenerate
            </Button>
          )}
        </div>
      ),
    },
    {
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(row.original)}>
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(row.original.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <RoleGate minRole="manager" fallback={<p className="text-sm text-muted-foreground">Manager access only</p>}>
      <div className="space-y-6">
        <SectionHeader title="Staff management" description="Control waiter and manager access" />

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{editing ? "Update staff" : "Create staff"}</CardTitle>
              <CardDescription>/auth/staff endpoints</CardDescription>
            </CardHeader>
            <form onSubmit={onSubmit} className="space-y-4 p-6 pt-0">
              <div>
                <label className="text-xs uppercase text-muted-foreground">Name</label>
                <Input {...form.register("name")} />
              </div>
              <div>
                <label className="text-xs uppercase text-muted-foreground">Phone</label>
                <Input {...form.register("phone")} />
              </div>
              <div>
                <label className="text-xs uppercase text-muted-foreground">Role</label>
                <Select {...form.register("role")}>
                  <option value="waiter">Waiter</option>
                  <option value="manager">Manager</option>
                </Select>
              </div>
              <div>
                <label className="text-xs uppercase text-muted-foreground">Branch</label>
                <Input {...form.register("branch")} />
              </div>
              <Button type="submit" isLoading={editing ? isUpdating : isCreating}>
                {editing ? "Save changes" : "Create staff"}
              </Button>
              {editing && (
                <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              )}
            </form>
          </Card>

          <Card className="lg:row-span-2">
            <CardHeader>
              <CardTitle>Team directory</CardTitle>
              <CardDescription>Waiter referral codes and login roles</CardDescription>
            </CardHeader>
            <div className="p-6 pt-0">
              <DataTable columns={columns} data={staff ?? []} total={staff?.length} page={1} pageSize={staff?.length ?? 10} />
            </div>
          </Card>
        </div>
      </div>
    </RoleGate>
  );
}
