import { useState, useMemo, useCallback, useEffect } from "react";
import * as odooData from "@/shared/api/odooData";
import { useChartTheme } from "@/shared/components/chart-utils";
import {
  useEmployees, useAttendanceRecords, useMonthlyRecords,
  useLeaveRequests, useEmployeeContracts,
  useEmployeeDocuments, useLoans, useNotifications,
  useEvaluations, useWarnings, useTrainingPrograms, useTrainingParticipants,
  useExitProcesses, useJobOpenings, useApplicants, useLeaveBalances,
  useEmployeeAllowances, useEmployeeDeductions,
  useConfigurations,
} from "@/shared/hooks";
import { useAppSettings } from "@/app/providers";
import type { DashboardKpiSection, DashboardServerCards } from "../types";
import { dashboardCardClass } from "../styles";
import { useDashboardRiskConfig } from "./useDashboardRiskConfig";
import { useDashboardCoreStats } from "./useDashboardCoreStats";
import { useDashboardAttendanceStats } from "./useDashboardAttendanceStats";
import { useDashboardWorkforceStats } from "./useDashboardWorkforceStats";
import { useDashboardFinancialStats } from "./useDashboardFinancialStats";
import { useDashboardPerformanceStats } from "./useDashboardPerformanceStats";
import { useDashboardRecruitmentStats } from "./useDashboardRecruitmentStats";
import { useDashboardRiskScore } from "./useDashboardRiskScore";
import { useDashboardChartData } from "./useDashboardChartData";

export const useDashboardData = () => {
  const [kpiSection, setKpiSection] = useState<DashboardKpiSection>("overview");
  const [serverCards, setServerCards] = useState<DashboardServerCards | null>(null);

  const { colors } = useChartTheme();
  const { settings: appSettings } = useAppSettings();
  const { employees, loading: empLoading } = useEmployees();
  const { records: attendance, loading: attLoading } = useAttendanceRecords();
  const { records: monthlyRecords, loading: mrLoading } = useMonthlyRecords();
  const loading = empLoading || attLoading || mrLoading;

  const { requests: leaveRequests } = useLeaveRequests();
  const { contracts } = useEmployeeContracts();
  const { documents: empDocuments } = useEmployeeDocuments();
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
  const { allowances: allAllowances } = useEmployeeAllowances();
  const { deductions: allDeductions } = useEmployeeDeductions();
  const { configs } = useConfigurations();

  const cfg = useDashboardRiskConfig(configs);

  const {
    totalEmployees, activeEmployees, inactiveEmployees, totalSalaries, avgSalary, medianSalary, departmentData,
  } = useDashboardCoreStats(employees, cfg);

  const { attendanceStats, deptAttendance, dayOfWeekAttendance, attendanceChartData, monthlyPayroll } =
    useDashboardAttendanceStats(attendance, totalEmployees, serverCards, employees, monthlyRecords, appSettings);

  const {
    pendingLeaves, approvedLeaves, activeContracts, probationCount, tenureStats, turnoverRate,
    newHireStats, leaveUtilization, headcountTrend, expiryStats,
  } = useDashboardWorkforceStats(leaveRequests, contracts, employees, totalEmployees, exitProcesses, leaveBalances, appSettings, empDocuments, cfg);

  const { activeLoans, totalLoanBalance, loanUtilization, compensationStats, salaryByDept, payrollMoM } =
    useDashboardFinancialStats(loans, totalEmployees, allAllowances, allDeductions, totalSalaries, employees, monthlyPayroll);

  const { evalStats, warningStats, trainingStats } =
    useDashboardPerformanceStats(evaluations, totalEmployees, warnings, cfg, trainingPrograms, trainingParticipants);

  const { recruitmentStats, recruitmentPipeline } = useDashboardRecruitmentStats(jobs, applicants);

  const riskScore = useDashboardRiskScore(expiryStats, warningStats, attendanceStats, turnoverRate, pendingLeaves, cfg);

  const { tenureDistribution, warningDistribution } =
    useDashboardChartData(tenureStats, warningStats);

  const cardCls = dashboardCardClass;

  const dashboardSectionData = useMemo(() => ({
    activeEmployees, inactiveEmployees, totalEmployees, attendanceStats, compensationStats, turnoverRate, newHireStats, tenureStats, approvedLeaves, cfg, riskScore,
    expiryStats, probationCount, warningStats, departmentData, colors, attendanceChartData, headcountTrend, payrollMoM, monthlyPayroll,
    pendingLeaves, activeLoans, evalStats, trainingStats, recruitmentStats, exitProcesses, notifications, unreadCount, cardCls, deptAttendance,
    tenureDistribution, dayOfWeekAttendance, leaveRequests, leaveUtilization, activeContracts, totalSalaries, avgSalary, medianSalary,
    salaryByDept, loanUtilization, totalLoanBalance, allAllowances, allDeductions, warningDistribution, evaluations, trainingPrograms, recruitmentPipeline, jobs, applicants,
  }), [
    activeEmployees, inactiveEmployees, totalEmployees, attendanceStats, compensationStats, turnoverRate, newHireStats, tenureStats, approvedLeaves, cfg, riskScore,
    expiryStats, probationCount, warningStats, departmentData, colors, attendanceChartData, headcountTrend, payrollMoM, monthlyPayroll,
    pendingLeaves, activeLoans, evalStats, trainingStats, recruitmentStats, exitProcesses, notifications, unreadCount, cardCls, deptAttendance,
    tenureDistribution, dayOfWeekAttendance, leaveRequests, leaveUtilization, activeContracts, totalSalaries, avgSalary, medianSalary,
    salaryByDept, loanUtilization, totalLoanBalance, allAllowances, allDeductions, warningDistribution, evaluations, trainingPrograms, recruitmentPipeline, jobs, applicants,
  ]);

  const handleKpiSectionChange = useCallback((section: DashboardKpiSection) => {
    setKpiSection(section);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // The endpoint has shipped both shapes: `{ cards: {...} }` and the bare
        // card object, so accept either rather than assuming one.
        const data = (await odooData.fetchHrDashboard()) as
          | (DashboardServerCards & { cards?: DashboardServerCards })
          | null;
        const cards = data?.cards ?? data;
        if (!cancelled && cards) setServerCards(cards);
      } catch {
        if (!cancelled) setServerCards(null);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return {
    dashboardSectionData,
    handleKpiSectionChange,
    kpiSection,
    loading,
    riskScore,
    unreadCount,
  };
};

export type DashboardSectionData = ReturnType<
  typeof useDashboardData
>["dashboardSectionData"];
