"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLoginMutation } from "@/services/base-api";
import { toast } from "sonner";

const schema = z.object({
  phone: z.string().min(9, "Номер телефона обязателен"),
  password: z.string().min(4, "Пароль обязателен"),
});

type LoginValues = z.infer<typeof schema>;

export function LoginForm() {
  const [login, { isLoading }] = useLoginMutation();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: LoginValues) => {
    try {
      await login(values).unwrap();
      toast.success("Рады снова вас видеть");
      router.replace("/dashboard");
    } catch (error: unknown) {
      toast.error("Не удалось войти");
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Номер телефона</label>
        <Input placeholder="998 90 123 45 67" {...register("phone")} />
        {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
      </div>
      <div>
        <label className="text-sm font-medium">Пароль</label>
        <Input type="password" placeholder="•••••••" {...register("password")} />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>
      <Button type="submit" className="w-full" isLoading={isLoading}>
        Войти
      </Button>
    </form>
  );
}
