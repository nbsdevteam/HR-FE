import { formatCurrency } from "@/features/payroll";

export const formatIQD = (value: number) => formatCurrency(value, "IQD");
