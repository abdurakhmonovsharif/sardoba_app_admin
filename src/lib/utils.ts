import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatCurrency = (value: number, currency = "UZS") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatNumber = (value: number, fractionDigits = 0) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: fractionDigits }).format(value);

export const formatDate = (value: string | Date, dateFormat = "dd MMM yyyy, HH:mm") => {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return format(date, dateFormat);
};
