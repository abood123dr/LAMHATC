import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const BRANCHES = {
  saudi: { label: "السعودية", currency: "ر.س", flag: "🇸🇦", color: "emerald" },
  turkey: { label: "تركيا", currency: "₺", flag: "🇹🇷", color: "rose" },
};

export function formatCurrency(amount, branch = "saudi") {
  const currency = BRANCHES[branch]?.currency || "ر.س";
  const value = Number(amount || 0).toLocaleString("ar-EG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${value} ${currency}`;
}

export function formatNumber(num) {
  return Number(num || 0).toLocaleString("ar-EG");
}