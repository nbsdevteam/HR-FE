import { useCallback, useEffect, useMemo, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import {
  resolveEmployeeShift,
  shiftToSchedule,
  type DbAttendanceRecord,
  type DbEmployee,
} from "@/shared/hooks";
import type { EmployeeSchedule } from "@/features/payroll";
import { arabicSource } from "@/i18n/source";

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

const PRESENT_STATUSES = [
  "complete",
  "auto_checkout",
  "checked_in",
  "missing_checkout",
  "missing_checkin",
];

type UseEmployeeAttendanceDetailArgs = {
  employeeId: string;
  employees: DbEmployee[];
  empMap: Record<
    string,
    {
      name: string;
      dept: string;
      deviceNo: string;
      photo: string | null;
      position: string | null;
    }
  >;
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
  const [allRecords, setAllRecords] = useState<DbAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return (
      now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0")
    );
  });

  // Resolve the employee's shift → schedule (determines rest days)
  const emp = employees.find((e) => e.id === employeeId);
  const empShift = useMemo(
    () => (emp ? resolveEmployeeShift(emp, dbDepartments, dbShifts) : null),
    [emp, dbDepartments, dbShifts],
  );
  const empSchedule: EmployeeSchedule | null = useMemo(
    () => (empShift ? shiftToSchedule(empShift) : null),
    [empShift],
  );
  const empInfo = empMap[employeeId];

  // Records for current calendar month
  const monthRecords = useMemo(() => {
    const [y, m] = calMonth.split("-").map(Number);
    const prefix = `${y}-${String(m).padStart(2, "0")}`;
    return allRecords.filter((r) => r.date.startsWith(prefix));
  }, [allRecords, calMonth]);

  // Month display name
  const monthLabel = useMemo(() => {
    const [y, m] = calMonth.split("-").map(Number);
    return `${MONTH_LABELS[m - 1]} ${y}`;
  }, [calMonth]);

  // Monthly stats
  const monthStats = useMemo(() => {
    const complete = monthRecords.filter(
      (r) => r.status === "complete" || r.status === "auto_checkout",
    );
    const totalHours = monthRecords.reduce(
      (s, r) => s + (r.working_hours || 0),
      0,
    );
    const overtime = monthRecords.reduce(
      (s, r) => s + (r.overtime_hours || 0),
      0,
    );
    const lateCount = monthRecords.filter((r) => r.is_late).length;
    const lateMins = monthRecords.reduce(
      (s, r) => s + (r.late_minutes || 0),
      0,
    );
    const absentCount = monthRecords.filter(
      (r) => r.status === "absent",
    ).length;
    const checkedInOnly = monthRecords.filter(
      (r) => r.status === "checked_in" || r.status === "missing_checkout",
    ).length;
    const avgHours = complete.length > 0 ? totalHours / complete.length : 0;
    return {
      daysWorked: complete.length + checkedInOnly,
      totalHours,
      avgHours,
      overtime,
      lateCount,
      lateMins,
      absentCount,
      checkedInOnly,
      totalRecords: monthRecords.length,
    };
  }, [monthRecords]);

  // Overall stats (all time) — single pass over allRecords instead of separate filter/reduce calls
  const overallStats = useMemo(() => {
    let completeCount = 0;
    let totalHours = 0;
    let overtime = 0;
    let lateCount = 0;
    let lateMins = 0;
    let absentCount = 0;
    let presentCount = 0;
    const months = new Set<string>();

    for (const r of allRecords) {
      const isComplete =
        r.status === "complete" || r.status === "auto_checkout";
      if (isComplete) completeCount++;
      totalHours += r.working_hours || 0;
      overtime += r.overtime_hours || 0;
      if (r.is_late) lateCount++;
      lateMins += r.late_minutes || 0;
      if (r.status === "absent") absentCount++;
      if (PRESENT_STATUSES.includes(r.status)) presentCount++;
      months.add(r.date.slice(0, 7));
    }

    const avgHours = completeCount > 0 ? totalHours / completeCount : 0;
    const firstDate = allRecords.length > 0 ? allRecords[0].date : "—";
    const lastDate =
      allRecords.length > 0 ? allRecords[allRecords.length - 1].date : "—";

    return {
      daysWorked: completeCount,
      totalHours,
      avgHours,
      overtime,
      lateCount,
      lateMins,
      absentCount,
      totalRecords: allRecords.length,
      monthsCount: months.size,
      firstDate,
      lastDate,
      presentDays: presentCount,
      attendanceRate:
        allRecords.length > 0
          ? Math.round((presentCount / allRecords.length) * 100)
          : 0,
    };
  }, [allRecords]);

  // Per-month breakdown for overall tab
  const monthlyBreakdown = useMemo(() => {
    const byMonth: Record<
      string,
      {
        month: string;
        days: number;
        hours: number;
        overtime: number;
        late: number;
        absent: number;
      }
    > = {};
    allRecords.forEach((r) => {
      const m = r.date.slice(0, 7);
      if (!byMonth[m])
        byMonth[m] = {
          month: m,
          days: 0,
          hours: 0,
          overtime: 0,
          late: 0,
          absent: 0,
        };
      if (PRESENT_STATUSES.includes(r.status)) byMonth[m].days++;
      byMonth[m].hours += r.working_hours || 0;
      byMonth[m].overtime += r.overtime_hours || 0;
      if (r.is_late) byMonth[m].late++;
      if (r.status === "absent") byMonth[m].absent++;
    });
    return Object.values(byMonth).sort((a, b) =>
      b.month.localeCompare(a.month),
    );
  }, [allRecords]);

  // Navigate months
  const prevMonth = useCallback(() => {
    const [y, m] = calMonth.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    setCalMonth(
      d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"),
    );
  }, [calMonth]);

  const nextMonth = useCallback(() => {
    const [y, m] = calMonth.split("-").map(Number);
    const d = new Date(y, m, 1);
    setCalMonth(
      d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"),
    );
  }, [calMonth]);

  // Fetch ALL attendance records for this employee
  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        setAllRecords(
          await odooData.fetchAttendance({
            employee_id: employeeId,
            limit: 5000,
          }),
        );
      } catch (e) {
        console.error(e);
        setAllRecords([]);
      }
      setLoading(false);
    }
    fetch();
  }, [employeeId]);

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
