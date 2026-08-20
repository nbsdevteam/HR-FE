import { useMemo } from "react";
import { arabicSource } from "@/i18n/source";
import { pct } from "../utils/dashboardFormat";

// ═══════ FINANCIAL KPIs ═══════
export const useDashboardFinancialStats = (
  loans: any[],
  totalEmployees: number,
  allAllowances: any[],
  allDeductions: any[],
  totalSalaries: number,
  employees: any[],
  monthlyPayroll: { label: string; value: number }[],
) => {
  const activeLoans = loans.filter(l => l.status === "active" || l.status === "disbursed");
  const totalLoanBalance = activeLoans.reduce((sum, l) => sum + (l.remaining_amount || l.loan_amount - (l.paid_installments * l.installment_amount || 0)), 0);
  const loanUtilization = totalEmployees > 0 ? pct(activeLoans.length, totalEmployees) : 0;

  // Total compensation cost (salary + allowances - deductions)
  const compensationStats = useMemo(() => {
    const totalAllowances = allAllowances.reduce((s, a) => s + (a.amount || 0), 0);
    const totalDeductions = allDeductions.reduce((s, d) => s + (d.amount || 0), 0);
    const totalCompensation = totalSalaries + totalAllowances;
    const costPerEmployee = totalEmployees > 0 ? Math.round(totalCompensation / totalEmployees) : 0;

    return { totalAllowances, totalDeductions, totalCompensation, costPerEmployee };
  }, [allAllowances, allDeductions, totalSalaries, totalEmployees]);

  // Salary distribution by department
  const salaryByDept = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    employees.forEach(e => {
      const dept = e.department || arabicSource("common.not_specified");
      if (!map[dept]) map[dept] = { total: 0, count: 0 };
      map[dept].total += e.monthly_salary || 0;
      map[dept].count++;
    });
    return Object.entries(map).map(([label, { total }]) => ({
      label, value: Math.round(total / 1000),
    })).sort((a, b) => b.value - a.value);
  }, [employees]);

  // Payroll month-over-month change
  const payrollMoM = useMemo(() => {
    if (monthlyPayroll.length < 2) return 0;
    const curr = monthlyPayroll[monthlyPayroll.length - 1].value;
    const prev = monthlyPayroll[monthlyPayroll.length - 2].value;
    return prev > 0 ? Math.round(((curr - prev) / prev) * 100) : 0;
  }, [monthlyPayroll]);

  return { activeLoans, totalLoanBalance, loanUtilization, compensationStats, salaryByDept, payrollMoM };
};
