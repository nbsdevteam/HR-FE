import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useAttendanceRecords,
  useEmployees,
  useHierarchyData,
  useShifts,
} from "@/shared/hooks";
import type { DbAttendanceRecord } from "@/shared/hooks";
import type { ExcuseForm } from "@/features/attendance/types";
import {
  buildTodayAttendanceStats,
  buildWeeklyAttendance,
} from "@/features/attendance/utils/attendanceDisplay";
import { useAttendanceRows } from "./useAttendanceRows";
import { useAttendanceViewState } from "./useAttendanceViewState";
import { useExcuseModal } from "./useExcuseModal";

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

  const thirtyDaysAgo = useMemo(
    () => new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
    [],
  );
  const { employees } = useEmployees();
  const { shifts: dbShifts } = useShifts();
  const { departments: dbDepartments } = useHierarchyData();
  const {
    records: hookRecords,
    loading,
    refetch: refetchAttendance,
  } = useAttendanceRecords({ date_from: thirtyDaysAgo });

  const { empMap, attendanceRows } = useAttendanceRows({
    rawRecords,
    selectedDate,
    employees,
    departments: dbDepartments,
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

  const weeklyAttendance = useMemo(
    () => buildWeeklyAttendance(rawRecords),
    [rawRecords],
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
    if (hookRecords.length > 0 && !selectedDate) {
      const dates = [...new Set(hookRecords.map((r) => r.date))]
        .sort()
        .reverse();
      setSelectedDate(dates[0]);
    }
  }, [hookRecords, selectedDate, setSelectedDate]);

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
    handleSaveExcuse,
    handleToggleChart,
    handleCloseEmployeeDetail,
    handleCloseExcuseModal,
  };
};
