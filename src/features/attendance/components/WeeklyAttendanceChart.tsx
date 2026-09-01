import { AnimatePresence, motion } from "motion/react";
import { BarChart3, ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import CustomGroupedBarChart from "@/shared/components/custom-grouped-bar-chart";
import { arabicSource } from "@/i18n/source";
import { attendanceSeries } from "@/features/attendance/styles";
import type { WeeklyAttendanceRow } from "@/features/attendance/types";
import WeeklyAttendanceChartSkeleton from "./WeeklyAttendanceChartSkeleton";

type WeeklyAttendanceChartProps = {
  chartExpanded: boolean;
  weeklyAttendance: WeeklyAttendanceRow[];
  weekLoading: boolean;
  weekRangeLabel: string;
  canGoToNextWeek: boolean;
  onToggle: () => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
};

const WeeklyAttendanceChart = ({
  chartExpanded,
  weeklyAttendance,
  weekLoading,
  weekRangeLabel,
  canGoToNextWeek,
  onToggle,
  onPreviousWeek,
  onNextWeek,
}: WeeklyAttendanceChartProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl shadow-lg overflow-hidden"
    >
      <button onClick={onToggle} className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/10 transition-colors cursor-pointer">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-foreground" style={{ fontSize: 15 }}>{arabicSource("attendance.weekly_attendance")}</h3>
        </div>
        {chartExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {chartExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="px-5 pb-5">
            <div className="flex items-center justify-center gap-3 pb-3">
              <button
                onClick={onPreviousWeek}
                className="p-1.5 rounded-md hover:bg-muted/20 transition-colors cursor-pointer"
                aria-label={arabicSource("attendance.previous")}
              >
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <span className="text-muted-foreground" style={{ fontSize: 12 }} dir="ltr">
                {weekRangeLabel}
              </span>
              {canGoToNextWeek && (
                <button
                  onClick={onNextWeek}
                  className="p-1.5 rounded-md hover:bg-muted/20 transition-colors cursor-pointer"
                  aria-label={arabicSource("attendance.next")}
                >
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
            {weekLoading ? (
              <WeeklyAttendanceChartSkeleton />
            ) : (
              <CustomGroupedBarChart data={weeklyAttendance} categoryKey="day" series={attendanceSeries} height={180} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default WeeklyAttendanceChart;
