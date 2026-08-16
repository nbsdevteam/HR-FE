import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import * as odooData from "@/shared/api/odooData";
import {
  useEmployees, useAttendanceRecords, empDisplayName, formatTime, formatWorkHours,
  mapAttendanceStatus, useShifts, useHierarchyData,
} from "@/shared/hooks";
import type { DbAttendanceRecord, DbEmployee } from "@/shared/hooks";
import { localizedAlert } from "@/i18n/native";
import { arabicSource } from "@/i18n/source";
import { AttendanceRow, dayNames } from "@/features/attendance/types";
import { buildTodayAttendanceStats } from "@/features/attendance/utils/attendanceDisplay";
import { EmployeeAttendanceDetail } from "../components/EmployeeAttendanceDetail";
import { AttendanceHeader } from "../components/AttendanceHeader";
import { AttendanceStatsCards } from "../components/AttendanceStatsCards";
import { AttendanceSourceIndicators } from "../components/AttendanceSourceIndicators";
import { WeeklyAttendanceChart } from "../components/WeeklyAttendanceChart";
import { AttendanceFilters } from "../components/AttendanceFilters";
import { AttendanceRecordsView } from "../components/AttendanceRecordsView";
import { ExcuseModal } from "../components/ExcuseModal";

export const Attendance = () => {
  const [rawRecords, setRawRecords] = useState<DbAttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(arabicSource("common.all"));
  const [sortBy, setSortBy] = useState<"name" | "deviceNo" | "department" | "checkIn" | "checkOut" | "hours" | "status">("checkIn");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [chartExpanded, setChartExpanded] = useState(false);
  const [excuseModal, setExcuseModal] = useState<{record: AttendanceRow} | null>(null);
  const [excuseForm, setExcuseForm] = useState({late: false, absence: false, shortfall: false, note: ""});
  const [excuseSaving, setExcuseSaving] = useState(false);

  const { i18n } = useTranslation();

  const thirtyDaysAgo = useMemo(
    () => new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
    [],
  );
  const { employees } = useEmployees();
  const { shifts: dbShifts } = useShifts();
  const { departments: dbDepartments } = useHierarchyData();
  const { records: hookRecords, loading, refetch: refetchAttendance } = useAttendanceRecords({
    date_from: thirtyDaysAgo,
  });

  // Build employee ID → info map (including device_employee_no)
  // Department color map
  const deptColorMap = useMemo(() => {
    const m: Record<string, string> = {};
    dbDepartments.forEach((d: any) => { if (d.color) m[d.name] = d.color; });
    return m;
  }, [dbDepartments]);

  const empMap = useMemo(() => {
    const m: Record<string, { name: string; dept: string; deviceNo: string; photo: string | null; position: string | null; deptColor: string | null }> = {};
    employees.forEach((e: DbEmployee) => {
      m[e.id] = {
        name: empDisplayName(e),
        dept: e.department || "—",
        deviceNo: e.device_employee_no || "—",
        photo: e.profile_picture || null,
        position: e.position || null,
        deptColor: deptColorMap[e.department] || null,
      };
    });
    return m;
  }, [employees, deptColorMap]);

  // Filter records for selected date and map to UI rows
  const attendanceRows: AttendanceRow[] = useMemo(() => {
    const rows = rawRecords
      .filter(r => r.date === selectedDate)
      .map(r => {
        const emp = empMap[r.employee_id] || { name: r.employee_id.substring(0, 12), dept: "—", deviceNo: "—", photo: null, position: null };
        return {
          id: r.id,
          employeeId: r.employee_id,
          employee: emp.name,
          department: emp.dept,
          deviceNo: r.device_employee_no || emp.deviceNo,
          date: r.date,
          checkIn: formatTime(r.check_in_time),
          checkOut: formatTime(r.check_out_time),
          rawCheckIn: r.check_in_time,
          rawCheckOut: r.check_out_time,
          status: mapAttendanceStatus(r.status, r.is_late),
          rawStatus: r.status,
          workHours: formatWorkHours(r.working_hours || 0),
          workHoursNum: r.working_hours || 0,
          source: r.source || null,
          verifyMode: r.verify_mode || null,
          lateMinutes: r.late_minutes || 0,
          autoCheckout: r.auto_checkout_applied || false,
          overtimeHours: r.overtime_hours || 0,
          breakMinutes: (r as any).total_break_minutes || 0,
          deptColor: emp.deptColor || null,
          excusedLate: r.excused_late || false,
          excusedAbsence: r.excused_absence || false,
          excusedShortfall: r.excused_shortfall || false,
          excuseNote: r.excuse_note || null,
        };
      });

    // Apply search filter
    let filtered = rows;
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.employee.includes(searchTerm) || r.deviceNo.includes(searchTerm) || r.department.includes(searchTerm)
      );
    }
    if (statusFilter !== arabicSource("common.all")) {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Sort
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortBy === "name") filtered.sort((a, b) => dir * a.employee.localeCompare(b.employee, "ar"));
    else if (sortBy === "deviceNo") filtered.sort((a, b) => dir * (parseInt(a.deviceNo || "0") - parseInt(b.deviceNo || "0")));
    else if (sortBy === "department") filtered.sort((a, b) => dir * a.department.localeCompare(b.department, "ar"));
    else if (sortBy === "checkIn") filtered.sort((a, b) => dir * (a.rawCheckIn || "99:99").localeCompare(b.rawCheckIn || "99:99"));
    else if (sortBy === "checkOut") filtered.sort((a, b) => dir * (a.rawCheckOut || "99:99").localeCompare(b.rawCheckOut || "99:99"));
    else if (sortBy === "hours") filtered.sort((a, b) => dir * (a.workHoursNum - b.workHoursNum));
    else if (sortBy === "status") filtered.sort((a, b) => dir * a.status.localeCompare(b.status, "ar"));

    return filtered;
  }, [rawRecords, selectedDate, empMap, searchTerm, statusFilter, sortBy, sortDir]);

  // Stats
  const todayStats = useMemo(
    () => buildTodayAttendanceStats(rawRecords, selectedDate, i18n.resolvedLanguage),
    [rawRecords, selectedDate, i18n.resolvedLanguage],
  );

  // Weekly chart
  const weeklyAttendance = useMemo(() => {
    const dayMap: Record<string, { present: number; late: number; absent: number; leave: number }> = {};
    const orderedDays = ["sunday", "monday", "tuesday", "wednesday", "thursday"];
    orderedDays.forEach(d => { dayMap[d] = { present: 0, late: 0, absent: 0, leave: 0 }; });
    rawRecords.forEach(r => {
      const d = r.day_of_week?.toLowerCase();
      if (!dayMap[d]) return;
      const st = mapAttendanceStatus(r.status, r.is_late);
      if (st === arabicSource("common.present")) dayMap[d].present++;
      else if (st === arabicSource("common.late")) dayMap[d].late++;
      else if (st === arabicSource("common.absent")) dayMap[d].absent++;
      else if (st === arabicSource("common.leave")) dayMap[d].leave++;
    });
    return orderedDays.map(d => ({ day: dayNames[d] || d, ...dayMap[d] })).reverse();
  }, [rawRecords]);

  const handleSaveExcuse = useCallback(async () => {
    if (!excuseModal) return;
    setExcuseSaving(true);
    try {
      await odooData.excuseAttendance({
        attendance_id: Number(excuseModal.record.id) || excuseModal.record.id,
        excused_late: excuseForm.late,
        excused_absence: excuseForm.absence,
        excused_shortfall: excuseForm.shortfall,
        excuse_note: excuseForm.note || null,
      });
      setRawRecords((prev) => prev.map((r) => (r.id === excuseModal.record.id ? {
        ...r,
        excused_late: excuseForm.late,
        excused_absence: excuseForm.absence,
        excused_shortfall: excuseForm.shortfall,
        excuse_note: excuseForm.note || null,
      } : r)));
      setExcuseModal(null);
      await refetchAttendance();
    } catch (err) {
      localizedAlert(arabicSource("attendance.error_saving_excuse"));
    }
    setExcuseSaving(false);
  }, [excuseForm, excuseModal, refetchAttendance]);

  const handleToggleChart = useCallback(() => {
    setChartExpanded((current) => !current);
  }, []);

  const handleCloseEmployeeDetail = useCallback(() => {
    setSelectedEmployeeId(null);
  }, []);

  const handleCloseExcuseModal = useCallback(() => {
    setExcuseModal(null);
  }, []);

  useEffect(() => {
    setRawRecords(hookRecords);
    if (hookRecords.length > 0 && !selectedDate) {
      const dates = [...new Set(hookRecords.map((r) => r.date))].sort().reverse();
      setSelectedDate(dates[0]);
    }
  }, [hookRecords, selectedDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-muted-foreground ms-3">{arabicSource("attendance.loading_attendance_records")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AttendanceHeader
        viewMode={viewMode}
        selectedDate={selectedDate}
        onViewModeChange={setViewMode}
        onSelectedDateChange={setSelectedDate}
      />

      <AttendanceStatsCards todayStats={todayStats} />

      <AttendanceSourceIndicators todayStats={todayStats} rawRecords={rawRecords} selectedDate={selectedDate} />

      <WeeklyAttendanceChart
        chartExpanded={chartExpanded}
        weeklyAttendance={weeklyAttendance}
        onToggle={handleToggleChart}
      />

      <AttendanceFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        sortBy={sortBy}
        onSearchTermChange={setSearchTerm}
        onStatusFilterChange={setStatusFilter}
        onSortByChange={setSortBy}
      />

      {/* Results count */}
      <div className="px-1">
        <span className="text-muted-foreground" style={{ fontSize: 12 }}>
          {attendanceRows.length} {arabicSource("common.record")} {statusFilter !== arabicSource("common.all") ? `(${statusFilter})` : ""} {searchTerm ? `${arabicSource("attendance.search")}${searchTerm}"` : ""}
        </span>
      </div>

      {/* Employee Attendance Detail Modal */}
      <AnimatePresence>
        {selectedEmployeeId && (
          <EmployeeAttendanceDetail
            employeeId={selectedEmployeeId}
            employees={employees}
            empMap={empMap}
            dbShifts={dbShifts}
            dbDepartments={dbDepartments}
            onClose={handleCloseEmployeeDetail}
          />
        )}
      </AnimatePresence>

      <AttendanceRecordsView
        viewMode={viewMode}
        attendanceRows={attendanceRows}
        sortBy={sortBy}
        sortDir={sortDir}
        setSortBy={setSortBy}
        setSortDir={setSortDir}
        setSelectedEmployeeId={setSelectedEmployeeId}
        setExcuseForm={setExcuseForm}
        setExcuseModal={setExcuseModal}
      />

      <ExcuseModal
        excuseModal={excuseModal}
        excuseForm={excuseForm}
        excuseSaving={excuseSaving}
        onClose={handleCloseExcuseModal}
        onExcuseFormChange={setExcuseForm}
        onSave={handleSaveExcuse}
      />
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// Employee Attendance Detail — Calendar + Monthly + Overall
// ══════════════════════════════════════════════════════════════
