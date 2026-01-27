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

export const formatDate = (
  value: string | Date | number | null | undefined,
  dateFormat = "dd MMM yyyy, HH:mm",
) => {
  if (value === null || value === undefined || value === "") return "—";

  let date: Date;

  if (typeof value === "string") {
    // Try native Date parse first (ISO strings)
    const iso = new Date(value);
    if (!isNaN(iso.getTime())) {
      date = iso;
    } else {
      // Support common non-ISO formats like 'DD.MM.YYYY' or 'D.M.YYYY' optionally with time
      const m = value.trim().match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
      if (m) {
        const day = Number(m[1]);
        const month = Number(m[2]) - 1;
        const year = Number(m[3]);
        const hours = m[4] ? Number(m[4]) : 0;
        const minutes = m[5] ? Number(m[5]) : 0;
        const seconds = m[6] ? Number(m[6]) : 0;
        date = new Date(year, month, day, hours, minutes, seconds);
      } else {
        // Try numeric timestamp string
        const n = Number(value);
        if (!Number.isNaN(n)) {
          date = new Date(n);
        } else {
          return "—";
        }
      }
    }
  } else if (typeof value === "number") {
    date = new Date(value);
  } else {
    date = value;
  }

  if (!date || isNaN(date.getTime())) return "—";
  return format(date, dateFormat);
};
export function formatUZS(amount: number): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}