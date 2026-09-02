import { Upload, Wallet } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { AppSettings } from "@/app/providers";
import type { PayrollMetadataResponse } from "@/shared/api/payrollTypes";

export const payrollTabs = [
  { id: "overview", label: arabicSource("common.salaries"), icon: Wallet },
  { id: "upload", label: arabicSource("payroll.raising_attendance"), icon: Upload },
] as const;

export type PayrollTabId = (typeof payrollTabs)[number]["id"];

export interface PayrollDetailPanelProps {
  empId: string | null;
  onClose: () => void;
  selectedMonth: string;
  metadata: PayrollMetadataResponse | null;
  onLedgerUpdate: () => void;
  appSettings: AppSettings;
}

export interface PayrollHeaderProps {
  availableMonths: string[];
  displayMonth: (month: string) => string;
  payrollCount: number;
  payslipsSaved: boolean;
  savingPayslips: boolean;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onGeneratePayslips: () => void;
}
