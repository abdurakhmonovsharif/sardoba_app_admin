"use client";

import { useEffect, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  useGetUserByIdQuery,
  useGetCashbackByUserQuery,
  useGetOtpLogsQuery,
  useGetStaffQuery,
  useUpdateUserMutation,
  useDeactivateUserMutation,
  useResetLoyaltyLevelMutation,
  useResetWalletMutation,
  useUploadProfilePhotoMutation,
} from "@/services/base-api";

interface Props {
  userId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserDetailDrawer({ userId, isOpen, onClose }: Props) {
  const { data: user } = useGetUserByIdQuery(userId!, { skip: !userId });
  const { data: cashback } = useGetCashbackByUserQuery(userId!, { skip: !userId });
  const { data: otpLogs } = useGetOtpLogsQuery(
    userId ? { user_id: userId, page: 1 } : undefined,
    { skip: !userId },
  );
  const { data: staff } = useGetStaffQuery(undefined, { skip: !isOpen });
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [toggleStatus, { isLoading: isToggling }] = useDeactivateUserMutation();
  const [resetLoyalty, { isLoading: isResettingLoyalty }] = useResetLoyaltyLevelMutation();
  const [resetWallet, { isLoading: isResettingWallet }] = useResetWalletMutation();
  const [uploadPhoto] = useUploadProfilePhotoMutation();

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      first_name: "",
      last_name: "",
      dob: "",
      waiter_id: "",
    },
  });

  useEffect(() => {
    if (user) {
      const [firstFromName = "", ...rest] = user.name?.split(" ") ?? [];
      reset({
        first_name: user.first_name ?? firstFromName ?? "",
        last_name: user.last_name ?? rest.join(" "),
        dob: user.dob?.split("T")[0] ?? user.date_of_birth ?? "",
        waiter_id: user.waiter?.id?.toString() ?? "",
      });
    }
  }, [user, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (!userId) return;
    try {
      await updateUser({
        id: userId,
        body: {
          first_name: values.first_name,
          last_name: values.last_name,
          dob: values.dob,
          waiter_id: values.waiter_id ? Number(values.waiter_id) : null,
        },
      }).unwrap();
      toast.success("Profile updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update user");
    }
  });

  const handleToggle = async () => {
    if (!userId || !user) return;
    try {
      await toggleStatus({ id: userId, is_active: !user.is_active }).unwrap();
      toast.success(user.is_active ? "User deactivated" : "User reactivated");
    } catch (error) {
      console.error(error);
      toast.error("Operation failed");
    }
  };

  const handleResetLoyalty = async () => {
    if (!userId) return;
    try {
      await resetLoyalty({ id: userId, level: "bronze" }).unwrap();
      toast.success("Loyalty reset");
    } catch (error) {
      console.error(error);
      toast.error("Failed to reset loyalty");
    }
  };

  const handleResetWallet = async () => {
    if (!userId) return;
    try {
      await resetWallet({ id: userId }).unwrap();
      toast.success("Wallet cleared");
    } catch (error) {
      console.error(error);
      toast.error("Failed to reset wallet");
    }
  };

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length || !userId) return;
    const formData = new FormData();
    formData.append("file", event.target.files[0]);
    formData.append("user_id", String(userId));
    try {
      await uploadPhoto(formData).unwrap();
      toast.success("Photo updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload photo");
    }
  };

  return (
    <Drawer
      title={
        user
          ? `${[user.first_name, user.last_name].filter(Boolean).join(" ") || user.name || `User #${user.id}`}`
          : "User details"
      }
      isOpen={isOpen}
      onClose={onClose}
    >
      {!user && <p className="text-sm text-muted-foreground">Select a user to inspect</p>}
      {user && (
        <div className="space-y-6">
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-semibold">{user.phone}</p>
              </div>
              <Badge variant={user.is_active ? "success" : "danger"}>{user.is_active ? "Active" : "Inactive"}</Badge>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Waiter</p>
                <p className="font-medium">{user.waiter?.name ?? (user.waiter_id ? `#${user.waiter_id}` : "—")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Joined</p>
                <p className="font-medium">{formatDate(user.created_at ?? user.date_of_birth ?? "")}</p>
              </div>
            </div>
            <label className="text-sm font-medium">
              Profile photo
              <input type="file" accept="image/*" className="mt-1 block w-full text-sm" onChange={handlePhotoChange} />
            </label>
            <Button variant="outline" onClick={handleToggle} isLoading={isToggling}>
              {user.is_active ? "Deactivate" : "Activate"} user
            </Button>
          </section>

          <section className="rounded-2xl border border-border/70 p-4">
            <h4 className="text-sm font-semibold">Loyalty summary</h4>
            <div className="mt-3 grid gap-2 text-sm">
              <p>Points: {user.loyalty?.current_points ?? user.cashback_balance ?? 0}</p>
              <p>Level: {user.loyalty?.current_level ?? user.level ?? "—"}</p>
              {user.loyalty?.next_level && (
                <p>
                  Next level ({user.loyalty.next_level}) in {user.loyalty?.next_level_threshold ?? 0} pts
                </p>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" onClick={handleResetLoyalty} isLoading={isResettingLoyalty}>
                Reset loyalty
              </Button>
              <Button variant="outline" onClick={handleResetWallet} isLoading={isResettingWallet}>
                Reset wallet
              </Button>
            </div>
          </section>

          <section>
            <h4 className="mb-2 text-sm font-semibold">Edit profile</h4>
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs uppercase text-muted-foreground">First name</label>
                  <Input {...register("first_name")} />
                </div>
                <div>
                  <label className="text-xs uppercase text-muted-foreground">Last name</label>
                  <Input {...register("last_name")} />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs uppercase text-muted-foreground">Date of birth</label>
                  <Input type="date" {...register("dob")} />
                </div>
                <div>
                  <label className="text-xs uppercase text-muted-foreground">Waiter</label>
                  <Select {...register("waiter_id")}>
                    <option value="">Unassigned</option>
                    {staff
                      ?.filter((member) => member.role === "waiter")
                      .map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                  </Select>
                </div>
              </div>
              <Button type="submit" isLoading={isUpdating}>
                Save changes
              </Button>
            </form>
          </section>

          <section>
            <h4 className="mb-2 text-sm font-semibold">Recent cashback</h4>
            <div className="space-y-2 text-sm">
              {cashback?.history?.length ? (
                cashback.history.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
                    <div>
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                    </div>
                    <span className="font-semibold text-emerald-600">{formatCurrency(tx.amount)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No cashback history</p>
              )}
            </div>
          </section>

          <section>
            <h4 className="mb-2 text-sm font-semibold">OTP history</h4>
            <div className="space-y-2 text-sm">
              {otpLogs?.data?.length ? (
                otpLogs.data.slice(0, 5).map((otp) => (
                  <div key={otp.id} className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
                    <div>
                      <p className="font-medium">{otp.status.toUpperCase()}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(otp.created_at)}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{otp.metadata?.channel ?? "SMS"}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No OTP activity</p>
              )}
            </div>
          </section>
        </div>
      )}
    </Drawer>
  );
}
