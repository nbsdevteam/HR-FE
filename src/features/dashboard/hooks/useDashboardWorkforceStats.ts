import { useMemo } from "react";
import { arabicSource } from "@/i18n/source";
import { isLeavePending, normalizeLeaveStatus } from "@/i18n/status";
import { formatMonthOnly } from "@/app/providers";
import { pct, pctDec } from "../utils/dashboardFormat";
import type { DashboardRiskConfig } from "./useDashboardRiskConfig";

// ═══════ WORKFORCE KPIs ═══════
export const useDashboardWorkforceStats = (
  leaveRequests: any[],
  contracts: any[],
  employees: any[],
  totalEmployees: number,
  exitProcesses: any[],
  leaveBalances: any[],
  appSettings: any,
  empDocuments: any[],
  cfg: DashboardRiskConfig,
) => {
  const pendingLeaves = leaveRequests.filter(r => isLeavePending(r.status)).length;
  const approvedLeaves = leaveRequests.filter(
    r => normalizeLeaveStatus(r.status) === arabicSource("common.accepted"),
  ).length;
  const activeContracts = contracts.filter(c => c.status === "active").length;
  const probationCount = contracts.filter(c => c.probation_status === "in_progress").length;

  // Tenure analysis
  const tenureStats = useMemo(() => {
    const now = new Date();
    const tenures = employees.filter(e => e.join_date).map(e => {
      const join = new Date(e.join_date!);
      return (now.getTime() - join.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    });
    if (tenures.length === 0) return { avg: 0, median: 0, under1: 0, y1to3: 0, y3to5: 0, over5: 0 };
    const avg = tenures.reduce((s, t) => s + t, 0) / tenures.length;
    const sorted = [...tenures].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    return {
      avg: Math.round(avg * 10) / 10,
      median: Math.round(median * 10) / 10,
      under1: tenures.filter(t => t < 1).length,
      y1to3: tenures.filter(t => t >= 1 && t < 3).length,
      y3to5: tenures.filter(t => t >= 3 && t < 5).length,
      over5: tenures.filter(t => t >= 5).length,
    };
  }, [employees]);

  // Annualized turnover rate (exits in last 12 months / average headcount * 100)
  const turnoverRate = useMemo(() => {
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const recentExits = exitProcesses.filter(p => {
      if (p.status !== "completed") return false;
      const exitDate = new Date(p.exit_date);
      return exitDate >= oneYearAgo;
    }).length;
    return totalEmployees > 0 ? pctDec(recentExits, totalEmployees) : 0;
  }, [exitProcesses, totalEmployees]);

  // New hire rate (joined in last 90 days)
  const newHireStats = useMemo(() => {
    const now = new Date();
    const d90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const newHires90 = employees.filter(e => e.join_date && new Date(e.join_date) >= d90).length;
    const newHires30 = employees.filter(e => e.join_date && new Date(e.join_date) >= d30).length;
    return { last90: newHires90, last30: newHires30, rate: pct(newHires90, totalEmployees) };
  }, [employees, totalEmployees]);

  // Leave utilization rate
  const leaveUtilization = useMemo(() => {
    if (leaveBalances.length === 0) return { rate: 0, totalEntitled: 0, totalUsed: 0, avgUsed: 0 };
    const totalEntitled = leaveBalances.reduce((s, b) => s + b.total_days + b.carryover_days + b.accrued_days, 0);
    const totalUsed = leaveBalances.reduce((s, b) => s + b.used_days, 0);
    const uniqueEmployees = new Set(leaveBalances.map(b => b.employee_id)).size;
    return {
      rate: pct(totalUsed, totalEntitled),
      totalEntitled,
      totalUsed,
      avgUsed: uniqueEmployees > 0 ? Math.round((totalUsed / uniqueEmployees) * 10) / 10 : 0,
    };
  }, [leaveBalances]);

  // Headcount trend (by join_date month)
  const headcountTrend = useMemo(() => {
    const monthMap: Record<string, number> = {};
    const sorted = employees.filter(e => e.join_date).sort((a, b) => a.join_date!.localeCompare(b.join_date!));
    let cumulative = 0;
    sorted.forEach(e => {
      const my = e.join_date!.substring(0, 7); // YYYY-MM
      cumulative++;
      monthMap[my] = cumulative;
    });
    // Fill in last 12 months
    const months: { label: string; value: number }[] = [];
    const now = new Date();
    let runningTotal = 0;
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const my = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthMap[my] !== undefined) runningTotal = monthMap[my];
      const parts = my.split("-");
      months.push({ label: formatMonthOnly(parts[1], appSettings.monthFormat), value: runningTotal || 0 });
    }
    // If no join dates, just show current total for all months
    if (runningTotal === 0 && totalEmployees > 0) {
      months.forEach(m => { m.value = totalEmployees; });
    }
    return months;
  }, [employees, totalEmployees, appSettings.monthFormat]);

  // Expiring documents & contracts
  const expiryStats = useMemo(() => {
    const now = new Date();
    const daysLeft = (d: string) => Math.ceil((new Date(d).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const expiringDocs = empDocuments.filter(d => d.expiry_date && daysLeft(d.expiry_date) >= 0 && daysLeft(d.expiry_date) <= cfg.docExpiryWindowDays).length;
    const expiredDocs = empDocuments.filter(d => d.expiry_date && daysLeft(d.expiry_date) < 0).length;
    const expiringContracts = contracts.filter(c => c.end_date && c.status === "active" && daysLeft(c.end_date) >= 0 && daysLeft(c.end_date) <= cfg.contractExpiryWindowDays).length;
    const expiredContracts = contracts.filter(c => c.end_date && c.status === "active" && daysLeft(c.end_date) < 0).length;

    return { expiringDocs, expiredDocs, expiringContracts, expiredContracts };
  }, [empDocuments, contracts, cfg.docExpiryWindowDays, cfg.contractExpiryWindowDays]);

  return { pendingLeaves, approvedLeaves, activeContracts, probationCount, tenureStats, turnoverRate, newHireStats, leaveUtilization, headcountTrend, expiryStats };
};
