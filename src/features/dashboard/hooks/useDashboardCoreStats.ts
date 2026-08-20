import { useMemo } from "react";
import { arabicSource } from "@/i18n/source";
import type { DashboardRiskConfig } from "./useDashboardRiskConfig";

// ═══════ CORE COMPUTATIONS ═══════
export const useDashboardCoreStats = (employees: any[], cfg: DashboardRiskConfig) => {
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

  return { totalEmployees, activeEmployees, inactiveEmployees, totalSalaries, avgSalary, medianSalary, departmentData };
};
