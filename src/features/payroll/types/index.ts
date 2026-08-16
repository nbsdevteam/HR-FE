import { Upload, Wallet } from "lucide-react";
import { arabicSource } from "@/i18n/source";

export const payrollTabs = [
  { id: "overview", label: arabicSource("common.salaries"), icon: Wallet },
  { id: "upload", label: arabicSource("payroll.raising_attendance"), icon: Upload },
] as const;

export type PayrollTabId = (typeof payrollTabs)[number]["id"];
