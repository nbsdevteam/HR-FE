import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, CalendarDays, Wallet, ClipboardCheck, TrendingUp, TrendingDown,
  AlertTriangle, UserPlus, Clock, GraduationCap, Loader2,
  Briefcase, FileCheck, CreditCard, Bell, Shield, Award,
  ArrowUpRight, ArrowDownRight, Minus, BarChart3, Target,
  Activity, Percent, Coins, FileText, UserX,
  Zap, Heart, Building2, PieChart, Gauge, Eye,
} from "lucide-react";
import { DonutChart } from "../components/donut-chart";
import { CustomBarChart } from "../components/custom-bar-chart";
import { CustomLineChart } from "../components/custom-line-chart";
import { useChartTheme } from "../components/chart-utils";
import type { DbLeaveBalance } from "../lib/hooks";
import {
  useEmployees, useAttendanceRecords, useMonthlyRecords,
  useLeaveRequests, useEmployeeContracts, useContractTypes,
  useEmployeeDocuments, useDocumentTypes, useLoans, useNotifications,
  useEvaluations, useWarnings, useTrainingPrograms, useTrainingParticipants,
  useExitProcesses, useJobOpenings, useApplicants, useLeaveBalances,
  useLeaveTypes, useEmployeeAllowances, useEmployeeDeductions,
  useConfigurations, empDisplayName,
} from "../lib/hooks";
import { useAppSettings, formatMonthOnly } from "../components/SettingsContext";
import { formatCurrency, formatDateTime } from "../i18n/format";
import { arabicSource } from "../i18n/source";

const formatIQD = (val: number) => formatCurrency(val, "IQD", { maximumFractionDigits: 0 });
const formatK = (val: number) => val >= 1000 ? `${(val / 1000).toFixed(1)}K` : String(val);
const pct = (n: number, d: number) => d > 0 ? Math.round((n / d) * 100) : 0;
const pctDec = (n: number, d: number) => d > 0 ? Math.round((n / d) * 1000) / 10 : 0;

// ═══════ Trend Indicator ═══════
function TrendBadge({ value, suffix = "", inverse = false }: { value: number; suffix?: string; inverse?: boolean }) {
  const isPositive = inverse ? value < 0 : value > 0;
  const isNeutral = value === 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${
      isNeutral ? "bg-muted/30 text-muted-foreground" :
      isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
    }`}>
      {isNeutral ? <Minus className="w-3 h-3" /> : isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(value)}{suffix}
    </span>
  );
}

// ═══════ Mini Progress Bar ═══════
function MiniBar({ value, max, color = "bg-primary" }: { value: number; max: number; color?: string }) {
  const w = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="w-full h-2 rounded-full bg-muted/30 overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${w}%` }} />
    </div>
  );
}

// ═══════ Risk Level Badge ═══════
function RiskBadge({ level }: { level: "low" | "medium" | "high" | "critical" }) {
  const cfg = {
    low: { label: arabicSource("dashboard.is_low"), cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
    medium: { label: arabicSource("common.average"), cls: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
    high: { label: arabicSource("dashboard.high"), cls: "bg-orange-500/10 text-orange-400 border-orange-500/30" },
    critical: { label: arabicSource("dashboard.critical"), cls: "bg-red-500/10 text-red-400 border-red-500/30" },
  }[level];
  return <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.cls}`}>{cfg.label}</span>;
}

export function Dashboard() {
  const { colors } = useChartTheme();
  const { settings: appSettings } = useAppSettings();
  const [kpiSection, setKpiSection] = useState<"overview" | "workforce" | "financial" | "compliance" | "recruitment">("overview");

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

    return {
      ...today, date: latestDate, attendanceRate, prevAttendanceRate, punctualityRate,
      prevAbsent: prev.absent, prevLate: prev.late,
      rolling7Rate, rolling30Rate, absenteeismRate,
      attendanceTrend: attendanceRate - prevAttendanceRate,
      deviceCount, deviceCoverage,
    };
  }, [attendance, totalEmployees]);

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

  const pendingLeaves = leaveRequests.filter(r => r.status === arabicSource("common.pending")).length;
  const approvedLeaves = leaveRequests.filter(r => r.status === arabicSource("common.accepted")).length;
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
    { name: arabicSource("common.rejected"), value: leaveRequests.filter(r => r.status === arabicSource("common.rejected_3")).length, color: "#DC2626" },
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

  const cardCls = "bg-card/30 backdrop-blur-md border border-border/40 rounded-xl p-6 shadow-lg";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-muted-foreground ms-3">{arabicSource("dashboard.loading_control_panel")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gradient-gold">{arabicSource("common.control_panel")}</h1>
          <p className="text-muted-foreground mt-1">{arabicSource("dashboard.kpis_live_data_from_the_database")}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Risk Score Badge */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
            riskScore.level === "critical" ? "bg-red-500/10 border-red-500/30" :
            riskScore.level === "high" ? "bg-orange-500/10 border-orange-500/30" :
            riskScore.level === "medium" ? "bg-amber-500/10 border-amber-500/30" :
            "bg-emerald-500/10 border-emerald-500/30"
          }`}>
            <Shield className={`w-4 h-4 ${
              riskScore.level === "critical" ? "text-red-400" :
              riskScore.level === "high" ? "text-orange-400" :
              riskScore.level === "medium" ? "text-amber-400" : "text-emerald-400"
            }`} />
            <span className="text-sm">{arabicSource("dashboard.risks")} <RiskBadge level={riskScore.level} /></span>
          </div>
          {unreadCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <Bell className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-sm">{unreadCount} {arabicSource("dashboard.new_notice")}</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Section Tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: "overview" as const, label: arabicSource("common.overview"), icon: BarChart3 },
          { key: "workforce" as const, label: arabicSource("dashboard.manpower"), icon: Users },
          { key: "financial" as const, label: arabicSource("common.finance"), icon: Wallet },
          { key: "compliance" as const, label: arabicSource("dashboard.compliance_and_development"), icon: Shield },
          { key: "recruitment" as const, label: arabicSource("common.recruitment"), icon: UserPlus },
        ]).map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setKpiSection(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
                kpiSection === tab.key
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-card/30 border border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/30"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
           OVERVIEW SECTION
         ════════════════════════════════════════════════════════════════════ */}
      {kpiSection === "overview" && (
        <>
          {/* Top-level KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: arabicSource("common.total_employees"), value: totalEmployees, sub: `${activeEmployees} ${arabicSource("dashboard.active")} ${inactiveEmployees} ${arabicSource("common.is_inactive")}`, icon: Users, color: "text-primary" },
              { label: arabicSource("dashboard.attendance_7_days"), value: `${attendanceStats.rolling7Rate}%`, sub: `${arabicSource("common.today")} ${attendanceStats.attendanceRate}%`, icon: ClipboardCheck, color: "text-emerald-400", trend: attendanceStats.attendanceTrend },
              { label: arabicSource("common.total_compensation"), value: formatIQD(compensationStats.totalCompensation), sub: `${arabicSource("dashboard.cost_employee")} ${formatIQD(compensationStats.costPerEmployee)}`, icon: Wallet, color: "text-blue-400" },
              { label: arabicSource("common.turnover_rate_annual"), value: `${turnoverRate}%`, sub: `${newHireStats.last30} ${arabicSource("dashboard.new_appointment_30_days")}`, icon: Activity, color: turnoverRate > cfg.turnoverWarning ? "text-red-400" : "text-emerald-400" },
              { label: arabicSource("dashboard.risk_level"), value: `${riskScore.score}/100`, sub: `${riskScore.items.length} ${arabicSource("dashboard.risk_factors")}`, icon: Shield, color: riskScore.level === "low" ? "text-emerald-400" : riskScore.level === "medium" ? "text-amber-400" : "text-red-400" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)" }}
                  className="relative bg-card backdrop-blur-sm border border-border rounded-xl p-5 shadow-lg hover:border-primary/30 transition-colors overflow-hidden"
                >
                  <div className="absolute top-0 end-0 w-28 h-28 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <p className="text-muted-foreground" style={{ fontSize: 12 }}>{stat.label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className={`text-xl font-semibold ${stat.color}`} dir="ltr">{stat.value}</p>
                        {"trend" in stat && stat.trend !== undefined && <TrendBadge value={stat.trend} suffix="%" />}
                      </div>
                      <p className="text-muted-foreground mt-1" style={{ fontSize: 11 }}>{stat.sub}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Alert Banners */}
          {(expiryStats.expiringDocs > 0 || expiryStats.expiredDocs > 0 || expiryStats.expiringContracts > 0 || probationCount > 0 || warningStats.active > 0 || warningStats.escalationRisk > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
              {expiryStats.expiredDocs > 0 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                  <FileCheck className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-xs font-medium">{expiryStats.expiredDocs} {arabicSource("common.finished_document")}</p>
                </motion.div>
              )}
              {expiryStats.expiringDocs > 0 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <FileCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <p className="text-amber-400 text-xs font-medium">{expiryStats.expiringDocs} {arabicSource("common.document_nearing_completion")}</p>
                </motion.div>
              )}
              {expiryStats.expiringContracts > 0 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                  <Briefcase className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-xs font-medium">{expiryStats.expiringContracts} {arabicSource("common.contract_soon_to_expire")}</p>
                </motion.div>
              )}
              {probationCount > 0 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
                  <Shield className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <p className="text-blue-400 text-xs font-medium">{probationCount} {arabicSource("dashboard.is_in_a_trial_period")}</p>
                </motion.div>
              )}
              {warningStats.active > 0 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/30">
                  <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <p className="text-orange-400 text-xs font-medium">{warningStats.active} {arabicSource("common.alarm_active")}</p>
                </motion.div>
              )}
              {warningStats.escalationRisk > 0 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                  <Zap className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-xs font-medium">{warningStats.escalationRisk} {arabicSource("common.risk_of_escalation")}</p>
                </motion.div>
              )}
            </div>
          )}

          {/* Charts Row 1: Department + Attendance Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={cardCls}>
              <h3 className="text-foreground mb-4">{arabicSource("dashboard.distribution_of_employees_according_to_departments")}</h3>
              <CustomBarChart data={departmentData} color={colors.primary} height={280} barLabel={arabicSource("common.number_of_employees")} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className={cardCls}>
              <h3 className="text-foreground mb-4">{arabicSource("common.attendance_status")} {attendanceStats.date ? `(${attendanceStats.date})` : arabicSource("common.today")}</h3>
              <div className="flex items-center justify-center" style={{ height: 240 }}>
                <DonutChart data={attendanceChartData} />
              </div>
              {/* Attendance sub-metrics */}
              <div className="grid grid-cols-4 gap-2 mt-4">
                <div className="text-center p-2 rounded-lg bg-muted/20">
                  <p className="text-xs text-muted-foreground">{arabicSource("dashboard.7_days")}</p>
                  <p className="text-sm font-medium text-emerald-400">{attendanceStats.rolling7Rate}%</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/20">
                  <p className="text-xs text-muted-foreground">{arabicSource("dashboard.30_days")}</p>
                  <p className="text-sm font-medium text-blue-400">{attendanceStats.rolling30Rate}%</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/20">
                  <p className="text-xs text-muted-foreground">{arabicSource("dashboard.discipline")}</p>
                  <p className="text-sm font-medium text-primary">{attendanceStats.punctualityRate}%</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/20">
                  <p className="text-xs text-muted-foreground">{arabicSource("common.fingerprint_device")}</p>
                  <p className="text-sm font-medium text-cyan-400">{attendanceStats.deviceCoverage}%</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Charts Row 2: Headcount Trend + Payroll Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className={cardCls}>
              <h3 className="text-foreground mb-4">{arabicSource("dashboard.headcount_trend_12_months")}</h3>
              <CustomLineChart data={headcountTrend} color="#3B82F6" height={250} valueLabel={arabicSource("common.number_of_employees")} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className={cardCls}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-foreground">{arabicSource("common.net_monthly_salaries_thousand_iqd")}</h3>
                {payrollMoM !== 0 && <TrendBadge value={payrollMoM} suffix="%" inverse />}
              </div>
              {monthlyPayroll.length > 0 ? (
                <CustomLineChart data={monthlyPayroll} color={colors.primary} height={250} valueLabel={arabicSource("common.amount")} />
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">{arabicSource("common.there_is_no_salary_data")}</div>
              )}
            </motion.div>
          </div>

          {/* Charts Row 3: Quick KPIs + Risk Scorecard + Notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className={cardCls}>
              <h3 className="text-foreground mb-4">{arabicSource("dashboard.quick_indicators")}</h3>
              <div className="space-y-3">
                {[
                  { label: arabicSource("dashboard.vacations_pending"), value: pendingLeaves, icon: CalendarDays, color: "text-amber-400" },
                  { label: arabicSource("common.active_loans"), value: activeLoans.length, icon: CreditCard, color: "text-blue-400" },
                  { label: arabicSource("dashboard.reviews_awaited"), value: evalStats.pending, icon: Award, color: "text-purple-400" },
                  { label: arabicSource("dashboard.training_underway"), value: trainingStats.ongoing, icon: GraduationCap, color: "text-emerald-400" },
                  { label: arabicSource("common.active_alarms"), value: warningStats.active, icon: AlertTriangle, color: "text-orange-400" },
                  { label: arabicSource("common.open_jobs"), value: recruitmentStats.openPositions, icon: UserPlus, color: "text-cyan-400" },
                  { label: arabicSource("dashboard.exits"), value: exitProcesses.filter(p => p.status !== "completed" && p.status !== "cancelled").length, icon: UserX, color: "text-red-400" },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${item.color}`} />
                        <span className="text-sm text-foreground">{item.label}</span>
                      </div>
                      <span className={`text-sm font-medium ${item.color}`}>{item.value}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Risk Scorecard */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className={cardCls}>
              <h3 className="text-foreground mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> {arabicSource("dashboard.risk_card")}
              </h3>
              <div className="text-center p-4 rounded-xl bg-muted/20 mb-4">
                <p className={`text-4xl font-bold ${
                  riskScore.level === "critical" ? "text-red-400" :
                  riskScore.level === "high" ? "text-orange-400" :
                  riskScore.level === "medium" ? "text-amber-400" : "text-emerald-400"
                }`}>{riskScore.score}</p>
                <p className="text-muted-foreground text-xs mt-1">{arabicSource("dashboard.out_of_100")}</p>
                <div className="mt-2"><RiskBadge level={riskScore.level} /></div>
              </div>
              <div className="space-y-2">
                {riskScore.items.length === 0 ? (
                  <div className="text-center py-4">
                    <Heart className="w-8 h-8 text-emerald-400/30 mx-auto mb-2" />
                    <p className="text-emerald-400 text-sm">{arabicSource("dashboard.no_risks")}</p>
                  </div>
                ) : riskScore.items.slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/10">
                    <span className="text-xs text-foreground">{item.label}</span>
                    <RiskBadge level={item.level} />
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Notifications */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className={cardCls}>
              <h3 className="text-foreground mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" /> {arabicSource("dashboard.latest_notices")}
                {unreadCount > 0 && <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs">{unreadCount}</span>}
              </h3>
              <div className="space-y-2.5">
                {notifications.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">{arabicSource("common.no_notifications")}</p>
                ) : notifications.slice(0, 6).map(n => (
                  <div key={n.id} className={`flex items-start gap-3 p-2.5 rounded-lg ${n.is_read ? "bg-muted/10" : "bg-primary/5 border border-primary/20"}`}>
                    <Bell className={`w-3.5 h-3.5 mt-0.5 ${n.type === "warning" ? "text-amber-400" : n.type === "error" ? "text-red-400" : "text-primary"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground truncate" style={{ fontSize: 12 }}>{n.title}</p>
                      <p className="text-muted-foreground" style={{ fontSize: 10 }}>{formatDateTime(n.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════
           WORKFORCE SECTION
         ════════════════════════════════════════════════════════════════════ */}
      {kpiSection === "workforce" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: arabicSource("dashboard.average_service_life"), value: `${tenureStats.avg} ${arabicSource("common.years")}`, sub: `${arabicSource("dashboard.mediator")} ${tenureStats.median} ${arabicSource("common.years")}`, icon: Clock },
              { label: arabicSource("dashboard.attendance_30_days"), value: `${attendanceStats.rolling30Rate}%`, sub: `${arabicSource("dashboard.absenteeism")} ${attendanceStats.absenteeismRate}%`, icon: ClipboardCheck },
              { label: arabicSource("dashboard.discipline_ratio"), value: `${attendanceStats.punctualityRate}%`, sub: `${attendanceStats.late} ${arabicSource("dashboard.late_today")}`, icon: Target },
              { label: arabicSource("common.active_contracts"), value: activeContracts, sub: `${probationCount} ${arabicSource("dashboard.in_the_experiment")}`, icon: Briefcase },
              { label: arabicSource("common.use_of_vacations"), value: `${leaveUtilization.rate}%`, sub: `${leaveUtilization.totalUsed} ${arabicSource("common.from")} ${leaveUtilization.totalEntitled} ${arabicSource("common.days_2")}`, icon: CalendarDays },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="relative bg-card backdrop-blur-sm border border-border rounded-xl p-5 shadow-lg overflow-hidden">
                  <div className="absolute top-0 end-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <p className="text-muted-foreground" style={{ fontSize: 12 }}>{stat.label}</p>
                      <p className="text-2xl font-semibold text-primary mt-1">{stat.value}</p>
                      <p className="text-muted-foreground mt-1" style={{ fontSize: 11 }}>{stat.sub}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20"><Icon className="w-5 h-5 text-primary" /></div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tenure Distribution */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
              <h3 className="text-foreground mb-4">{arabicSource("dashboard.distribution_of_service_period")}</h3>
              <div className="flex items-center justify-center" style={{ height: 280 }}>
                <DonutChart data={tenureDistribution} />
              </div>
            </motion.div>

            {/* Attendance by Department */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
              <h3 className="text-foreground mb-4">{arabicSource("dashboard.attendance_percentage_by_department_7_days")}</h3>
              {deptAttendance.length > 0 ? (
                <CustomBarChart data={deptAttendance} color="#22C55E" height={280} barLabel={arabicSource("common.attendance_rate")} />
              ) : (
                <div className="flex items-center justify-center h-[280px] text-muted-foreground">{arabicSource("common.no_data")}</div>
              )}
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Day of Week Pattern */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`lg:col-span-2 ${cardCls}`}>
              <h3 className="text-foreground mb-4">{arabicSource("dashboard.attendance_pattern_by_day")}</h3>
              <CustomBarChart data={dayOfWeekAttendance} color="#3B82F6" height={250} barLabel={arabicSource("common.attendance_rate")} />
            </motion.div>

            {/* Leave Summary */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
              <h3 className="text-foreground mb-4">{arabicSource("common.vacation_summary")}</h3>
              <div className="space-y-3">
                <div className="text-center p-4 rounded-lg bg-muted/20">
                  <p className="text-3xl font-semibold text-primary">{leaveRequests.length}</p>
                  <p className="text-muted-foreground text-xs mt-1">{arabicSource("dashboard.total_orders")}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 rounded-lg bg-amber-500/10"><p className="text-amber-400 font-medium">{pendingLeaves}</p><p className="text-muted-foreground text-xs">{arabicSource("common.pending_2")}</p></div>
                  <div className="text-center p-2 rounded-lg bg-emerald-500/10"><p className="text-emerald-400 font-medium">{approvedLeaves}</p><p className="text-muted-foreground text-xs">{arabicSource("dashboard.accepted")}</p></div>
                  <div className="text-center p-2 rounded-lg bg-red-500/10"><p className="text-red-400 font-medium">{leaveRequests.filter(r => r.status === arabicSource("common.rejected_3")).length}</p><p className="text-muted-foreground text-xs">{arabicSource("common.rejected")}</p></div>
                </div>
                <div className="p-3 rounded-lg bg-muted/20">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">{arabicSource("common.use_of_vacations")}</span>
                    <span className="text-primary font-medium">{leaveUtilization.rate}%</span>
                  </div>
                  <MiniBar value={leaveUtilization.rate} max={100} color="bg-primary" />
                  <p className="text-muted-foreground text-xs mt-1">{arabicSource("common.average")} {leaveUtilization.avgUsed} {arabicSource("dashboard.day_employee")}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* New Hires + Turnover Summary */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
            <h3 className="text-foreground mb-4">{arabicSource("dashboard.appointments_and_job_turnover")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="text-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-2xl font-semibold text-emerald-400">{newHireStats.last30}</p>
                <p className="text-muted-foreground text-xs mt-1">{arabicSource("dashboard.set_30_days")}</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <p className="text-2xl font-semibold text-blue-400">{newHireStats.last90}</p>
                <p className="text-muted-foreground text-xs mt-1">{arabicSource("common.set_90_days")}</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-2xl font-semibold text-primary">{newHireStats.rate}%</p>
                <p className="text-muted-foreground text-xs mt-1">{arabicSource("dashboard.assignment_rate")}</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-2xl font-semibold text-amber-400">{turnoverRate}%</p>
                <p className="text-muted-foreground text-xs mt-1">{arabicSource("common.turnover_rate_annual")}</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <p className="text-2xl font-semibold text-purple-400">{exitProcesses.filter(p => p.status !== "completed" && p.status !== "cancelled").length}</p>
                <p className="text-muted-foreground text-xs mt-1">{arabicSource("dashboard.exits_in_progress")}</p>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════
           FINANCIAL SECTION
         ════════════════════════════════════════════════════════════════════ */}
      {kpiSection === "financial" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: arabicSource("common.total_compensation"), value: formatIQD(compensationStats.totalCompensation), sub: `${arabicSource("dashboard.salaries_allowances")}`, icon: Wallet, color: "text-primary" },
              { label: arabicSource("dashboard.cost_per_employee"), value: formatIQD(compensationStats.costPerEmployee), sub: `${arabicSource("common.median_salary")} ${formatIQD(medianSalary)}`, icon: Coins, color: "text-emerald-400" },
              { label: arabicSource("common.total_allowances"), value: formatIQD(compensationStats.totalAllowances), sub: `${allAllowances.length} ${arabicSource("dashboard.active_allowance")}`, icon: TrendingUp, color: "text-blue-400" },
              { label: arabicSource("dashboard.loan_balance"), value: formatIQD(totalLoanBalance), sub: `${activeLoans.length} ${arabicSource("dashboard.loan")}${loanUtilization}%)`, icon: CreditCard, color: "text-amber-400" },
              { label: arabicSource("dashboard.active_exits"), value: exitProcesses.filter(p => p.status !== "completed" && p.status !== "cancelled").length, sub: `${arabicSource("dashboard.end_of_service_benefits")}`, icon: UserX, color: "text-red-400" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="relative bg-card backdrop-blur-sm border border-border rounded-xl p-5 shadow-lg overflow-hidden">
                  <div className="absolute top-0 end-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <p className="text-muted-foreground" style={{ fontSize: 12 }}>{stat.label}</p>
                      <p className={`text-lg font-semibold mt-1 ${stat.color}`} dir="ltr">{stat.value}</p>
                      <p className="text-muted-foreground mt-1" style={{ fontSize: 11 }}>{stat.sub}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20"><Icon className="w-5 h-5 text-primary" /></div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-foreground">{arabicSource("common.net_monthly_salaries_thousand_iqd")}</h3>
                {payrollMoM !== 0 && <TrendBadge value={payrollMoM} suffix={arabicSource("dashboard.monthly")} inverse />}
              </div>
              {monthlyPayroll.length > 0 ? (
                <CustomLineChart data={monthlyPayroll} color={colors.primary} height={280} valueLabel={arabicSource("common.amount")} />
              ) : (
                <div className="flex items-center justify-center h-[280px] text-muted-foreground">{arabicSource("common.there_is_no_salary_data")}</div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
              <h3 className="text-foreground mb-4">{arabicSource("dashboard.cost_of_salaries_by_department_thousand_iqd")}</h3>
              {salaryByDept.length > 0 ? (
                <CustomBarChart data={salaryByDept} color="#22C55E" height={280} barLabel={arabicSource("dashboard.cost")} />
              ) : (
                <div className="flex items-center justify-center h-[280px] text-muted-foreground">{arabicSource("common.no_data")}</div>
              )}
            </motion.div>
          </div>

          {/* Compensation Breakdown + Loan Portfolio */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compensation breakdown */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
              <h3 className="text-foreground mb-4">{arabicSource("dashboard.compensation_analysis")}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <span className="text-sm text-muted-foreground">{arabicSource("common.total_basic_salaries")}</span>
                  <span className="text-sm font-medium text-primary" dir="ltr">{formatIQD(totalSalaries)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <span className="text-sm text-muted-foreground">{arabicSource("common.total_allowances")}</span>
                  <span className="text-sm font-medium text-emerald-400" dir="ltr">{formatIQD(compensationStats.totalAllowances)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <span className="text-sm text-muted-foreground">{arabicSource("common.total_deductions")}</span>
                  <span className="text-sm font-medium text-red-400" dir="ltr">{formatIQD(compensationStats.totalDeductions)}</span>
                </div>
                <div className="border-t border-border/40 pt-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <span className="text-sm font-medium text-foreground">{arabicSource("dashboard.net_compensation")}</span>
                    <span className="text-sm font-bold text-primary" dir="ltr">{formatIQD(compensationStats.totalCompensation - compensationStats.totalDeductions)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="p-3 rounded-lg bg-muted/20 text-center">
                    <p className="text-xs text-muted-foreground">{arabicSource("dashboard.average_salary")}</p>
                    <p className="text-sm font-medium text-primary" dir="ltr">{formatIQD(avgSalary)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/20 text-center">
                    <p className="text-xs text-muted-foreground">{arabicSource("common.median_salary")}</p>
                    <p className="text-sm font-medium text-blue-400" dir="ltr">{formatIQD(medianSalary)}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Loan Portfolio */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
              <h3 className="text-foreground mb-4">{arabicSource("dashboard.loan_portfolio")}</h3>
              {activeLoans.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">{arabicSource("dashboard.there_are_no_active_loans")}</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <p className="text-2xl font-semibold text-blue-400">{activeLoans.length}</p>
                      <p className="text-muted-foreground text-xs mt-1">{arabicSource("common.active_loans")}</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-primary/10 border border-primary/20">
                      <p className="text-lg font-semibold text-primary" dir="ltr">{formatIQD(activeLoans.reduce((s, l) => s + (l.loan_amount || 0), 0))}</p>
                      <p className="text-muted-foreground text-xs mt-1">{arabicSource("dashboard.total_loans")}</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/20">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">{arabicSource("dashboard.payment_ratio")}</span>
                      <span className="text-emerald-400 font-medium">{pct(activeLoans.reduce((s, l) => s + (l.loan_amount || 0), 0) - totalLoanBalance, activeLoans.reduce((s, l) => s + (l.loan_amount || 0), 0))}%</span>
                    </div>
                    <MiniBar value={activeLoans.reduce((s, l) => s + (l.loan_amount || 0), 0) - totalLoanBalance} max={activeLoans.reduce((s, l) => s + (l.loan_amount || 0), 0)} color="bg-emerald-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-lg font-semibold text-emerald-400" dir="ltr">{formatIQD(activeLoans.reduce((s, l) => s + (l.loan_amount || 0), 0) - totalLoanBalance)}</p>
                      <p className="text-muted-foreground text-xs mt-1">{arabicSource("dashboard.the_payer")}</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <p className="text-lg font-semibold text-amber-400" dir="ltr">{formatIQD(totalLoanBalance)}</p>
                      <p className="text-muted-foreground text-xs mt-1">{arabicSource("dashboard.remaining")}</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/20">
                    <p className="text-xs text-muted-foreground">{arabicSource("dashboard.percentage_of_employees_who_borrow")}</p>
                    <p className="text-sm font-medium text-blue-400">{loanUtilization}{arabicSource("dashboard.of_total_employees")}</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════
           COMPLIANCE & DEVELOPMENT SECTION
         ════════════════════════════════════════════════════════════════════ */}
      {kpiSection === "compliance" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: arabicSource("dashboard.average_performance_rating"), value: `${evalStats.avgRating}/5`, sub: `${arabicSource("common.cover")} ${evalStats.coverageRate}${arabicSource("common.of_employees")}`, icon: Award, color: evalStats.avgRating >= cfg.performanceGoodThreshold ? "text-emerald-400" : "text-amber-400" },
              { label: arabicSource("common.active_alarms"), value: warningStats.active, sub: `${warningStats.escalationRisk} ${arabicSource("common.risk_of_escalation")}`, icon: AlertTriangle, color: warningStats.active > 0 ? "text-orange-400" : "text-emerald-400" },
              { label: arabicSource("dashboard.completion_of_training"), value: `${trainingStats.completionRate}%`, sub: `${arabicSource("common.cover")} ${trainingStats.coverageRate}${arabicSource("common.of_employees")}`, icon: GraduationCap, color: trainingStats.completionRate >= cfg.trainingCompletionTarget ? "text-emerald-400" : "text-amber-400" },
              { label: arabicSource("dashboard.expired_nearly_documents"), value: expiryStats.expiredDocs + expiryStats.expiringDocs, sub: `${expiryStats.expiredDocs} ${arabicSource("dashboard.finished")} ${expiryStats.expiringDocs} ${arabicSource("dashboard.close")}`, icon: FileCheck, color: expiryStats.expiredDocs > 0 ? "text-red-400" : "text-amber-400" },
              { label: arabicSource("dashboard.high_performance_rate"), value: `${pct(evalStats.high, evalStats.completed)}%`, sub: `${evalStats.high} ${arabicSource("common.from")} ${evalStats.completed} ${arabicSource("dashboard.evaluator")}`, icon: Zap, color: "text-purple-400" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="relative bg-card backdrop-blur-sm border border-border rounded-xl p-5 shadow-lg overflow-hidden">
                  <div className="absolute top-0 end-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <p className="text-muted-foreground" style={{ fontSize: 12 }}>{stat.label}</p>
                      <p className={`text-2xl font-semibold mt-1 ${stat.color}`}>{stat.value}</p>
                      <p className="text-muted-foreground mt-1" style={{ fontSize: 11 }}>{stat.sub}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20"><Icon className="w-5 h-5 text-primary" /></div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Distribution */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
              <h3 className="text-foreground mb-4">{arabicSource("dashboard.performance_evaluation_distribution")}</h3>
              {evalStats.completed > 0 ? (
                <div className="space-y-4">
                  {[
                    { label: arabicSource("dashboard.featured_5"), count: evaluations.filter(e => e.status === arabicSource("common.complete") && e.overall_rating === 5).length, color: "bg-emerald-500" },
                    { label: arabicSource("dashboard.exceeding_expectations_4"), count: evaluations.filter(e => e.status === arabicSource("common.complete") && e.overall_rating === 4).length, color: "bg-blue-500" },
                    { label: arabicSource("dashboard.within_expected_3"), count: evaluations.filter(e => e.status === arabicSource("common.complete") && e.overall_rating === 3).length, color: "bg-primary" },
                    { label: arabicSource("dashboard.below_expectations_2"), count: evaluations.filter(e => e.status === arabicSource("common.complete") && e.overall_rating === 2).length, color: "bg-amber-500" },
                    { label: arabicSource("dashboard.not_achieved_1"), count: evaluations.filter(e => e.status === arabicSource("common.complete") && e.overall_rating === 1).length, color: "bg-red-500" },
                  ].map(level => (
                    <div key={level.label} className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-32 flex-shrink-0">{level.label}</span>
                      <div className="flex-1 h-6 rounded-full bg-muted/20 overflow-hidden">
                        <div className={`h-full ${level.color} rounded-full transition-all`} style={{ width: `${pct(level.count, evalStats.completed)}%` }} />
                      </div>
                      <span className="text-sm text-foreground w-8 text-center">{level.count}</span>
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10">
                      <span className="text-sm text-muted-foreground">{arabicSource("dashboard.high_performance_4")}</span>
                      <span className="text-sm font-medium text-emerald-400">{pct(evalStats.high, evalStats.completed)}%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                      <span className="text-sm text-muted-foreground">{arabicSource("dashboard.needs_development_2")}</span>
                      <span className="text-sm font-medium text-red-400">{pct(evalStats.low, evalStats.completed)}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-muted-foreground">{arabicSource("dashboard.there_are_no_completed_reviews")}</div>
              )}
            </motion.div>

            {/* Warning Distribution */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
              <h3 className="text-foreground mb-4">{arabicSource("dashboard.alarms_by_type")}</h3>
              {warningDistribution.length > 0 ? (
                <>
                  <div className="flex items-center justify-center" style={{ height: 220 }}>
                    <DonutChart data={warningDistribution} />
                  </div>
                  {warningStats.escalationRisk > 0 && (
                    <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 text-sm">{warningStats.escalationRisk} {arabicSource("dashboard.employee_with_multiple_alarms_escalation_risk")}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-[280px]">
                  <Shield className="w-12 h-12 text-emerald-400/30 mb-3" />
                  <p className="text-emerald-400 text-sm">{arabicSource("dashboard.no_active_alarms")}</p>
                  <p className="text-muted-foreground text-xs mt-1">{arabicSource("dashboard.excellent_work_environment")}</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Training Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
            <h3 className="text-foreground mb-4">{arabicSource("dashboard.summary_of_training_and_development")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="text-center p-4 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-2xl font-semibold text-primary">{trainingStats.totalPrograms}</p>
                <p className="text-muted-foreground text-xs mt-1">{arabicSource("common.total_programs")}</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <p className="text-2xl font-semibold text-blue-400">{trainingStats.ongoing}</p>
                <p className="text-muted-foreground text-xs mt-1">{arabicSource("dashboard.now_underway")}</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-2xl font-semibold text-emerald-400">{trainingStats.completed}</p>
                <p className="text-muted-foreground text-xs mt-1">{arabicSource("common.complete_2")}</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-2xl font-semibold text-amber-400">{trainingStats.uniqueTrainees}</p>
                <p className="text-muted-foreground text-xs mt-1">{arabicSource("dashboard.unique_trainee")}</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <p className="text-2xl font-semibold text-purple-400">{trainingStats.completionRate}%</p>
                <p className="text-muted-foreground text-xs mt-1">{arabicSource("dashboard.completion_rate")}</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <p className="text-2xl font-semibold text-cyan-400">{trainingStats.avgScore || "—"}</p>
                <p className="text-muted-foreground text-xs mt-1">{arabicSource("dashboard.average_score")}</p>
              </div>
            </div>
            {/* Coverage bar */}
            <div className="mt-4 p-3 rounded-lg bg-muted/20">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">{arabicSource("dashboard.training_coverage_percentage_of_employees_participating")}</span>
                <span className="text-primary font-medium">{trainingStats.coverageRate}%</span>
              </div>
              <MiniBar value={trainingStats.coverageRate} max={100} color={trainingStats.coverageRate >= cfg.trainingCompletionTarget ? "bg-emerald-500" : "bg-amber-500"} />
            </div>
          </motion.div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════
           RECRUITMENT SECTION (NEW)
         ════════════════════════════════════════════════════════════════════ */}
      {kpiSection === "recruitment" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: arabicSource("common.open_jobs"), value: recruitmentStats.openPositions, sub: `${jobs.length} ${arabicSource("dashboard.total")}`, icon: Briefcase, color: "text-primary" },
              { label: arabicSource("common.total_applicants"), value: recruitmentStats.totalApplicants, sub: `${recruitmentStats.avgApplicantsPerJob} ${arabicSource("dashboard.average_function")}`, icon: Users, color: "text-blue-400" },
              { label: arabicSource("dashboard.average_time_to_hire"), value: `${recruitmentStats.avgTimeToFill} ${arabicSource("common.days_2")}`, sub: arabicSource("dashboard.from_applying_for_appointment"), icon: Clock, color: recruitmentStats.avgTimeToFill > cfg.timeToFillWarningDays ? "text-amber-400" : "text-emerald-400" },
              { label: arabicSource("dashboard.offer_acceptance_rate"), value: `${recruitmentStats.offerAcceptRate}%`, sub: `${recruitmentStats.hired} ${arabicSource("dashboard.were_appointed")}`, icon: Target, color: "text-emerald-400" },
              { label: arabicSource("dashboard.talent_bank"), value: recruitmentStats.bookmarked, sub: arabicSource("dashboard.saved_filter"), icon: Heart, color: "text-purple-400" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="relative bg-card backdrop-blur-sm border border-border rounded-xl p-5 shadow-lg overflow-hidden">
                  <div className="absolute top-0 end-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <p className="text-muted-foreground" style={{ fontSize: 12 }}>{stat.label}</p>
                      <p className={`text-2xl font-semibold mt-1 ${stat.color}`}>{stat.value}</p>
                      <p className="text-muted-foreground mt-1" style={{ fontSize: 11 }}>{stat.sub}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20"><Icon className="w-5 h-5 text-primary" /></div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recruitment Funnel */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
              <h3 className="text-foreground mb-4">{arabicSource("dashboard.recruitment_suppression")}</h3>
              {recruitmentPipeline.some(s => s.value > 0) ? (
                <div className="space-y-3">
                  {recruitmentPipeline.map((stage, i) => {
                    const maxVal = Math.max(...recruitmentPipeline.map(s => s.value), 1);
                    const width = Math.max(8, Math.round((stage.value / maxVal) * 100));
                    return (
                      <div key={stage.name} className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-24 flex-shrink-0">{stage.name}</span>
                        <div className="flex-1 relative">
                          <div className="h-8 rounded-lg bg-muted/20 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${width}%` }}
                              transition={{ delay: i * 0.1, duration: 0.5 }}
                              className="h-full rounded-lg flex items-center justify-end pe-2"
                              style={{ backgroundColor: stage.color + "30", borderLeft: `3px solid ${stage.color}` }}
                            >
                              <span className="text-xs font-medium text-foreground">{stage.value}</span>
                            </motion.div>
                          </div>
                        </div>
                        {i < recruitmentPipeline.length - 1 && recruitmentPipeline[i].value > 0 && (
                          <span className="text-xs text-muted-foreground w-12 text-center">
                            {pct(recruitmentPipeline[i + 1].value, recruitmentPipeline[i].value)}%
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {/* Conversion summary */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 mt-4">
                    <span className="text-sm text-muted-foreground">{arabicSource("dashboard.overall_conversion_rate")}</span>
                    <span className="text-sm font-medium text-emerald-400">
                      {recruitmentPipeline[0].value > 0 ? pct(recruitmentPipeline[recruitmentPipeline.length - 1].value, recruitmentPipeline[0].value) : 0}%
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-muted-foreground">{arabicSource("dashboard.no_employment_data")}</div>
              )}
            </motion.div>

            {/* Hiring vs Turnover Comparison */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
              <h3 className="text-foreground mb-4">{arabicSource("dashboard.hire_vs_exit")}</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <UserPlus className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-emerald-400">{newHireStats.last90}</p>
                    <p className="text-muted-foreground text-xs mt-1">{arabicSource("common.set_90_days")}</p>
                  </div>
                  <div className="text-center p-5 rounded-xl bg-red-500/10 border border-red-500/20">
                    <UserX className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-red-400">
                      {exitProcesses.filter(p => p.status === "completed").length}
                    </p>
                    <p className="text-muted-foreground text-xs mt-1">{arabicSource("dashboard.exit_total")}</p>
                  </div>
                </div>

                {/* Net growth */}
                <div className="p-4 rounded-xl bg-muted/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{arabicSource("dashboard.net_growth")}</span>
                    <span className={`text-lg font-bold ${
                      newHireStats.last90 - exitProcesses.filter(p => p.status === "completed").length >= 0
                        ? "text-emerald-400" : "text-red-400"
                    }`}>
                      {newHireStats.last90 - exitProcesses.filter(p => p.status === "completed").length >= 0 ? "+" : ""}
                      {newHireStats.last90 - exitProcesses.filter(p => p.status === "completed").length}
                    </span>
                  </div>
                </div>

                {/* Headcount Trend */}
                <div>
                  <h4 className="text-sm text-muted-foreground mb-3">{arabicSource("dashboard.headcount_trend")}</h4>
                  <CustomLineChart data={headcountTrend} color="#3B82F6" height={150} valueLabel={arabicSource("dashboard.number")} />
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
