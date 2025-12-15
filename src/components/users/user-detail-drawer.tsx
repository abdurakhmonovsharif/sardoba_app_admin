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
  const { data: user } = useGetUserByIdQuery(userId!, { skip: !userId });
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
            <h4 className="mb-2 text-sm font-semibold">Transactions</h4>
            <div className="space-y-2 text-sm">
              {user.transactions?.length ? (
                user.transactions
                  .slice((txPage - 1) * TX_PAGE_SIZE, txPage * TX_PAGE_SIZE)
                  .map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
                    <div>
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                      {(tx.balance_before !== undefined || tx.balance_after !== undefined) && (
                        <p className="text-[11px] text-muted-foreground">
                          Balance {tx.balance_before ?? "—"} → {tx.balance_after ?? "—"}
                        </p>
                      )}
                    </div>
                    <span className="font-semibold text-emerald-600">{formatCurrency(tx.amount)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No transactions</p>
              )}
            </div>
            {user.transactions && user.transactions.length > TX_PAGE_SIZE && (
              <div className="mt-3 flex items-center justify-between text-sm">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={txPage === 1}
                  onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                <p className="text-muted-foreground">
                  Page {txPage} of {Math.ceil((user.transactions?.length ?? 0) / TX_PAGE_SIZE)}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={txPage >= Math.ceil((user.transactions?.length ?? 0) / TX_PAGE_SIZE)}
                  onClick={() => setTxPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </section>

          <section>
            <h4 className="mb-2 text-sm font-semibold">User images</h4>
            {user.files?.length ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {user.files.map((file) => (
                  <a
                    key={file.id}
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group overflow-hidden rounded-xl border border-border/60"
                  >
                    <div className="aspect-square bg-muted/60">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={file.url} alt={file.name ?? "User image"} className="h-full w-full object-cover transition duration-200 group-hover:scale-105" />
                    </div>
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      <p className="truncate">{file.name ?? `Image #${file.id}`}</p>
                      <p className="truncate">{formatDate(file.created_at)}</p>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No user images</p>
            )}
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
                    <span className="text-xs text-muted-foreground">{typeof otp.metadata?.channel === "string" ? otp.metadata.channel : "SMS"}</span>
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
