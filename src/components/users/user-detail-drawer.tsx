"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Image from "next/image";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { formatCurrency, formatDate, formatUZS } from "@/lib/utils";
import QRCode from "qrcode";
import {
  useGetUserByIdQuery,
  useGetOtpLogsQuery,
  useGetStaffQuery,
  useGetWaitersQuery,
  useUpdateUserMutation,
  useDeactivateUserMutation,
  useUploadProfilePhotoMutation,
} from "@/services/base-api";
import type { StaffMember, UserCard } from "@/types";

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
  const [isTransactionsOpen, setIsTransactionsOpen] = useState(false);
  const [qrCardNumber, setQrCardNumber] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isQrGenerating, setIsQrGenerating] = useState(false);
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [toggleStatus, { isLoading: isToggling }] = useDeactivateUserMutation();
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

  const userDisplayName = user
    ? ([user.first_name, user.last_name].filter(Boolean).join(" ") || user.name || `Клиент #${user.id}`)
    : null;

  const transactionsOpen = Boolean(isTransactionsOpen && userId);
  const normalizeStaffList = (value: unknown): StaffMember[] => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const maybeItems = (value as { items?: unknown; data?: unknown }).items ?? (value as { items?: unknown; data?: unknown }).data;
      if (Array.isArray(maybeItems)) return maybeItems;
    }
    return [];
  };

  const waiterSource: StaffMember[] =
    ([waiters?.data, waiters, staff] as unknown[])
      .map(normalizeStaffList)
      .find((list) => list.length) ?? [];

  const waiterOptions = waiterSource.filter(
    (member) => member.role?.toLowerCase?.() === "waiter",
  );
  const userCards: UserCard[] = (user?.cards ?? []).filter((card): card is UserCard => Boolean(card));

  const openQrForCard = async (cardNumber: string) => {
    setQrCardNumber(cardNumber);
    setQrDataUrl(null);
    setIsQrGenerating(true);
    try {
      const url = await QRCode.toDataURL(cardNumber, { margin: 2, width: 320 });
      setQrDataUrl(url);
    } catch (err) {
      console.error("Failed to generate QR", err);
      setQrDataUrl(null);
    } finally {
      setIsQrGenerating(false);
    }
  };

  const closeQr = () => {
    setQrCardNumber(null);
    setQrDataUrl(null);
    setIsQrGenerating(false);
  };

  const sortedTransactions = (user?.transactions ?? [])
    .slice()
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

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
      toast.success("Профиль обновлён");
    } catch (error) {
      console.error(error);
      toast.error("Не удалось обновить профиль");
    }
  });

  const handleToggle = async () => {
    if (!userId || !user) return;
    try {
      await toggleStatus({ id: userId, is_active: !user.is_active }).unwrap();
      toast.success(user.is_active ? "Клиент деактивирован" : "Клиент восстановлен");
    } catch (error) {
      console.error(error);
      toast.error("Не удалось выполнить действие");
    }
  };

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length || !userId) return;
    const formData = new FormData();
    formData.append("file", event.target.files[0]);
    formData.append("user_id", String(userId));
    try {
      await uploadPhoto(formData).unwrap();
      toast.success("Фото обновлено");
    } catch (error) {
      console.error(error);
      toast.error("Не удалось загрузить фото");
    }
  };

  return (
    <>
      <Drawer title={userDisplayName ?? "Детали клиента"} isOpen={isOpen} onClose={onClose}>
        {isLoading && (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}
        {error && (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-destructive">
            <p className="font-semibold">Не удалось загрузить клиента</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Повторить
            </Button>
          </div>
        )}
        {!user && !isLoading && !error && <p className="text-sm text-muted-foreground">Выберите клиента для просмотра</p>}
        {user && (
          <div className="space-y-6">
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Телефон</p>
                  <p className="font-semibold">{user.phone}</p>
                </div>
                <Badge variant={user.is_active ? "success" : "danger"}>{user.is_active ? "Активен" : "Неактивен"}</Badge>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Официант</p>
                  <p className="font-medium">
                    {user.waiter?.name ??
                      waiters?.data?.find((member) => member.id === user.waiter_id)?.name ??
                      (user.waiter_id ? `#${user.waiter_id}` : "—")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Дата регистрации</p>
                  <p className="font-medium">{formatDate(user.created_at)}</p>
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Имя</p>
                  <p className="font-medium">{[user.first_name, user.middleName, user.last_name].filter(Boolean).join(" ") || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Дата рождения</p>
                  <p className="font-medium">{formatDate(user.date_of_birth ?? user.dob ?? "")}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Фото профиля</p>
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 overflow-hidden rounded-full bg-muted">
                    {user.profile_photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.profile_photo_url} alt={user.name ?? "Фото профиля"} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">Фото отсутствует</div>
                    )}
                  </div>
                  <input type="file" accept="image/*" className="block w-full text-sm" onChange={handlePhotoChange} />
                </div>
              </div>
              <div className="space-y-3 rounded-2xl border border-border/70 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Карта клиента</p>
                  {userCards.length ? (
                    <Badge variant="outline" className="text-[11px]">
                      {userCards.length}
                    </Badge>
                  ) : null}
                </div>
                {userCards.length ? (
                  <div className="space-y-3">
                    {userCards.map((card) => (
                      <div key={card.id ?? card.card_number} className="rounded-xl border border-border/60 p-3">
                        <p className="text-xs uppercase text-muted-foreground">Номер карты</p>
                        <p className="font-mono text-sm">{card.card_number ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">
                          Добавлена: {formatDate(card.created_at, "dd MMM yyyy, HH:mm")}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!card.card_number}
                            onClick={() => card.card_number && openQrForCard(card.card_number)}
                          >
                            QR-код
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Карта не привязана</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleToggle} isLoading={isToggling}>
                  {user.is_active ? "Деактивировать клиента" : "Активировать клиента"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsTransactionsOpen(true)}
                  disabled={isLoading}
                >
                  Открыть транзакции
                </Button>
              </div>
            </section>

            <section className="rounded-2xl border border-border/70 p-4">
              <h4 className="text-sm font-semibold">Сводка по лояльности</h4>
              <div className="mt-3 grid gap-2 text-sm">
                <p>Баллы: {formatUZS(user.cashback_balance ?? 0)}</p>
              </div>
            </section>

            <section>
              <h4 className="mb-2 text-sm font-semibold">Редактировать профиль</h4>
              <form onSubmit={onSubmit} className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase text-muted-foreground">Имя</label>
                    <Input {...register("first_name")} />
                  </div>
                  <div>
                    <label className="text-xs uppercase text-muted-foreground">Фамилия</label>
                    <Input {...register("last_name")} />
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase text-muted-foreground">Отчество</label>
                  <Input {...register("middleName")} />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase text-muted-foreground">Дата рождения</label>
                    <Input {...register("dob")} placeholder="DD.MM.YYYY" />
                  </div>
                  <div>
                    <label className="text-xs uppercase text-muted-foreground">Официант</label>
                    <Select {...register("waiter_id")}>
                      <option value="">Не назначен</option>
                      {waiterOptions.map((member) => (
                        <option key={member.id} value={member.id?.toString?.() ?? member.id}>
                          {member.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <Button type="submit" isLoading={isUpdating}>
                  Сохранить
                </Button>
              </form>
            </section>

            <section>
              <h4 className="mb-2 text-sm font-semibold">История OTP</h4>
              <div className="space-y-2 text-sm">
                {otpLogs?.data?.length ? (
                  otpLogs.data.slice(0, 5).map((otp) => {
                    const purposeValue = otp.meta?.purpose;
                    const purposeLabel =
                      typeof purposeValue === "string" || typeof purposeValue === "number"
                        ? String(purposeValue)
                        : null;
                    return (
                      <div key={otp.id} className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
                        <div>
                          <p className="font-medium">
                            {otp.event === "otp_verification" ? "OTP-проверка" : otp.event || otp.action || "Активность"}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDate(otp.created_at)}</p>
                          {purposeLabel && (
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Цель: {purposeLabel}</p>
                          )}
                        </div>
                        <Badge variant={otp.status === "success" || otp.status === "sent" ? "success" : "danger"} className="text-[10px] h-5">
                          {otp.status.toUpperCase()}
                        </Badge>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">История активности отсутствует</p>
                )}
              </div>
            </section>
          </div>
        )}
      </Drawer>

      <Drawer
        title={userDisplayName ? `Транзакции ${userDisplayName}` : "Транзакции пользователя"}
        isOpen={transactionsOpen}
        onClose={() => setIsTransactionsOpen(false)}
        widthClass="max-w-3xl"
      >
        {isLoading && (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}
        {!isLoading && (
          <div className="space-y-3 py-2">
            {sortedTransactions.length ? (
              sortedTransactions.map((tx) => (
                <div key={tx.id} className="rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">{tx.description || "Транзакция"}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                      {(tx.branch || tx.source) && (
                        <p className="text-xs text-muted-foreground">
                          {tx.branch ? `Филиал: ${tx.branch}` : ""}
                          {tx.source ? `${tx.branch ? " • " : ""}Источник: ${tx.source}` : ""}
                        </p>
                      )}
                      {(tx.staff?.name || tx.staff_id) && (
                        <p className="text-xs text-muted-foreground">
                          Сотрудник: {tx.staff?.name ?? `#${tx.staff_id}`}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(tx.amount)}</p>
                      {(typeof tx.balance_before === "number" || typeof tx.balance_after === "number") && (
                        <p className="text-xs text-muted-foreground">
                          {typeof tx.balance_before === "number" ? formatCurrency(tx.balance_before) : "—"} →{" "}
                          {typeof tx.balance_after === "number" ? formatCurrency(tx.balance_after) : "—"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Транзакции отсутствуют</p>
            )}
          </div>
        )}
      </Drawer>

      <Drawer
        title="QR-код карты"
        isOpen={Boolean(qrCardNumber)}
        onClose={closeQr}
        widthClass="max-w-sm"
      >
        {qrCardNumber ? (
          <div className="flex flex-col items-center gap-3 py-4">
            {isQrGenerating && (
              <div className="flex h-60 w-full items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            )}
            {!isQrGenerating && qrDataUrl && (
              <Image
                src={qrDataUrl}
                alt={`QR код для карты ${qrCardNumber}`}
                width={256}
                height={256}
                className="h-64 w-64 rounded-xl border border-border/70 bg-white p-4 object-contain"
              />
            )}
            {!isQrGenerating && !qrDataUrl && (
              <p className="text-sm text-muted-foreground">Не удалось создать QR-код</p>
            )}
            <p className="text-sm font-mono text-center">{qrCardNumber}</p>
            <p className="text-xs text-muted-foreground text-center">
              Покажите этот QR официанту или отсканируйте в кассе.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Карта не выбрана</p>
        )}
      </Drawer>
    </>
  );
}
