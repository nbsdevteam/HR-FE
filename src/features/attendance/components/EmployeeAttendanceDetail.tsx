import { motion, AnimatePresence } from "motion/react";
import { CalendarDays, BarChart3, TrendingUp, Loader2 } from "lucide-react";
import type { DbEmployee } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { ModalOverlay } from "@/shared/components";
import { useEmployeeAttendanceDetail, type DetailTabId } from "../hooks/useEmployeeAttendanceDetail";
import AttendanceCalendarView from "./AttendanceCalendarView";
import AttendanceDetailTabButton from "./AttendanceDetailTabButton";
import EmployeeAttendanceDetailHeader from "./EmployeeAttendanceDetailHeader";
import MonthlySummaryView from "./MonthlySummaryView";
import OverallSummaryView from "./OverallSummaryView";

export const DETAIL_TABS = [
  {
    id: "calendar" as const,
    label: arabicSource("common.calendar"),
    icon: CalendarDays,
  },
  {
    id: "monthly" as const,
    label: arabicSource("attendance.monthly_summary"),
    icon: BarChart3,
  },
  {
    id: "overall" as const,
    label: arabicSource("attendance.overall_summary"),
    icon: TrendingUp,
  },
] satisfies { id: DetailTabId; label: string; icon: unknown }[];

const EmployeeAttendanceDetail = ({
  employeeId,
  employees,
  empMap,
  dbShifts,
  dbDepartments,
  onClose,
}: {
  employeeId: string;
  employees: DbEmployee[];
  empMap: Record<
    string,
    {
      name: string;
      dept: string;
      deviceNo: string;
      photo: string | null;
      position: string | null;
    }
  >;
  dbShifts: any[];
  dbDepartments: any[];
  onClose: () => void;
}) => {
  const {
    activeTab,
    setActiveTab,
    loading,
    calMonth,
    emp,
    empSchedule,
    empInfo,
    monthRecords,
    monthLabel,
    monthStats,
    overallStats,
    monthlyBreakdown,
    prevMonth,
    nextMonth,
  } = useEmployeeAttendanceDetail({
    employeeId,
    employees,
    empMap,
    dbShifts,
    dbDepartments,
  });

  return (
    <ModalOverlay
      onClose={onClose}
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      contentClassName="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      contentMotionProps={{
        initial: { opacity: 0, scale: 0.95, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: 20 },
      }}
    >
      <EmployeeAttendanceDetailHeader empInfo={empInfo} emp={emp} onClose={onClose} />

      {/* Tabs */}
      <div className="flex gap-1 p-2 bg-card/30 border-b border-border/20">
        {DETAIL_TABS.map((tab) => (
          <AttendanceDetailTabButton
            key={tab.id}
            tab={tab}
            active={activeTab === tab.id}
            onClick={setActiveTab}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <span className="text-muted-foreground ms-3">
              {arabicSource("attendance.loading_data")}
            </span>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === "calendar" && (
              <motion.div
                key="cal"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <AttendanceCalendarView
                  records={monthRecords}
                  calMonth={calMonth}
                  monthLabel={monthLabel}
                  onPrev={prevMonth}
                  onNext={nextMonth}
                  stats={monthStats}
                  schedule={empSchedule}
                />
              </motion.div>
            )}

            {activeTab === "monthly" && (
              <motion.div
                key="monthly"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <MonthlySummaryView
                  stats={monthStats}
                  monthLabel={monthLabel}
                  records={monthRecords}
                  onPrev={prevMonth}
                  onNext={nextMonth}
                />
              </motion.div>
            )}
            {activeTab === "overall" && (
              <motion.div
                key="overall"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <OverallSummaryView
                  stats={overallStats}
                  breakdown={monthlyBreakdown}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </ModalOverlay>
  );
};

export default EmployeeAttendanceDetail;
