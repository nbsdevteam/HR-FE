import { useMemo } from "react";
import { motion } from "motion/react";
import { Clock, ClipboardCheck, Target, Briefcase, CalendarDays } from "lucide-react";
import { DonutChart } from "@/shared/components/donut-chart";
import { CustomBarChart } from "@/shared/components/custom-bar-chart";
import ColorStatTile from "@/shared/components/ColorStatTile";
import { arabicSource } from "@/i18n/source";
import { normalizeLeaveStatus } from "@/i18n/status";
import DashboardMiniBar from "./DashboardMiniBar";
import DashboardStatGrid from "./DashboardStatGrid";

type DashboardWorkforceSectionProps = {
  data: any;
};

const DashboardWorkforceSection = ({ data }: DashboardWorkforceSectionProps) => {
  const {
    attendanceStats, turnoverRate, newHireStats, tenureStats, approvedLeaves,
    probationCount, pendingLeaves, exitProcesses, cardCls, deptAttendance,
    tenureDistribution, dayOfWeekAttendance, leaveRequests, leaveUtilization, activeContracts,
  } = data;

  const turnoverTiles = useMemo(() => [
    { value: newHireStats.last30, label: arabicSource("dashboard.set_30_days"), colorClassName: "bg-emerald-500/10 border border-emerald-500/20", textColorClassName: "text-emerald-400" },
    { value: newHireStats.last90, label: arabicSource("common.set_90_days"), colorClassName: "bg-blue-500/10 border border-blue-500/20", textColorClassName: "text-blue-400" },
    { value: `${newHireStats.rate}%`, label: arabicSource("dashboard.assignment_rate"), colorClassName: "bg-primary/10 border border-primary/20", textColorClassName: "text-primary" },
    { value: `${turnoverRate}%`, label: arabicSource("common.turnover_rate_annual"), colorClassName: "bg-amber-500/10 border border-amber-500/20", textColorClassName: "text-amber-400" },
    { value: exitProcesses.filter((p: any) => p.status !== "completed" && p.status !== "cancelled").length, label: arabicSource("dashboard.exits_in_progress"), colorClassName: "bg-purple-500/10 border border-purple-500/20", textColorClassName: "text-purple-400" },
  ], [newHireStats, turnoverRate, exitProcesses]);

  return (
<>
          <DashboardStatGrid
            stats={[
              { label: arabicSource("dashboard.average_service_life"), value: `${tenureStats.avg} ${arabicSource("common.years")}`, sub: `${arabicSource("dashboard.mediator")} ${tenureStats.median} ${arabicSource("common.years")}`, icon: Clock },
              { label: arabicSource("dashboard.attendance_30_days"), value: `${attendanceStats.rolling30Rate}%`, sub: `${arabicSource("dashboard.absenteeism")} ${attendanceStats.absenteeismRate}%`, icon: ClipboardCheck },
              { label: arabicSource("dashboard.discipline_ratio"), value: `${attendanceStats.punctualityRate}%`, sub: `${attendanceStats.late} ${arabicSource("dashboard.late_today")}`, icon: Target },
              { label: arabicSource("common.active_contracts"), value: activeContracts, sub: `${probationCount} ${arabicSource("dashboard.in_the_experiment")}`, icon: Briefcase },
              { label: arabicSource("common.use_of_vacations"), value: `${leaveUtilization.rate}%`, sub: `${leaveUtilization.totalUsed} ${arabicSource("common.from")} ${leaveUtilization.totalEntitled} ${arabicSource("common.days_2")}`, icon: CalendarDays },
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tenure Distribution */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
              <h3 className="text-foreground mb-4">{arabicSource("dashboard.distribution_of_service_period")}</h3>
              <div className="flex items-center justify-center" style={{ height: 280 }}>
                <DonutChart data={tenureDistribution} />
              </div>
            </motion.div>

            {/* Attendance by Department */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
              <h3 className="text-foreground mb-4">{arabicSource("dashboard.attendance_percentage_by_department_7_days")}</h3>
              {deptAttendance.length > 0 ? (
                <CustomBarChart data={deptAttendance} color="#22C55E" height={280} barLabel={arabicSource("common.attendance_rate")} />
              ) : (
                <div className="flex items-center justify-center h-[280px] text-muted-foreground">{arabicSource("common.no_data")}</div>
              )}
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Day of Week Pattern */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`lg:col-span-2 ${cardCls}`}>
              <h3 className="text-foreground mb-4">{arabicSource("dashboard.attendance_pattern_by_day")}</h3>
              <CustomBarChart data={dayOfWeekAttendance} color="#3B82F6" height={250} barLabel={arabicSource("common.attendance_rate")} />
            </motion.div>

            {/* Leave Summary */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
              <h3 className="text-foreground mb-4">{arabicSource("common.vacation_summary")}</h3>
              <div className="space-y-3">
                <div className="text-center p-4 rounded-lg bg-muted/20">
                  <p className="text-3xl font-semibold text-primary">{leaveRequests.length}</p>
                  <p className="text-muted-foreground text-xs mt-1">{arabicSource("dashboard.total_orders")}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 rounded-lg bg-amber-500/10"><p className="text-amber-400 font-medium">{pendingLeaves}</p><p className="text-muted-foreground text-xs">{arabicSource("common.pending_2")}</p></div>
                  <div className="text-center p-2 rounded-lg bg-emerald-500/10"><p className="text-emerald-400 font-medium">{approvedLeaves}</p><p className="text-muted-foreground text-xs">{arabicSource("dashboard.accepted")}</p></div>
                  <div className="text-center p-2 rounded-lg bg-red-500/10"><p className="text-red-400 font-medium">{leaveRequests.filter((r: any) => normalizeLeaveStatus(r.status) === arabicSource("common.rejected_3")).length}</p><p className="text-muted-foreground text-xs">{arabicSource("common.rejected")}</p></div>
                </div>
                <div className="p-3 rounded-lg bg-muted/20">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">{arabicSource("common.use_of_vacations")}</span>
                    <span className="text-primary font-medium">{leaveUtilization.rate}%</span>
                  </div>
                  <DashboardMiniBar value={leaveUtilization.rate} max={100} color="bg-primary" />
                  <p className="text-muted-foreground text-xs mt-1">{arabicSource("common.average")} {leaveUtilization.avgUsed} {arabicSource("dashboard.day_employee")}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* New Hires + Turnover Summary */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
            <h3 className="text-foreground mb-4">{arabicSource("dashboard.appointments_and_job_turnover")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {turnoverTiles.map(tile => (
                <ColorStatTile key={tile.label} {...tile} />
              ))}
            </div>
          </motion.div>
        </>
  );
};

export default DashboardWorkforceSection;
