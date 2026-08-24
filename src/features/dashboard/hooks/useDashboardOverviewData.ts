import { useMemo } from "react";
import {
  Users,
  CalendarDays,
  Wallet,
  ClipboardCheck,
  AlertTriangle,
  UserPlus,
  GraduationCap,
  Briefcase,
  FileCheck,
  CreditCard,
  Shield,
  Award,
  Activity,
  UserX,
  Zap,
} from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { ROUTE_SEGMENT } from "@/app/router/routePaths";
import { formatIQD } from "../utils/dashboardFormat";
import type { DashboardSectionData } from "./useDashboardData";

export const useDashboardOverviewData = (data: DashboardSectionData) => {
  const {
    activeEmployees,
    inactiveEmployees,
    totalEmployees,
    attendanceStats,
    compensationStats,
    turnoverRate,
    newHireStats,
    cfg,
    riskScore,
    expiryStats,
    probationCount,
    warningStats,
    pendingLeaves,
    activeLoans,
    evalStats,
    trainingStats,
    recruitmentStats,
    exitProcesses,
    notifications,
  } = data;

  const quickIndicators = useMemo(
    () => [
      {
        label: arabicSource("dashboard.vacations_pending"),
        value: pendingLeaves,
        icon: CalendarDays,
        color: "text-amber-400",
      },
      {
        label: arabicSource("common.active_loans"),
        value: activeLoans.length,
        icon: CreditCard,
        color: "text-blue-400",
      },
      {
        label: arabicSource("dashboard.reviews_awaited"),
        value: evalStats.pending,
        icon: Award,
        color: "text-purple-400",
      },
      {
        label: arabicSource("dashboard.training_underway"),
        value: trainingStats.ongoing,
        icon: GraduationCap,
        color: "text-emerald-400",
      },
      {
        label: arabicSource("common.active_alarms"),
        value: warningStats.active,
        icon: AlertTriangle,
        color: "text-orange-400",
      },
      {
        label: arabicSource("common.open_jobs"),
        value: recruitmentStats.openPositions,
        icon: UserPlus,
        color: "text-cyan-400",
      },
      {
        label: arabicSource("dashboard.exits"),
        value: exitProcesses.filter(
          (p: any) => p.status !== "completed" && p.status !== "cancelled",
        ).length,
        icon: UserX,
        color: "text-red-400",
      },
    ],
    [
      pendingLeaves,
      activeLoans,
      evalStats,
      trainingStats,
      warningStats,
      recruitmentStats,
      exitProcesses,
    ],
  );

  const dashboardStatsData = useMemo(
    () => [
      {
        label: arabicSource("common.total_employees"),
        value: totalEmployees,
        sub: `${activeEmployees} ${arabicSource("dashboard.active")} ${inactiveEmployees} ${arabicSource("common.is_inactive")}`,
        icon: Users,
        color: "text-primary",
        href: `/${ROUTE_SEGMENT.employees}`,
      },
      {
        label: arabicSource("dashboard.attendance_7_days"),
        value: `${attendanceStats.rolling7Rate}%`,
        sub: `${arabicSource("common.today")} ${attendanceStats.attendanceRate}%`,
        icon: ClipboardCheck,
        color: "text-emerald-400",
        trend: attendanceStats.attendanceTrend,
        href: `/${ROUTE_SEGMENT.attendance}`,
      },
      {
        label: arabicSource("common.total_compensation"),
        value: formatIQD(compensationStats.totalCompensation),
        sub: `${arabicSource("dashboard.cost_employee")} ${formatIQD(compensationStats.costPerEmployee)}`,
        icon: Wallet,
        color: "text-blue-400",
        href: `/${ROUTE_SEGMENT.payroll}`,
      },
      {
        label: arabicSource("common.turnover_rate_annual"),
        value: `${turnoverRate}%`,
        sub: `${newHireStats.last30} ${arabicSource("dashboard.new_appointment_30_days")}`,
        icon: Activity,
        color:
          turnoverRate > cfg.turnoverWarning
            ? "text-red-400"
            : "text-emerald-400",
      },
      {
        label: arabicSource("dashboard.risk_level"),
        value: `${riskScore.score}/100`,
        sub: `${riskScore.items.length} ${arabicSource("dashboard.risk_factors")}`,
        icon: Shield,
        color:
          riskScore.level === "low"
            ? "text-emerald-400"
            : riskScore.level === "medium"
              ? "text-amber-400"
              : "text-red-400",
      },
    ],
    [
      activeEmployees,
      inactiveEmployees,
      totalEmployees,
      attendanceStats,
      compensationStats,
      turnoverRate,
      newHireStats,
      cfg,
      riskScore,
    ],
  );

  const riskItemsPreview = useMemo(
    () => riskScore.items.slice(0, 5),
    [riskScore.items],
  );

  const notificationsPreview = useMemo(
    () => notifications.slice(0, 6),
    [notifications],
  );

  const alertBanners = useMemo(() => {
    const banners: {
      key: string;
      icon: typeof FileCheck;
      message: string;
      colorClassName: string;
      textColorClassName: string;
    }[] = [];
    if (expiryStats.expiredDocs > 0) {
      banners.push({
        key: "expiredDocs",
        icon: FileCheck,
        message: `${expiryStats.expiredDocs} ${arabicSource("common.finished_document")}`,
        colorClassName: "bg-red-500/10 border border-red-500/30",
        textColorClassName: "text-red-400",
      });
    }
    if (expiryStats.expiringDocs > 0) {
      banners.push({
        key: "expiringDocs",
        icon: FileCheck,
        message: `${expiryStats.expiringDocs} ${arabicSource("common.document_nearing_completion")}`,
        colorClassName: "bg-amber-500/10 border border-amber-500/30",
        textColorClassName: "text-amber-400",
      });
    }
    if (expiryStats.expiringContracts > 0) {
      banners.push({
        key: "expiringContracts",
        icon: Briefcase,
        message: `${expiryStats.expiringContracts} ${arabicSource("common.contract_soon_to_expire")}`,
        colorClassName: "bg-red-500/10 border border-red-500/30",
        textColorClassName: "text-red-400",
      });
    }
    if (probationCount > 0) {
      banners.push({
        key: "probationCount",
        icon: Shield,
        message: `${probationCount} ${arabicSource("dashboard.is_in_a_trial_period")}`,
        colorClassName: "bg-blue-500/10 border border-blue-500/30",
        textColorClassName: "text-blue-400",
      });
    }
    if (warningStats.active > 0) {
      banners.push({
        key: "warningActive",
        icon: AlertTriangle,
        message: `${warningStats.active} ${arabicSource("common.alarm_active")}`,
        colorClassName: "bg-orange-500/10 border border-orange-500/30",
        textColorClassName: "text-orange-400",
      });
    }
    if (warningStats.escalationRisk > 0) {
      banners.push({
        key: "escalationRisk",
        icon: Zap,
        message: `${warningStats.escalationRisk} ${arabicSource("common.risk_of_escalation")}`,
        colorClassName: "bg-red-500/10 border border-red-500/30",
        textColorClassName: "text-red-400",
      });
    }
    return banners;
  }, [expiryStats, probationCount, warningStats]);

  return {
    quickIndicators,
    dashboardStatsData,
    riskItemsPreview,
    notificationsPreview,
    alertBanners,
  };
};
