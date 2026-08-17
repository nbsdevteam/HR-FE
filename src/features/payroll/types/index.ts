import { Upload, Wallet } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { DbEmployee, DbMonthlyLedger, DbShift } from "@/shared/hooks";

export const payrollTabs = [
  { id: "overview", label: arabicSource("common.salaries"), icon: Wallet },
  { id: "upload", label: arabicSource("payroll.raising_attendance"), icon: Upload },
] as const;

export type PayrollTabId = (typeof payrollTabs)[number]["id"];

export interface PayrollDetailPanelProps {
  empId: string | null;
  onClose: () => void;
  payrollData: any[];
  selectedMonth: string;
  employees: DbEmployee[];
  ledgers: DbMonthlyLedger[];
  onLedgerUpdate: () => Promise<void>;
  dbShifts: DbShift[];
  dbDepartments: any[];
  dbHolidays: any[];
  holidayDates: Set<string>;
  allowanceTypes: any[];
  allEmployeeAllowances: any[];
  deductionTypes: any[];
  allEmployeeDeductions: any[];
  allLoans: any[];
  appSettings: any;
}
