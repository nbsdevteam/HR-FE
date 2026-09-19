import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useAttendanceRecords,
  useEmployeeAvatars,
  useEmployees,
  useHierarchyData,
  useLeaveRequests,
  useShifts,
} from "@/shared/hooks";
import type { DbAttendanceRecord } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { todayInBaghdad } from "@/shared/utils/timezone";
import type { ExcuseForm } from "@/features/attendance/types";
import {
  buildTodayAttendanceStats,
  type AttendanceRoster,
} from "@/features/attendance/utils/attendanceDisplay";
import { useAttendanceRows } from "./useAttendanceRows";
import { useAttendanceViewState } from "./useAttendanceViewState";
import { useExcuseModal } from "./useExcuseModal";
import { useWeeklyAttendanceChart } from "./useWeeklyAttendanceChart";

/**
 * Composition root for the attendance page — wires the records fetch to the
 * view state (`useAttendanceViewState`), the row projection
 * (`useAttendanceRows`) and the excuse dialog (`useExcuseModal`).
 */
export const useAttendancePage = () => {
  const [rawRecords, setRawRecords] = useState<DbAttendanceRecord[]>([]);

  const {
    selectedDate,
    setSelectedDate,
    viewMode,
    setViewMode,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,
    selectedEmployeeId,
    setSelectedEmployeeId,
    chartExpanded,
    handleToggleChart,
    handleCloseEmployeeDetail,
  } = useAttendanceViewState();
  const { i18n } = useTranslation();

  const { employees } = useEmployees();
  const { shifts: dbShifts } = useShifts();
  const { departments: dbDepartments } = useHierarchyData();
  const {
    records: hookRecords,
    loading,
    refetch: refetchAttendance,
  } = useAttendanceRecords({ date: selectedDate });
  const { requests: leaveRequests } = useLeaveRequests({
    month: selectedDate.slice(0, 7),
  });

  // Scoped to the day actually on screen, not the whole roster — `useEmployees`
  // never carries a photo (the list endpoint deliberately omits it).
  const dayEmployeeIds = useMemo(
    () => Array.from(new Set(rawRecords.filter((r) => r.date === selectedDate).map((r) => r.employee_id))),
    [rawRecords, selectedDate],
  );
  const { avatars } = useEmployeeAvatars(dayEmployeeIds);

  const {
    weeklyAttendance,
    weekLoading,
    weekRangeLabel,
    canGoToNextWeek,
    handlePreviousWeek,
    handleNextWeek,
  } = useWeeklyAttendanceChart(chartExpanded);

  const { empMap, attendanceRows } = useAttendanceRows({
    rawRecords,
    selectedDate,
    employees,
    departments: dbDepartments,
    avatars,
    searchTerm,
    statusFilter,
    sortBy,
    sortDir,
  });

  // Absence is derived from the roster (no punch = no row). A future date has
  // nobody absent yet, so it falls back to the row-only counts.
  const roster = useMemo<AttendanceRoster | undefined>(() => {
    if (selectedDate > todayInBaghdad()) return undefined;
    const acceptedLabel = arabicSource("common.accepted");
    const onLeaveEmployeeIds = new Set(
      leaveRequests
        .filter(
          (request) =>
            request.status === acceptedLabel &&
            !request.is_hourly &&
            request.start_date <= selectedDate &&
            request.end_date >= selectedDate,
        )
        .map((request) => request.employee_id),
    );
    return {
      activeEmployeeIds: employees
        .filter((employee) => employee.is_active !== false)
        .map((employee) => employee.id),
      onLeaveEmployeeIds,
    };
  }, [employees, leaveRequests, selectedDate]);

  const todayStats = useMemo(
    () =>
      buildTodayAttendanceStats(
        rawRecords,
        selectedDate,
        i18n.resolvedLanguage,
        roster,
      ),
    [rawRecords, selectedDate, i18n.resolvedLanguage, roster],
  );

  const handleExcuseSaved = useCallback(
    async (recordId: string, form: ExcuseForm) => {
      setRawRecords((current) =>
        current.map((record) =>
          record.id === recordId
            ? {
                ...record,
                excused_late: form.late,
                excused_absence: form.absence,
                excused_shortfall: form.shortfall,
                excuse_note: form.note || null,
              }
            : record,
        ),
      );
      await refetchAttendance();
    },
    [refetchAttendance],
  );

  const {
    excuseModal,
    setExcuseModal,
    excuseForm,
    setExcuseForm,
    excuseSaving,
    handleSaveExcuse,
    handleCloseExcuseModal,
  } = useExcuseModal({ onSaved: handleExcuseSaved });

  useEffect(() => {
    setRawRecords(hookRecords);
  }, [hookRecords]);

  return {
    rawRecords,
    selectedDate,
    setSelectedDate,
    viewMode,
    setViewMode,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,
    selectedEmployeeId,
    setSelectedEmployeeId,
    chartExpanded,
    excuseModal,
    setExcuseModal,
    excuseForm,
    setExcuseForm,
    excuseSaving,
    employees,
    dbShifts,
    dbDepartments,
    loading,
    empMap,
    attendanceRows,
    todayStats,
    weeklyAttendance,
    weekLoading,
    weekRangeLabel,
    canGoToNextWeek,
    handlePreviousWeek,
    handleNextWeek,
    handleSaveExcuse,
    handleToggleChart,
    handleCloseEmployeeDetail,
    handleCloseExcuseModal,
  };
};
