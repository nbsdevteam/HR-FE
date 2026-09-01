import { useCallback, useState } from "react";
import { arabicSource } from "@/i18n/source";
import { todayInBaghdad } from "@/shared/utils/timezone";
import type {
  AttendanceSortKey,
  AttendanceViewMode,
} from "@/features/attendance/types";

/**
 * Presentation-only state for the attendance page: which day is shown, the
 * list/kanban toggle, the search + status filter, the sort key/direction, the
 * employee whose detail modal is open and whether the weekly chart is expanded.
 * Kept apart from data fetching so a keystroke in the search box never touches
 * the records hook.
 */
export const useAttendanceViewState = () => {
  const [selectedDate, setSelectedDate] = useState(todayInBaghdad());
  const [viewMode, setViewMode] = useState<AttendanceViewMode>("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(
    arabicSource("common.all"),
  );
  const [sortBy, setSortBy] = useState<AttendanceSortKey>("checkIn");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null,
  );
  const [chartExpanded, setChartExpanded] = useState(false);

  const handleToggleChart = useCallback(() => {
    setChartExpanded((current) => !current);
  }, []);

  const handleCloseEmployeeDetail = useCallback(() => {
    setSelectedEmployeeId(null);
  }, []);

  return {
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
  };
};
