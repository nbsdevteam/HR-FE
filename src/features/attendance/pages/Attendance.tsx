import { lazy, Suspense } from "react";
import { AnimatePresence } from "motion/react";
import { Loader2 } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { useAttendancePage } from "../hooks/useAttendancePage";
import AttendanceHeader from "../components/AttendanceHeader";
import AttendanceStatsCards from "../components/AttendanceStatsCards";
import AttendanceSourceIndicators from "../components/AttendanceSourceIndicators";
import WeeklyAttendanceChart from "../components/WeeklyAttendanceChart";
import AttendanceFilters from "../components/AttendanceFilters";
import AttendanceRecordsView from "../components/AttendanceRecordsView";
import ExcuseModal from "../components/ExcuseModal";

const EmployeeAttendanceDetail = lazy(
  () => import("../components/EmployeeAttendanceDetail"),
);

const Attendance = () => {
  const {
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
  } = useAttendancePage();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-muted-foreground ms-3">
          {arabicSource("attendance.loading_attendance_records")}
        </span>
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

      <AttendanceSourceIndicators
        todayStats={todayStats}
        rawRecords={rawRecords}
        selectedDate={selectedDate}
      />

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
          {attendanceRows.length} {arabicSource("common.record")}{" "}
          {statusFilter !== arabicSource("common.all")
            ? `(${statusFilter})`
            : ""}{" "}
          {searchTerm
            ? `${arabicSource("attendance.search")}${searchTerm}"`
            : ""}
        </span>
      </div>

      {/* Employee Attendance Detail Modal */}
      <AnimatePresence>
        {selectedEmployeeId && (
          <Suspense fallback={null}>
            <EmployeeAttendanceDetail
              employeeId={selectedEmployeeId}
              employees={employees}
              empMap={empMap}
              dbShifts={dbShifts}
              dbDepartments={dbDepartments}
              onClose={handleCloseEmployeeDetail}
            />
          </Suspense>
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

export default Attendance;
