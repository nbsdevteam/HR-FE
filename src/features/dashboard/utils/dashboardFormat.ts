import { formatCurrency } from "@/i18n/format";

export const formatIQD = (value: number): string =>
  formatCurrency(value, "IQD", { maximumFractionDigits: 0 });

export const formatK = (value: number): string =>
  value >= 1000 ? `${(value / 1000).toFixed(1)}K` : String(value);

export const pct = (numerator: number, denominator: number): number =>
  denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;

export const pctDec = (numerator: number, denominator: number): number =>
  denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0;
