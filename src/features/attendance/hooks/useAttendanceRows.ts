import { useMemo } from "react";
import {
  empDisplayName,
  formatTime,
  formatWorkHours,
  mapAttendanceStatus,
} from "@/shared/hooks";
import type { DbAttendanceRecord, DbEmployee } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import type {
  AttendanceEmployeeMap,
  AttendanceRow,
  AttendanceSortKey,
} from "@/features/attendance/types";

type UseAttendanceRowsArgs = {
  rawRecords: DbAttendanceRecord[];
  selectedDate: string;
  employees: DbEmployee[];
  departments: { name: string; color?: string | null }[];
  searchTerm: string;
  statusFilter: string;
  sortBy: AttendanceSortKey;
  sortDir: "asc" | "desc";
};

/** Ascending comparators; direction is applied once by the caller. */
const ROW_COMPARATORS: Record<
  AttendanceSortKey,
  (a: AttendanceRow, b: AttendanceRow) => number
> = {
  name: (a, b) => a.employee.localeCompare(b.employee, "ar"),
  deviceNo: (a, b) =>
    parseInt(a.deviceNo || "0") - parseInt(b.deviceNo || "0"),
  department: (a, b) => a.department.localeCompare(b.department, "ar"),
  checkIn: (a, b) =>
    (a.rawCheckIn || "99:99").localeCompare(b.rawCheckIn || "99:99"),
  checkOut: (a, b) =>
    (a.rawCheckOut || "99:99").localeCompare(b.rawCheckOut || "99:99"),
  hours: (a, b) => a.workHoursNum - b.workHoursNum,
  status: (a, b) => a.status.localeCompare(b.status, "ar"),
};

const FALLBACK_EMPLOYEE = {
  dept: "—",
  deviceNo: "—",
  photo: null,
  position: null,
  deptColor: null,
};

/**
 * Builds the employee lookup and the day's rows, then filters + sorts them.
 * The mapping pass is memoised separately from the filter/sort pass so typing
 * in the search box only re-runs the cheap half.
 */
export const useAttendanceRows = ({
  rawRecords,
  selectedDate,
  employees,
  departments,
  searchTerm,
  statusFilter,
  sortBy,
  sortDir,
}: UseAttendanceRowsArgs) => {
  const deptColorMap = useMemo(() => {
    const colors: Record<string, string> = {};
    departments.forEach((department) => {
      if (department.color) colors[department.name] = department.color;
    });
    return colors;
  }, [departments]);

  const empMap = useMemo(() => {
    const map: AttendanceEmployeeMap = {};
    employees.forEach((employee) => {
      map[employee.id] = {
        name: empDisplayName(employee),
        dept: employee.department || "—",
        deviceNo: employee.device_employee_no || "—",
        photo: employee.profile_picture || null,
        position: employee.position || null,
        deptColor: deptColorMap[employee.department] || null,
      };
    });
    return map;
  }, [employees, deptColorMap]);

  const dayRows: AttendanceRow[] = useMemo(
    () =>
      rawRecords
        .filter((record) => record.date === selectedDate)
        .map((record) => {
          const employee = empMap[record.employee_id];
          const info = employee ?? {
            ...FALLBACK_EMPLOYEE,
            name: record.employee_id.substring(0, 12),
          };

          return {
            id: record.id,
            employeeId: record.employee_id,
            employee: info.name,
            department: info.dept,
            deviceNo: record.device_employee_no || info.deviceNo,
            date: record.date,
            checkIn: formatTime(record.check_in_time),
            checkOut: formatTime(record.check_out_time),
            rawCheckIn: record.check_in_time,
            rawCheckOut: record.check_out_time,
            status: mapAttendanceStatus(record.status, record.is_late),
            rawStatus: record.status,
            workHours: formatWorkHours(record.working_hours || 0),
            workHoursNum: record.working_hours || 0,
            source: record.source || null,
            verifyMode: record.verify_mode || null,
            lateMinutes: record.late_minutes || 0,
            autoCheckout: record.auto_checkout_applied || false,
            overtimeHours: record.overtime_hours || 0,
            breakMinutes: (record as any).total_break_minutes || 0,
            deptColor: info.deptColor || null,
            excusedLate: record.excused_late || false,
            excusedAbsence: record.excused_absence || false,
            excusedShortfall: record.excused_shortfall || false,
            excuseNote: record.excuse_note || null,
          };
        }),
    [rawRecords, selectedDate, empMap],
  );

  const attendanceRows: AttendanceRow[] = useMemo(() => {
    let filtered = dayRows;

    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (normalizedSearch) {
      filtered = filtered.filter(
        (row) =>
          row.employee.toLowerCase().includes(normalizedSearch) ||
          row.deviceNo.toLowerCase().includes(normalizedSearch) ||
          row.department.toLowerCase().includes(normalizedSearch),
      );
    }
    if (statusFilter !== arabicSource("common.all")) {
      filtered = filtered.filter((row) => row.status === statusFilter);
    }

    const compare = ROW_COMPARATORS[sortBy];
    if (!compare) return filtered;

    const direction = sortDir === "asc" ? 1 : -1;
    // Copy before sorting so the memoised `dayRows` array is never mutated.
    return [...filtered].sort((a, b) => direction * compare(a, b));
  }, [dayRows, searchTerm, statusFilter, sortBy, sortDir]);

  return { empMap, attendanceRows };
};
