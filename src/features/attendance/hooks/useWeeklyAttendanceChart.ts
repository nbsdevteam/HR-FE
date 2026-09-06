import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import * as odooData from "@/shared/api/odooData";
import { STALE_TIME } from "@/shared/api/queryClient";
import { useAsyncList } from "@/shared/hooks/useAsyncList";
import type { DbAttendanceRecord } from "@/shared/hooks";
import { buildWeeklyAttendance } from "../utils/attendanceDisplay";
import { formatWeekRangeLabel, getWeekRange } from "../utils/weekRange";

/**
 * Data + navigation for the weekly attendance chart. Fetches only the 7 days
 * of the week in view, and only once the chart is expanded — the rest of the
 * page never needs more than the selected day, so this stays independent of
 * `rawRecords`.
 */
export const useWeeklyAttendanceChart = (expanded: boolean) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const { i18n } = useTranslation();

  const weekRange = useMemo(() => getWeekRange(weekOffset), [weekOffset]);

  const fetchWeek = useCallback(
    () =>
      odooData.fetchAttendance({
        date_from: weekRange.start,
        date_to: weekRange.end,
      }),
    [weekRange],
  );

  // The current week (weekOffset 0) includes today and can change under the
  // viewer's feet, so it stays short-lived and refetches on tab focus. Any
  // past week is frozen history — safe to cache far longer than the app default.
  const isCurrentWeek = weekOffset === 0;

  const { data, loading } = useAsyncList<DbAttendanceRecord>(
    fetchWeek,
    [weekRange.start, weekRange.end],
    "Failed to load weekly attendance",
    undefined,
    {
      cacheKey: "weeklyAttendance",
      enabled: expanded,
      ttlMs: isCurrentWeek ? STALE_TIME.SHORT : STALE_TIME.LONG,
      refetchOnWindowFocus: isCurrentWeek,
    },
  );

  const weeklyAttendance = useMemo(() => buildWeeklyAttendance(data), [data]);

  const weekRangeLabel = useMemo(
    () => formatWeekRangeLabel(weekRange, i18n.resolvedLanguage),
    [weekRange, i18n.resolvedLanguage],
  );

  const canGoToNextWeek = weekOffset < 0;

  const handlePreviousWeek = useCallback(() => {
    setWeekOffset((current) => current - 1);
  }, []);

  const handleNextWeek = useCallback(() => {
    setWeekOffset((current) => Math.min(0, current + 1));
  }, []);

  return {
    weeklyAttendance,
    weekLoading: loading && expanded,
    weekRangeLabel,
    canGoToNextWeek,
    handlePreviousWeek,
    handleNextWeek,
  };
};
