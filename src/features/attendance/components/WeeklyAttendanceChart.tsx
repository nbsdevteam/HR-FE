import { AnimatePresence, motion } from "motion/react";
import { BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import CustomGroupedBarChart from "@/shared/components/custom-grouped-bar-chart";
import { arabicSource } from "@/i18n/source";
import { attendanceSeries } from "@/features/attendance/styles";

type WeeklyRow = { day: string; present: number; late: number; absent: number; leave: number };

const WeeklyAttendanceChart = ({ chartExpanded, weeklyAttendance, onToggle }: { chartExpanded: boolean; weeklyAttendance: WeeklyRow[]; onToggle: () => void }) => {
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
            <CustomGroupedBarChart data={weeklyAttendance} categoryKey="day" series={attendanceSeries} height={180} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default WeeklyAttendanceChart;
