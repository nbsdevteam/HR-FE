import { useState, useMemo, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import * as odooData from "@/shared/api/odooData";
import {
  Users, CalendarDays, Wallet, ClipboardCheck, TrendingUp, TrendingDown,
  AlertTriangle, UserPlus, Clock, GraduationCap, Loader2,
  Briefcase, FileCheck, CreditCard, Bell, Shield, Award,
  Target,
  Activity, Percent, Coins, FileText, UserX,
  Zap, Heart, Building2, PieChart, Gauge, Eye,
} from "lucide-react";
import { DonutChart } from "@/shared/components/donut-chart";
import { CustomBarChart } from "@/shared/components/custom-bar-chart";
import { CustomLineChart } from "@/shared/components/custom-line-chart";
import { useChartTheme } from "@/shared/components/chart-utils";
import type { DbLeaveBalance } from "@/shared/hooks";
import {
  useEmployees, useAttendanceRecords, useMonthlyRecords,
  useLeaveRequests, useEmployeeContracts, useContractTypes,
  useEmployeeDocuments, useDocumentTypes, useLoans, useNotifications,
  useEvaluations, useWarnings, useTrainingPrograms, useTrainingParticipants,
  useExitProcesses, useJobOpenings, useApplicants, useLeaveBalances,
  useLeaveTypes, useEmployeeAllowances, useEmployeeDeductions,
  useConfigurations, empDisplayName,
} from "@/shared/hooks";
import { useAppSettings, formatMonthOnly } from "@/app/providers";
import { formatDateTime } from "@/i18n/format";
import { arabicSource } from "@/i18n/source";
import { isLeavePending, normalizeLeaveStatus } from "@/i18n/status";
import { DashboardHeader } from "../components/DashboardHeader";
import { DashboardKpiTabs } from "../components/DashboardKpiTabs";
import { DashboardOverviewSection } from "../components/DashboardOverviewSection";
import { DashboardWorkforceSection } from "../components/DashboardWorkforceSection";
import { DashboardFinancialSection } from "../components/DashboardFinancialSection";
import { DashboardComplianceSection } from "../components/DashboardComplianceSection";
import { DashboardRecruitmentSection } from "../components/DashboardRecruitmentSection";
import { DashboardLoadingState } from "../components/DashboardLoadingState";
import { DashboardMiniBar } from "../components/DashboardMiniBar";
import { DashboardRiskBadge } from "../components/DashboardRiskBadge";
import { DashboardStatGrid } from "../components/DashboardStatGrid";
import { DashboardTrendBadge } from "../components/DashboardTrendBadge";
import type { DashboardKpiSection, DashboardServerCards } from "../types";
import { dashboardCardClass, formatIQD, formatK, pct, pctDec } from "../utils/dashboardFormat";

export const Dashboard = () => {
  const { colors } = useChartTheme();
  const { settings: appSettings } = useAppSettings();
  const [kpiSection, setKpiSection] = useState<DashboardKpiSection>("overview");
  const [serverCards, setServerCards] = useState<DashboardServerCards | null>(null);

  const { employees, loading: empLoading } = useEmployees();
  const { records: attendance, loading: attLoading } = useAttendanceRecords();
  const { records: monthlyRecords, loading: mrLoading } = useMonthlyRecords();
  const loading = empLoading || attLoading || mrLoading;


  // Live data hooks
  const { requests: leaveRequests } = useLeaveRequests();
  const { contracts } = useEmployeeContracts();
  const { types: contractTypes } = useContractTypes();
  const { documents: empDocuments } = useEmployeeDocuments();
  const { types: documentTypes } = useDocumentTypes();
  const { loans } = useLoans();
  const { notifications, unreadCount } = useNotifications();
  const { evaluations } = useEvaluations();
  const { warnings } = useWarnings();
  const { programs: trainingPrograms } = useTrainingPrograms();
  const { participants: trainingParticipants } = useTrainingParticipants();
  const { processes: exitProcesses } = useExitProcesses();
  const { jobs } = useJobOpenings();
  const { applicants } = useApplicants();
  const { balances: leaveBalances } = useLeaveBalances(new Date().getFullYear());
  const { types: leaveTypes } = useLeaveTypes();
  const { allowances: allAllowances } = useEmployeeAllowances();
  const { deductions: allDeductions } = useEmployeeDeductions();
  const { getNumber: cfgNum, getValue: cfgVal } = useConfigurations();

  // ═══════ All thresholds from configurations table (NOT hard-coded) ═══════
  const cfg = useMemo(() => ({
    // Risk scoring
    riskExpiredDocsCriticalThreshold: cfgNum('risk.expired_docs_critical_threshold', 5),
    riskExpiredDocsCriticalPoints: cfgNum('risk.expired_docs_critical_points', 25),
    riskExpiredDocsHighPoints: cfgNum('risk.expired_docs_high_points', 10),
    riskExpiringDocsThreshold: cfgNum('risk.expiring_docs_threshold', 5),
    riskExpiringDocsMediumPoints: cfgNum('risk.expiring_docs_medium_points', 15),
    riskExpiringDocsLowPoints: cfgNum('risk.expiring_docs_low_points', 5),
    riskExpiringContractsPoints: cfgNum('risk.expiring_contracts_points', 15),
    riskWarningsCriticalThreshold: cfgNum('risk.warnings_critical_threshold', 10),
    riskWarningsCriticalPoints: cfgNum('risk.warnings_critical_points', 20),
    riskWarningsMediumThreshold: cfgNum('risk.warnings_medium_threshold', 3),
    riskWarningsMediumPoints: cfgNum('risk.warnings_medium_points', 10),
    riskWarningsLowPoints: cfgNum('risk.warnings_low_points', 5),
    riskEscalationPoints: cfgNum('risk.escalation_points', 15),
    riskEscalationWarningCount: cfgNum('risk.escalation_warning_count', 2),
    riskAbsenteeismHighThreshold: cfgNum('risk.absenteeism_high_threshold', 10),
    riskAbsenteeismHighPoints: cfgNum('risk.absenteeism_high_points', 15),
    riskAbsenteeismMediumThreshold: cfgNum('risk.absenteeism_medium_threshold', 5),
    riskAbsenteeismMediumPoints: cfgNum('risk.absenteeism_medium_points', 8),
    riskTurnoverCriticalThreshold: cfgNum('risk.turnover_critical_threshold', 20),
    riskTurnoverCriticalPoints: cfgNum('risk.turnover_critical_points', 20),
    riskTurnoverMediumThreshold: cfgNum('risk.turnover_medium_threshold', 10),
    riskTurnoverMediumPoints: cfgNum('risk.turnover_medium_points', 10),
    riskPendingLeavesThreshold: cfgNum('risk.pending_leaves_threshold', 10),
    riskPendingLeavesPoints: cfgNum('risk.pending_leaves_points', 5),
    riskLevelCritical: cfgNum('risk.level_critical', 60),
    riskLevelHigh: cfgNum('risk.level_high', 35),
    riskLevelMedium: cfgNum('risk.level_medium', 15),
    // KPI display thresholds
    turnoverWarning: cfgNum('kpi.turnover_warning_threshold', 15),
    trainingCompletionTarget: cfgNum('kpi.training_completion_target', 70),
    performanceGoodThreshold: cfgNum('kpi.performance_good_threshold', 3.5),
    timeToFillWarningDays: cfgNum('kpi.time_to_fill_warning_days', 30),
    docExpiryWindowDays: cfgNum('kpi.document_expiry_window_days', 30),
    contractExpiryWindowDays: cfgNum('kpi.contract_expiry_window_days', 30),
    // Warning config
    warningActiveStatus: cfgVal('warnings.active_status', arabicSource("common.is_active")),
    warningEscalationCount: cfgNum('warnings.escalation_count', 2),
    // Employee active status
    employeeActiveStatus: cfgVal('employee.active_status', arabicSource("common.is_active")),
    employeeActiveStatusEn: cfgVal('employee.active_status_en', 'active'),
  }), [cfgNum, cfgVal]);

  // ══════════════════════════════════════════════════
  // ═══════ CORE COMPUTATIONS ═══════
  // ══════════════════════════════════════════════════

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => !e.status || e.status === cfg.employeeActiveStatus || e.status === cfg.employeeActiveStatusEn).length;
  const inactiveEmployees = totalEmployees - activeEmployees;
  const totalSalaries = employees.reduce((sum, e) => sum + (e.monthly_salary || 0), 0);
  const avgSalary = totalEmployees > 0 ? Math.round(totalSalaries / totalEmployees) : 0;
  const medianSalary = useMemo(() => {
    const sorted = employees.map(e => e.monthly_salary || 0).sort((a, b) => a - b);
    if (sorted.length === 0) return 0;
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }, [employees]);

  // Department distribution
  const departmentData = useMemo(() => {
    const map: Record<string, number> = {};
    employees.forEach(e => { map[e.department || arabicSource("common.not_specified")] = (map[e.department || arabicSource("common.not_specified")] || 0) + 1; });
    return Object.entries(map).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [employees]);

  // ══════════════════════════════════════════════════
  // ═══════ ATTENDANCE — ROLLING 7-DAY & 30-DAY ═══════
  // ══════════════════════════════════════════════════

  const attendanceStats = useMemo(() => {
    const dates = [...new Set(attendance.map(a => a.date))].sort().reverse();
    const latestDate = dates[0] || "";
    const prevDate = dates[1] || "";

    const compute = (d: string) => {
      const recs = attendance.filter(a => a.date === d);
      let present = 0, late = 0, absent = 0;
      recs.forEach(r => {
        if (r.status === "complete" && r.is_late) late++;
        else if (r.status === "complete" || r.status === "missing_checkout" || r.status === "checked_in" || r.status === "missing_checkin" || r.status === "auto_checkout") present++;
        else if (r.status === "absent") absent++;
      });
      return { present, late, absent, leave: Math.max(0, totalEmployees - present - late - absent), total: recs.length };
    };

    const today = compute(latestDate);
    const prev = compute(prevDate);
    const attendanceRate = totalEmployees > 0 ? pct(today.present + today.late, totalEmployees) : 0;
    const prevAttendanceRate = totalEmployees > 0 ? pct(prev.present + prev.late, totalEmployees) : 0;
    const punctualityRate = (today.present + today.late) > 0 ? pct(today.present, today.present + today.late) : 0;

    // Rolling 7-day average
    const last7Dates = dates.slice(0, 7);
    let rolling7Present = 0, rolling7Total = 0;
    last7Dates.forEach(d => {
      const c = compute(d);
      rolling7Present += c.present + c.late;
      rolling7Total += totalEmployees;
    });
    const rolling7Rate = rolling7Total > 0 ? pct(rolling7Present, rolling7Total) : 0;

    // Rolling 30-day average
    const last30Dates = dates.slice(0, 30);
    let rolling30Present = 0, rolling30Total = 0;
    last30Dates.forEach(d => {
      const c = compute(d);
      rolling30Present += c.present + c.late;
      rolling30Total += totalEmployees;
    });
    const rolling30Rate = rolling30Total > 0 ? pct(rolling30Present, rolling30Total) : 0;

    // Absenteeism rate (different from attendance — measures lost days)
    let totalAbsences30 = 0;
    last30Dates.forEach(d => { totalAbsences30 += compute(d).absent; });
    const absenteeismRate = rolling30Total > 0 ? pctDec(totalAbsences30, rolling30Total) : 0;

    // Device coverage (latest day)
    const latestRecs = attendance.filter(a => a.date === latestDate);
    const deviceCount = latestRecs.filter((r: any) => r.source === "device").length;
    const deviceCoverage = latestRecs.length > 0 ? pct(deviceCount, latestRecs.length) : 0;

    // Prefer authoritative Odoo dashboard cards for today's headcount KPIs.
    const mergedToday = serverCards
      ? {
          ...today,
          present: Number(serverCards.present ?? today.present),
          absent: Number(serverCards.absent ?? today.absent),
          late: Number(serverCards.late ?? today.late),
          leave: Number(serverCards.on_leave ?? today.leave),
        }
      : today;
    const mergedAttendanceRate = totalEmployees > 0
      ? pct(mergedToday.present + mergedToday.late, totalEmployees)
      : attendanceRate;

    return {
      ...mergedToday, date: latestDate,
      attendanceRate: mergedAttendanceRate,
      prevAttendanceRate, punctualityRate,
      prevAbsent: prev.absent, prevLate: prev.late,
      rolling7Rate, rolling30Rate, absenteeismRate,
      attendanceTrend: mergedAttendanceRate - prevAttendanceRate,
      deviceCount, deviceCoverage,
    };
  }, [attendance, totalEmployees, serverCards]);

  // Attendance by department (last 7 days)
  const deptAttendance = useMemo(() => {
    const dates = [...new Set(attendance.map(a => a.date))].sort().reverse().slice(0, 7);
    const empDeptMap: Record<string, string> = {};
    employees.forEach(e => { empDeptMap[e.id] = e.department || arabicSource("common.not_specified"); });

    const deptStats: Record<string, { present: number; total: number }> = {};
    dates.forEach(d => {
      const recs = attendance.filter(a => a.date === d);
      recs.forEach(r => {
        const dept = empDeptMap[r.employee_id] || arabicSource("common.not_specified");
        if (!deptStats[dept]) deptStats[dept] = { present: 0, total: 0 };
        deptStats[dept].total++;
        if (r.status === "complete" || r.status === "missing_checkout") deptStats[dept].present++;
      });
    });

    return Object.entries(deptStats)
      .map(([label, s]) => ({ label, value: pct(s.present, s.total) }))
      .sort((a, b) => a.value - b.value);
  }, [attendance, employees]);

  // Attendance day-of-week pattern
  const dayOfWeekAttendance = useMemo(() => {
    const dayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday"];
    const dayLabels: Record<string, string> = {
      sunday: arabicSource("common.sunday_2"), monday: arabicSource("common.monday"), tuesday: arabicSource("common.tuesday"),
      wednesday: arabicSource("common.wednesday"), thursday: arabicSource("common.thursday"),
    };
    const dayMap: Record<string, { present: number; total: number }> = {};
    dayKeys.forEach(d => { dayMap[d] = { present: 0, total: 0 }; });

    attendance.forEach(r => {
      const day = r.day_of_week?.toLowerCase();
      if (dayMap[day]) {
        dayMap[day].total++;
        if (r.status === "complete" || r.status === "missing_checkout" || r.status === "checked_in" || r.status === "missing_checkin") dayMap[day].present++;
      }
    });

    return dayKeys.map(d => ({
      label: dayLabels[d],
      value: pct(dayMap[d].present, dayMap[d].total),
    }));
  }, [attendance]);

  const attendanceChartData = [
    { name: arabicSource("common.present"), value: attendanceStats.present, color: "#22C55E" },
    { name: arabicSource("common.late"), value: attendanceStats.late, color: "#D4AF37" },
    { name: arabicSource("common.absent"), value: attendanceStats.absent, color: "#DC2626" },
    { name: arabicSource("common.leave"), value: attendanceStats.leave, color: "#3B82F6" },
  ];

  // Monthly payroll trend
  const monthlyPayroll = useMemo(() => {
    const monthMap: Record<string, number> = {};
    monthlyRecords.forEach(r => {
      const my = r.month_year || r.salary_calculation?.monthYear;
      if (!my) return;
      monthMap[my] = (monthMap[my] || 0) + (r.salary_calculation?.netSalary || 0);
    });
    return Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b)).map(([my, total]) => {
      const parts = my.split("-");
      return { label: formatMonthOnly(parts[1], appSettings.monthFormat), value: Math.round(total / 1000) };
    });
  }, [monthlyRecords, appSettings.monthFormat]);

  // ══════════════════════════════════════════════════
  // ═══════ WORKFORCE KPIs ═══════
  // ══════════════════════════════════════════════════

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

  // ══════════════════════════════════════════════════
  // ═══════ FINANCIAL KPIs ═══════
  // ══════════════════════════════════════════════════

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

  // ══════════════════════════════════════════════════
  // ═══════ PERFORMANCE & DEVELOPMENT KPIs ═══════
  // ══════════════════════════════════════════════════

  const evalStats = useMemo(() => {
    const completed = evaluations.filter(e => e.status === arabicSource("common.complete"));
    const avgRating = completed.length > 0 ? completed.reduce((s, e) => s + e.overall_rating, 0) / completed.length : 0;
    const pending = evaluations.filter(e => e.status === arabicSource("common.did_not_start") || e.status === arabicSource("common.under_evaluation")).length;
    const high = completed.filter(e => e.overall_rating >= 4).length;
    const low = completed.filter(e => e.overall_rating <= 2).length;
    const coverageRate = totalEmployees > 0 ? pct(completed.length, totalEmployees) : 0;
    return { avgRating: Math.round(avgRating * 10) / 10, completed: completed.length, pending, high, low, coverageRate };
  }, [evaluations, totalEmployees]);

  const warningStats = useMemo(() => {
    const active = warnings.filter(w => w.status === cfg.warningActiveStatus).length;
    const byType: Record<string, number> = {};
    warnings.filter(w => w.status === cfg.warningActiveStatus).forEach(w => { byType[w.type] = (byType[w.type] || 0) + 1; });
    // Employees with multiple warnings (escalation risk — threshold from config)
    const empWarnings: Record<string, number> = {};
    warnings.filter(w => w.status === cfg.warningActiveStatus).forEach(w => { empWarnings[w.employee_id] = (empWarnings[w.employee_id] || 0) + 1; });
    const escalationRisk = Object.values(empWarnings).filter(c => c >= cfg.warningEscalationCount).length;
    return { active, byType, escalationRisk };
  }, [warnings, cfg.warningActiveStatus, cfg.warningEscalationCount]);

  const trainingStats = useMemo(() => {
    const ongoing = trainingPrograms.filter(p => p.status === arabicSource("common.my_neighbor")).length;
    const completed = trainingPrograms.filter(p => p.status === arabicSource("common.complete")).length;
    const totalParticipants = trainingParticipants.length;
    const completedParticipants = trainingParticipants.filter(p => p.completion_status === arabicSource("common.complete")).length;
    const completionRate = totalParticipants > 0 ? pct(completedParticipants, totalParticipants) : 0;
    // Training coverage: how many unique employees have participated
    const uniqueTrainees = new Set(trainingParticipants.map(p => p.employee_id)).size;
    const coverageRate = totalEmployees > 0 ? pct(uniqueTrainees, totalEmployees) : 0;
    // Avg score
    const scores = trainingParticipants.filter(p => p.score != null).map(p => p.score!);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0;
    return { ongoing, completed, totalPrograms: trainingPrograms.length, totalParticipants, completionRate, coverageRate, uniqueTrainees, avgScore };
  }, [trainingPrograms, trainingParticipants, totalEmployees]);

  // ══════════════════════════════════════════════════
  // ═══════ RECRUITMENT KPIs ═══════
  // ══════════════════════════════════════════════════

  const recruitmentStats = useMemo(() => {
    const openPositions = jobs.filter(j => j.status === arabicSource("common.is_open") || j.status === "open" || j.status === arabicSource("common.is_active")).length;
    const closedPositions = jobs.filter(j => j.status === arabicSource("common.closed") || j.status === "closed" || j.status === arabicSource("common.complete")).length;
    const totalApplicants = applicants.length;
    const avgApplicantsPerJob = jobs.length > 0 ? Math.round(totalApplicants / jobs.length) : 0;

    // Pipeline stages
    const stages: Record<string, number> = {};
    applicants.forEach(a => { stages[a.stage] = (stages[a.stage] || 0) + 1; });

    // Time to fill (avg days from job posting to hire)
    const hiredApplicants = applicants.filter(a => a.stage === arabicSource("common.assigned") || a.stage === "hired");
    const avgTimeToFill = (() => {
      if (hiredApplicants.length === 0) return 0;
      const diffs = hiredApplicants.map(a => {
        const applied = new Date(a.applied_date);
        const updated = new Date(a.updated_at);
        return Math.ceil((updated.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24));
      }).filter(d => d > 0 && d < 365);
      return diffs.length > 0 ? Math.round(diffs.reduce((s, d) => s + d, 0) / diffs.length) : 0;
    })();

    // Offer acceptance rate
    const offered = applicants.filter(a => a.stage === arabicSource("common.job_offer") || a.stage === arabicSource("common.assigned") || a.stage === "offered" || a.stage === "hired").length;
    const hired = hiredApplicants.length;
    const offerAcceptRate = offered > 0 ? pct(hired, offered) : 0;

    // Bookmarked candidates (talent pool)
    const bookmarked = applicants.filter(a => a.is_bookmarked).length;

    return {
      openPositions, closedPositions, totalApplicants, avgApplicantsPerJob,
      stages, avgTimeToFill, offerAcceptRate, hired, bookmarked,
    };
  }, [jobs, applicants]);

  // Recruitment pipeline for funnel chart
  const recruitmentPipeline = useMemo(() => {
    const stageOrder = [
      { key: arabicSource("common.introduction"), label: arabicSource("common.introduction"), color: "#3B82F6" },
      { key: arabicSource("common.sort"), label: arabicSource("common.sort"), color: "#8B5CF6" },
      { key: arabicSource("common.interview"), label: arabicSource("common.interview"), color: "#D4AF37" },
      { key: arabicSource("common.test"), label: arabicSource("common.test"), color: "#F97316" },
      { key: arabicSource("common.job_offer"), label: arabicSource("common.job_offer"), color: "#22C55E" },
      { key: arabicSource("common.assigned"), label: arabicSource("common.assigned"), color: "#10B981" },
    ];
    return stageOrder.map(s => ({
      name: s.label,
      value: recruitmentStats.stages[s.key] || 0,
      color: s.color,
    }));
  }, [recruitmentStats.stages]);

  // ══════════════════════════════════════════════════
  // ═══════ COMPOSITE RISK SCORECARD ═══════
  // ══════════════════════════════════════════════════

  // ═══════ COMPOSITE RISK SCORECARD — ALL thresholds & points from configurations table ═══════
  const riskScore = useMemo(() => {
    let score = 0;
    const items: { label: string; points: number; level: "low" | "medium" | "high" | "critical" }[] = [];

    // Expired documents
    if (expiryStats.expiredDocs > cfg.riskExpiredDocsCriticalThreshold) { score += cfg.riskExpiredDocsCriticalPoints; items.push({ label: `${expiryStats.expiredDocs} ${arabicSource("common.finished_document")}`, points: cfg.riskExpiredDocsCriticalPoints, level: "critical" }); }
    else if (expiryStats.expiredDocs > 0) { score += cfg.riskExpiredDocsHighPoints; items.push({ label: `${expiryStats.expiredDocs} ${arabicSource("common.finished_document")}`, points: cfg.riskExpiredDocsHighPoints, level: "high" }); }

    // Expiring documents
    if (expiryStats.expiringDocs > cfg.riskExpiringDocsThreshold) { score += cfg.riskExpiringDocsMediumPoints; items.push({ label: `${expiryStats.expiringDocs} ${arabicSource("common.document_nearing_completion")}`, points: cfg.riskExpiringDocsMediumPoints, level: "medium" }); }
    else if (expiryStats.expiringDocs > 0) { score += cfg.riskExpiringDocsLowPoints; items.push({ label: `${expiryStats.expiringDocs} ${arabicSource("common.document_nearing_completion")}`, points: cfg.riskExpiringDocsLowPoints, level: "low" }); }

    // Expiring contracts
    if (expiryStats.expiringContracts > 0) { score += cfg.riskExpiringContractsPoints; items.push({ label: `${expiryStats.expiringContracts} ${arabicSource("common.contract_soon_to_expire")}`, points: cfg.riskExpiringContractsPoints, level: "high" }); }

    // Active warnings
    if (warningStats.active > cfg.riskWarningsCriticalThreshold) { score += cfg.riskWarningsCriticalPoints; items.push({ label: `${warningStats.active} ${arabicSource("common.alarm_active")}`, points: cfg.riskWarningsCriticalPoints, level: "critical" }); }
    else if (warningStats.active > cfg.riskWarningsMediumThreshold) { score += cfg.riskWarningsMediumPoints; items.push({ label: `${warningStats.active} ${arabicSource("common.alarm_active")}`, points: cfg.riskWarningsMediumPoints, level: "medium" }); }
    else if (warningStats.active > 0) { score += cfg.riskWarningsLowPoints; items.push({ label: `${warningStats.active} ${arabicSource("common.alarm_active")}`, points: cfg.riskWarningsLowPoints, level: "low" }); }

    // Escalation risk
    if (warningStats.escalationRisk > 0) { score += cfg.riskEscalationPoints; items.push({ label: `${warningStats.escalationRisk} ${arabicSource("dashboard.employee_with_multiple_warnings")}`, points: cfg.riskEscalationPoints, level: "high" }); }

    // High absenteeism
    if (attendanceStats.absenteeismRate > cfg.riskAbsenteeismHighThreshold) { score += cfg.riskAbsenteeismHighPoints; items.push({ label: `${arabicSource("common.absence_2")} ${attendanceStats.absenteeismRate}%`, points: cfg.riskAbsenteeismHighPoints, level: "high" }); }
    else if (attendanceStats.absenteeismRate > cfg.riskAbsenteeismMediumThreshold) { score += cfg.riskAbsenteeismMediumPoints; items.push({ label: `${arabicSource("common.absence_2")} ${attendanceStats.absenteeismRate}%`, points: cfg.riskAbsenteeismMediumPoints, level: "medium" }); }

    // High turnover
    if (turnoverRate > cfg.riskTurnoverCriticalThreshold) { score += cfg.riskTurnoverCriticalPoints; items.push({ label: `${arabicSource("common.rotation")} ${turnoverRate}%`, points: cfg.riskTurnoverCriticalPoints, level: "critical" }); }
    else if (turnoverRate > cfg.riskTurnoverMediumThreshold) { score += cfg.riskTurnoverMediumPoints; items.push({ label: `${arabicSource("common.rotation")} ${turnoverRate}%`, points: cfg.riskTurnoverMediumPoints, level: "medium" }); }

    // Pending leaves
    if (pendingLeaves > cfg.riskPendingLeavesThreshold) { score += cfg.riskPendingLeavesPoints; items.push({ label: `${pendingLeaves} ${arabicSource("dashboard.vacation_pending")}`, points: cfg.riskPendingLeavesPoints, level: "medium" }); }

    // Risk level boundaries — from config
    const level: "low" | "medium" | "high" | "critical" =
      score >= cfg.riskLevelCritical ? "critical" :
      score >= cfg.riskLevelHigh ? "high" :
      score >= cfg.riskLevelMedium ? "medium" : "low";
    return { score: Math.min(100, score), level, items: items.sort((a, b) => b.points - a.points) };
  }, [expiryStats, warningStats, attendanceStats, turnoverRate, pendingLeaves, cfg]);

  // ══════════════════════════════════════════════════
  // ═══════ CHART DATA ═══════
  // ══════════════════════════════════════════════════

  const leaveDistribution = useMemo(() => [
    { name: arabicSource("common.pending_2"), value: pendingLeaves, color: "#F59E0B" },
    { name: arabicSource("common.agreed"), value: approvedLeaves, color: "#22C55E" },
    { name: arabicSource("common.rejected"), value: leaveRequests.filter(r => normalizeLeaveStatus(r.status) === arabicSource("common.rejected_3")).length, color: "#DC2626" },
  ], [leaveRequests, pendingLeaves, approvedLeaves]);

  const tenureDistribution = [
    { name: arabicSource("dashboard.less_than_a_year"), value: tenureStats.under1, color: "#3B82F6" },
    { name: arabicSource("dashboard.1_3_years"), value: tenureStats.y1to3, color: "#22C55E" },
    { name: arabicSource("dashboard.3_5_years"), value: tenureStats.y3to5, color: "#D4AF37" },
    { name: arabicSource("dashboard.more_than_5"), value: tenureStats.over5, color: "#8B5CF6" },
  ];

  const warningDistribution = useMemo(() => {
    return Object.entries(warningStats.byType).map(([name, value], i) => ({
      name, value, color: ["#F59E0B", "#F97316", "#EF4444", "#DC2626", "#991B1B"][i] || "#EF4444",
    }));
  }, [warningStats]);

  const cardCls = dashboardCardClass;

  const dashboardSectionData = useMemo(() => ({
    activeEmployees, inactiveEmployees, totalEmployees, attendanceStats, compensationStats, turnoverRate, newHireStats, tenureStats, approvedLeaves, cfg, riskScore,
    expiryStats, probationCount, warningStats, departmentData, colors, attendanceChartData, headcountTrend, payrollMoM, monthlyPayroll,
    pendingLeaves, activeLoans, evalStats, trainingStats, recruitmentStats, exitProcesses, notifications, unreadCount, cardCls, deptAttendance,
    tenureDistribution, dayOfWeekAttendance, leaveRequests, leaveUtilization, leaveDistribution, activeContracts, totalSalaries, avgSalary, medianSalary,
    salaryByDept, loanUtilization, totalLoanBalance, allAllowances, allDeductions, warningDistribution, evaluations, trainingPrograms, recruitmentPipeline, jobs, applicants,
  }), [
    activeEmployees, inactiveEmployees, totalEmployees, attendanceStats, compensationStats, turnoverRate, newHireStats, tenureStats, approvedLeaves, cfg, riskScore,
    expiryStats, probationCount, warningStats, departmentData, colors, attendanceChartData, headcountTrend, payrollMoM, monthlyPayroll,
    pendingLeaves, activeLoans, evalStats, trainingStats, recruitmentStats, exitProcesses, notifications, unreadCount, cardCls, deptAttendance,
    tenureDistribution, dayOfWeekAttendance, leaveRequests, leaveUtilization, leaveDistribution, activeContracts, totalSalaries, avgSalary, medianSalary,
    salaryByDept, loanUtilization, totalLoanBalance, allAllowances, allDeductions, warningDistribution, evaluations, trainingPrograms, recruitmentPipeline, jobs, applicants,
  ]);

  const handleKpiSectionChange = useCallback((section: DashboardKpiSection) => {
    setKpiSection(section);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await odooData.fetchHrDashboard();
        const cards = (data as any)?.cards || data;
        if (!cancelled && cards) setServerCards(cards);
      } catch {
        if (!cancelled) setServerCards(null);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <DashboardLoadingState />;
  }

  return (
    <div className="space-y-6">
      <DashboardHeader riskLevel={riskScore.level} unreadCount={unreadCount} />

      <DashboardKpiTabs activeSection={kpiSection} onSectionChange={handleKpiSectionChange} />

      {/* ════════════════════════════════════════════════════════════════════
           OVERVIEW SECTION
         ════════════════════════════════════════════════════════════════════ */}
      <DashboardOverviewSection data={dashboardSectionData} />

      {/* ════════════════════════════════════════════════════════════════════
           WORKFORCE SECTION
         ════════════════════════════════════════════════════════════════════ */}
      <DashboardWorkforceSection data={dashboardSectionData} />

      {/* ════════════════════════════════════════════════════════════════════
           FINANCIAL SECTION
         ════════════════════════════════════════════════════════════════════ */}
      <DashboardFinancialSection data={dashboardSectionData} />

      {/* ════════════════════════════════════════════════════════════════════
           COMPLIANCE & DEVELOPMENT SECTION
         ════════════════════════════════════════════════════════════════════ */}
      <DashboardComplianceSection data={dashboardSectionData} />

      {/* ════════════════════════════════════════════════════════════════════
           RECRUITMENT SECTION (NEW)
         ════════════════════════════════════════════════════════════════════ */}
      <DashboardRecruitmentSection data={dashboardSectionData} />
    </div>
  );
};
