"use client";

import { useEffect, useState, type ChangeEvent } from "react";
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
  useGetOtpLogsQuery,
  useGetStaffQuery,
  useGetWaitersQuery,
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
  const { data: user, isLoading, error } = useGetUserByIdQuery(userId!, { skip: !userId });
  const { data: otpLogs } = useGetOtpLogsQuery(
    userId ? { user_id: userId, page: 1 } : undefined,
    { skip: !userId },
  );
  const { data: staff } = useGetStaffQuery(undefined, { skip: !isOpen });
  const { data: waiters } = useGetWaitersQuery({ page: 1, size: 100 }, { skip: !isOpen });
  const [txPage, setTxPage] = useState(1);
  const TX_PAGE_SIZE = 10;
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [toggleStatus, { isLoading: isToggling }] = useDeactivateUserMutation();
  const [resetLoyalty, { isLoading: isResettingLoyalty }] = useResetLoyaltyLevelMutation();
  const [resetWallet, { isLoading: isResettingWallet }] = useResetWalletMutation();
  const [uploadPhoto] = useUploadProfilePhotoMutation();

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      first_name: "",
      last_name: "",
      middleName: "",
      dob: "",
      waiter_id: "",
    },
  });

  useEffect(() => {
    if (user) {
      setTxPage(1);
      const [firstFromName = "", ...rest] = user.name?.split(" ") ?? [];
      reset({
        first_name: user.first_name ?? firstFromName ?? "",
        last_name: user.last_name ?? rest.join(" "),
        middleName: user.middleName ?? "",
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
          middleName: values.middleName,
          dob: values.dob,
          waiter_id: values.waiter_id ? Number(values.waiter_id) : undefined,
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
      {isLoading && (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}
      {error && (
        <div className="flex h-40 flex-col items-center justify-center gap-2 text-destructive">
          <p className="font-semibold">Failed to load user</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      )}
      {!user && !isLoading && !error && <p className="text-sm text-muted-foreground">Select a user to inspect</p>}
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
                <p className="font-medium">
                  {user.waiter?.name ??
                    waiters?.data?.find((member) => member.id === user.waiter_id)?.name ??
                    (user.waiter_id ? `#${user.waiter_id}` : "—")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Joined</p>
                <p className="font-medium">{formatDate(user.created_at)}</p>
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{[user.first_name, user.middleName, user.last_name].filter(Boolean).join(" ") || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date of birth</p>
                <p className="font-medium">{formatDate(user.date_of_birth ?? user.dob ?? "")}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Profile photo</p>
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 overflow-hidden rounded-full bg-muted">
                  {user.profile_photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.profile_photo_url} alt={user.name ?? "Profile photo"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No photo</div>
                  )}
                </div>
                <input type="file" accept="image/*" className="block w-full text-sm" onChange={handlePhotoChange} />
              </div>
            </div>
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
              <div>
                <label className="text-xs uppercase text-muted-foreground">Middle name</label>
                <Input {...register("middleName")} />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs uppercase text-muted-foreground">Date of birth</label>
                  <Input {...register("dob")} placeholder="DD.MM.YYYY" />
                </div>
                <div>
                  <label className="text-xs uppercase text-muted-foreground">Waiter</label>
                  <Select {...register("waiter_id")}>
                    <option value="">Unassigned</option>
                    {(waiters?.data ?? staff ?? [])
                      .filter((member) => member.role?.toLowerCase?.() === "waiter")
                      .map((member) => (
                        <option key={member.id} value={member.id?.toString?.() ?? member.id}>
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
            <h4 className="mb-2 text-sm font-semibold">OTP history</h4>
            <div className="space-y-2 text-sm">
              {otpLogs?.data?.length ? (
                otpLogs.data.slice(0, 5).map((otp) => (
                  <div key={otp.id} className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
                    <div>
                      <p className="font-medium">
                        {otp.event === "otp_verification" ? "OTP Verification" : otp.event || otp.action || "Activity"}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(otp.created_at)}</p>
                      {otp.meta?.purpose && (
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Purpose: {String(otp.meta.purpose)}</p>
                      )}
                    </div>
                    <Badge variant={otp.status === "success" || otp.status === "sent" ? "success" : "danger"} className="text-[10px] h-5">
                      {otp.status.toUpperCase()}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No activity history</p>
              )}
            </div>
          </section>
        </div>
      )}
    </Drawer>
  );
}
