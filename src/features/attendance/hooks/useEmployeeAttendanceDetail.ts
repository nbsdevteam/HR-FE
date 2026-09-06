import { useCallback, useMemo, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { STALE_TIME } from "@/shared/api/queryClient";
import { resolveEmployeeShift, shiftToSchedule } from "@/shared/hooks";
import type { DbAttendanceRecord, DbEmployee } from "@/shared/hooks";
import { useAsyncList } from "@/shared/hooks/useAsyncList";
import type { EmployeeSchedule } from "@/features/payroll";
import { arabicSource } from "@/i18n/source";
import { indexBy } from "@/shared/utils/collections";
import type { AttendanceEmployeeMap } from "@/features/attendance/types";
import {
  buildMonthAttendanceStats,
  buildMonthlyBreakdown,
  buildOverallAttendanceStats,
} from "@/features/attendance/utils/attendanceStats";

export type DetailTabId = "calendar" | "monthly" | "overall";

const MONTH_LABELS = [
  arabicSource("common.january"),
  arabicSource("common.february"),
  arabicSource("common.march"),
  arabicSource("common.april"),
  arabicSource("common.may"),
  arabicSource("common.jun"),
  arabicSource("common.july"),
  arabicSource("common.august"),
  arabicSource("common.september"),
  arabicSource("common.october_additional"),
  arabicSource("common.november"),
  arabicSource("common.december"),
];

const currentCalMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const shiftCalMonth = (calMonth: string, delta: number): string => {
  const [year, month] = calMonth.split("-").map(Number);
  const shifted = new Date(year, month - 1 + delta, 1);
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, "0")}`;
};

type UseEmployeeAttendanceDetailArgs = {
  employeeId: string;
  employees: DbEmployee[];
  empMap: AttendanceEmployeeMap;
  dbShifts: any[];
  dbDepartments: any[];
};

export const useEmployeeAttendanceDetail = ({
  employeeId,
  employees,
  empMap,
  dbShifts,
  dbDepartments,
}: UseEmployeeAttendanceDetailArgs) => {
  const [activeTab, setActiveTab] = useState<DetailTabId>("calendar");
  const [calMonth, setCalMonth] = useState(currentCalMonth);

  const fetchRecords = useCallback(
    () => odooData.fetchAttendance({ employee_id: employeeId, limit: 5000 }),
    [employeeId],
  );
  // The pull is unbounded (up to 5000 records) and always includes today, so
  // it stays short-lived and refetches on tab focus rather than the app
  // default — otherwise a check-in made while this modal is open could hide
  // behind a minute-old cache entry.
  const { data: allRecords, loading } = useAsyncList<DbAttendanceRecord>(
    fetchRecords,
    [employeeId],
    "Failed to load employee attendance",
    undefined,
    { cacheKey: "employee-attendance", ttlMs: STALE_TIME.SHORT, refetchOnWindowFocus: true },
  );

  // Indexed once instead of re-scanning `employees` on every render — the
  // resulting `emp` identity also keeps the shift/schedule memos stable.
  const employeeIndex = useMemo(
    () => indexBy(employees, (employee) => employee.id),
    [employees],
  );
  const emp = employeeIndex.get(employeeId);

  const empShift = useMemo(
    () => (emp ? resolveEmployeeShift(emp, dbDepartments, dbShifts) : null),
    [emp, dbDepartments, dbShifts],
  );
  const empSchedule: EmployeeSchedule | null = useMemo(
    () => (empShift ? shiftToSchedule(empShift) : null),
    [empShift],
  );
  const empInfo = empMap[employeeId];

  const monthRecords = useMemo(() => {
    const [year, month] = calMonth.split("-").map(Number);
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    return allRecords.filter((record) => record.date.startsWith(prefix));
  }, [allRecords, calMonth]);

  const monthLabel = useMemo(() => {
    const [year, month] = calMonth.split("-").map(Number);
    return `${MONTH_LABELS[month - 1]} ${year}`;
  }, [calMonth]);

  const monthStats = useMemo(
    () => buildMonthAttendanceStats(monthRecords),
    [monthRecords],
  );

  const overallStats = useMemo(
    () => buildOverallAttendanceStats(allRecords),
    [allRecords],
  );

  const monthlyBreakdown = useMemo(
    () => buildMonthlyBreakdown(allRecords),
    [allRecords],
  );

  const prevMonth = useCallback(() => {
    setCalMonth((current) => shiftCalMonth(current, -1));
  }, []);

  const nextMonth = useCallback(() => {
    setCalMonth((current) => shiftCalMonth(current, 1));
  }, []);

  return {
    activeTab,
    setActiveTab,
    loading,
    calMonth,
    emp,
    empSchedule,
    empInfo,
    monthRecords,
    monthLabel,
    monthStats,
    overallStats,
    monthlyBreakdown,
    prevMonth,
    nextMonth,
  };
};
