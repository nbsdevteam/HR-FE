import { useMemo } from "react";
import { Wallet, TrendingUp, CreditCard, Coins, UserX } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { formatIQD } from "../utils/dashboardFormat";
import type { DashboardSectionData } from "./useDashboardData";

export const useDashboardFinancialData = (data: DashboardSectionData) => {
  const {
    compensationStats, medianSalary, allAllowances, totalLoanBalance,
    activeLoans, loanUtilization, exitProcesses,
  } = data;

  const financialStats = useMemo(
    () => [
      {
        label: arabicSource("common.total_compensation"),
        value: formatIQD(compensationStats.totalCompensation),
        sub: `${arabicSource("dashboard.salaries_allowances")}`,
        icon: Wallet,
        color: "text-primary",
      },
      {
        label: arabicSource("dashboard.cost_per_employee"),
        value: formatIQD(compensationStats.costPerEmployee),
        sub: `${arabicSource("common.median_salary")} ${formatIQD(medianSalary)}`,
        icon: Coins,
        color: "text-emerald-400",
      },
      {
        label: arabicSource("common.total_allowances"),
        value: formatIQD(compensationStats.totalAllowances),
        sub: `${allAllowances.length} ${arabicSource("dashboard.active_allowance")}`,
        icon: TrendingUp,
        color: "text-blue-400",
      },
      {
        label: arabicSource("dashboard.loan_balance"),
        value: formatIQD(totalLoanBalance),
        sub: `${activeLoans.length} ${arabicSource("dashboard.loan")}${loanUtilization}%)`,
        icon: CreditCard,
        color: "text-amber-400",
      },
      {
        label: arabicSource("dashboard.active_exits"),
        value: exitProcesses.filter(
          (p: any) => p.status !== "completed" && p.status !== "cancelled",
        ).length,
        sub: `${arabicSource("dashboard.end_of_service_benefits")}`,
        icon: UserX,
        color: "text-red-400",
      },
    ],
    [
      compensationStats,
      medianSalary,
      allAllowances,
      totalLoanBalance,
      activeLoans,
      loanUtilization,
      exitProcesses,
    ],
  );

  const totalLoanAmount = useMemo(
    () =>
      activeLoans.reduce((s: number, l: any) => s + (l.loan_amount || 0), 0),
    [activeLoans],
  );
  const totalPaidLoanAmount = totalLoanAmount - totalLoanBalance;

  const loanTiles = useMemo(
    () => [
      {
        value: activeLoans.length,
        label: arabicSource("common.active_loans"),
        colorClassName: "bg-blue-500/10 border border-blue-500/20",
        textColorClassName: "text-blue-400",
      },
      {
        value: formatIQD(totalLoanAmount),
        label: arabicSource("dashboard.total_loans"),
        colorClassName: "bg-primary/10 border border-primary/20",
        textColorClassName: "text-primary",
        valueTextClassName: "text-lg font-semibold",
        dir: "ltr" as const,
      },
    ],
    [activeLoans.length, totalLoanAmount],
  );

  const loanPaymentTiles = useMemo(
    () => [
      {
        value: formatIQD(totalPaidLoanAmount),
        label: arabicSource("dashboard.the_payer"),
        colorClassName: "bg-emerald-500/10 border border-emerald-500/20",
        textColorClassName: "text-emerald-400",
      },
      {
        value: formatIQD(totalLoanBalance),
        label: arabicSource("dashboard.remaining"),
        colorClassName: "bg-amber-500/10 border border-amber-500/20",
        textColorClassName: "text-amber-400",
      },
    ],
    [totalPaidLoanAmount, totalLoanBalance],
  );

  return { financialStats, totalLoanAmount, totalPaidLoanAmount, loanTiles, loanPaymentTiles };
};
