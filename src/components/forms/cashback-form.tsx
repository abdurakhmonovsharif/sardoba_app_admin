"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useIssueCashbackMutation } from "@/services/base-api";
import { toast } from "sonner";

const schema = z.object({
  user_id: z.number().min(1),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function CashbackForm() {
  const [issueCashback, { isLoading }] = useIssueCashbackMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      await issueCashback(values).unwrap();
      toast.success("Cashback granted");
      reset();
    } catch (error) {
      toast.error("Failed to add cashback");
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="text-sm font-medium">User ID</label>
        <Input type="number" placeholder="123" {...register("user_id", { valueAsNumber: true })}/>
        {errors.user_id && <p className="text-xs text-destructive">{errors.user_id.message}</p>}
      </div>
      <div>
        <label className="text-sm font-medium">Amount</label>
        <Input type="number" placeholder="50000" {...register("amount", { valueAsNumber: true })}/>
        {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
      </div>
      <div>
        <label className="text-sm font-medium">Description</label>
        <Textarea placeholder="Manual adjustment" {...register("description")} />
      </div>
      <Button type="submit" isLoading={isLoading} className="w-full">
        Issue cashback
      </Button>
    </form>
  );
}
