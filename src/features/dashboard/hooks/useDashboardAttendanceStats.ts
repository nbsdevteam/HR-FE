import { useMemo } from "react";
import { arabicSource } from "@/i18n/source";
import { formatMonthOnly } from "@/app/providers";
import { groupBy } from "@/shared/utils/collections";
import type { DashboardServerCards } from "../types";
import { pct, pctDec } from "../utils/dashboardFormat";

/** Descending list of distinct attendance dates, plus a date → records index. */
const buildDateIndex = (attendance: any[]) => {
  const byDate = groupBy(attendance, (record: any) => record.date as string);
  const dates = [...byDate.keys()].sort().reverse();
  return { byDate, dates };
};

// ═══════ ATTENDANCE — ROLLING 7-DAY & 30-DAY ═══════
export const useDashboardAttendanceStats = (
  attendance: any[],
  totalEmployees: number,
  serverCards: DashboardServerCards | null,
  employees: any[],
  monthlyRecords: any[],
  appSettings: any,
) => {
  const attendanceStats = useMemo(() => {
    // Indexing by date once turns the rolling 7/30-day windows from
    // "re-scan every record per day" (O(days x records)) into O(records).
    const { byDate, dates } = buildDateIndex(attendance);
    const latestDate = dates[0] || "";
    const prevDate = dates[1] || "";

    const compute = (d: string) => {
      const recs = byDate.get(d) ?? [];
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
    const latestRecs = byDate.get(latestDate) ?? [];
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
    const { byDate, dates } = buildDateIndex(attendance);
    const empDeptMap: Record<string, string> = {};
    employees.forEach(e => { empDeptMap[e.id] = e.department || arabicSource("common.not_specified"); });

    const deptStats: Record<string, { present: number; total: number }> = {};
    dates.slice(0, 7).forEach(d => {
      const recs = byDate.get(d) ?? [];
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

  // Memoized because this array feeds the aggregated section payload's
  // dependency list — an unmemoized literal invalidated it on every render.
  const attendanceChartData = useMemo(() => [
    { name: arabicSource("common.present"), value: attendanceStats.present, color: "#22C55E" },
    { name: arabicSource("common.late"), value: attendanceStats.late, color: "#D4AF37" },
    { name: arabicSource("common.absent"), value: attendanceStats.absent, color: "#DC2626" },
    { name: arabicSource("common.leave"), value: attendanceStats.leave, color: "#3B82F6" },
  ], [attendanceStats]);

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

  return { attendanceStats, deptAttendance, dayOfWeekAttendance, attendanceChartData, monthlyPayroll };
};
