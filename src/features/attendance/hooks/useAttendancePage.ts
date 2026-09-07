import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useAttendanceRecords,
  useEmployeeAvatars,
  useEmployees,
  useHierarchyData,
  useShifts,
} from "@/shared/hooks";
import type { DbAttendanceRecord } from "@/shared/hooks";
import type { ExcuseForm } from "@/features/attendance/types";
import { buildTodayAttendanceStats } from "@/features/attendance/utils/attendanceDisplay";
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

  const todayStats = useMemo(
    () =>
      buildTodayAttendanceStats(
        rawRecords,
        selectedDate,
        i18n.resolvedLanguage,
      ),
    [rawRecords, selectedDate, i18n.resolvedLanguage],
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
