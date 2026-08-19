import { useMemo } from "react";
import { motion } from "motion/react";
import { AlertTriangle, GraduationCap, FileCheck, Shield, Award, Zap } from "lucide-react";
import { DonutChart } from "@/shared/components/donut-chart";
import ColorStatTile from "@/shared/components/ColorStatTile";
import { arabicSource } from "@/i18n/source";
import DashboardMiniBar from "./DashboardMiniBar";
import DashboardSectionStatCard from "./DashboardSectionStatCard";
import DashboardRatingLevelBar from "./DashboardRatingLevelBar";
import { pct } from "../utils/dashboardFormat";

type DashboardComplianceSectionProps = {
  data: any;
};

const DashboardComplianceSection = ({ data }: DashboardComplianceSectionProps) => {
  const {
    activeEmployees, inactiveEmployees, totalEmployees, attendanceStats, compensationStats, turnoverRate, newHireStats, tenureStats, approvedLeaves, cfg, riskScore,
    expiryStats, probationCount, warningStats, departmentData, colors, attendanceChartData, headcountTrend, payrollMoM, monthlyPayroll,
    pendingLeaves, activeLoans, evalStats, trainingStats, recruitmentStats, exitProcesses, notifications, unreadCount, cardCls, deptAttendance,
    tenureDistribution, dayOfWeekAttendance, leaveRequests, leaveUtilization, leaveDistribution, activeContracts, totalSalaries, avgSalary, medianSalary,
    salaryByDept, loanUtilization, totalLoanBalance, allAllowances, allDeductions, warningDistribution, evaluations, trainingPrograms, recruitmentPipeline, jobs, applicants,
  } = data;

  const complianceStats = useMemo(() => [
    { label: arabicSource("dashboard.average_performance_rating"), value: `${evalStats.avgRating}/5`, sub: `${arabicSource("common.cover")} ${evalStats.coverageRate}${arabicSource("common.of_employees")}`, icon: Award, color: evalStats.avgRating >= cfg.performanceGoodThreshold ? "text-emerald-400" : "text-amber-400" },
    { label: arabicSource("common.active_alarms"), value: warningStats.active, sub: `${warningStats.escalationRisk} ${arabicSource("common.risk_of_escalation")}`, icon: AlertTriangle, color: warningStats.active > 0 ? "text-orange-400" : "text-emerald-400" },
    { label: arabicSource("dashboard.completion_of_training"), value: `${trainingStats.completionRate}%`, sub: `${arabicSource("common.cover")} ${trainingStats.coverageRate}${arabicSource("common.of_employees")}`, icon: GraduationCap, color: trainingStats.completionRate >= cfg.trainingCompletionTarget ? "text-emerald-400" : "text-amber-400" },
    { label: arabicSource("dashboard.expired_nearly_documents"), value: expiryStats.expiredDocs + expiryStats.expiringDocs, sub: `${expiryStats.expiredDocs} ${arabicSource("dashboard.finished")} ${expiryStats.expiringDocs} ${arabicSource("dashboard.close")}`, icon: FileCheck, color: expiryStats.expiredDocs > 0 ? "text-red-400" : "text-amber-400" },
    { label: arabicSource("dashboard.high_performance_rate"), value: `${pct(evalStats.high, evalStats.completed)}%`, sub: `${evalStats.high} ${arabicSource("common.from")} ${evalStats.completed} ${arabicSource("dashboard.evaluator")}`, icon: Zap, color: "text-purple-400" },
  ], [evalStats, cfg, warningStats, trainingStats, expiryStats]);

  const ratingLevels = useMemo(() => [
    { label: arabicSource("dashboard.featured_5"), count: evaluations.filter((e: any) => e.status === arabicSource("common.complete") && e.overall_rating === 5).length, color: "bg-emerald-500" },
    { label: arabicSource("dashboard.exceeding_expectations_4"), count: evaluations.filter((e: any) => e.status === arabicSource("common.complete") && e.overall_rating === 4).length, color: "bg-blue-500" },
    { label: arabicSource("dashboard.within_expected_3"), count: evaluations.filter((e: any) => e.status === arabicSource("common.complete") && e.overall_rating === 3).length, color: "bg-primary" },
    { label: arabicSource("dashboard.below_expectations_2"), count: evaluations.filter((e: any) => e.status === arabicSource("common.complete") && e.overall_rating === 2).length, color: "bg-amber-500" },
    { label: arabicSource("dashboard.not_achieved_1"), count: evaluations.filter((e: any) => e.status === arabicSource("common.complete") && e.overall_rating === 1).length, color: "bg-red-500" },
  ], [evaluations]);

  const trainingTiles = useMemo(() => [
    { value: trainingStats.totalPrograms, label: arabicSource("common.total_programs"), colorClassName: "bg-primary/10 border border-primary/20", textColorClassName: "text-primary" },
    { value: trainingStats.ongoing, label: arabicSource("dashboard.now_underway"), colorClassName: "bg-blue-500/10 border border-blue-500/20", textColorClassName: "text-blue-400" },
    { value: trainingStats.completed, label: arabicSource("common.complete_2"), colorClassName: "bg-emerald-500/10 border border-emerald-500/20", textColorClassName: "text-emerald-400" },
    { value: trainingStats.uniqueTrainees, label: arabicSource("dashboard.unique_trainee"), colorClassName: "bg-amber-500/10 border border-amber-500/20", textColorClassName: "text-amber-400" },
    { value: `${trainingStats.completionRate}%`, label: arabicSource("dashboard.completion_rate"), colorClassName: "bg-purple-500/10 border border-purple-500/20", textColorClassName: "text-purple-400" },
    { value: trainingStats.avgScore || "—", label: arabicSource("dashboard.average_score"), colorClassName: "bg-cyan-500/10 border border-cyan-500/20", textColorClassName: "text-cyan-400" },
  ], [trainingStats]);

  return (
<>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {complianceStats.map((stat, i) => (
              <DashboardSectionStatCard key={stat.label} index={i} {...stat} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Distribution */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
              <h3 className="text-foreground mb-4">{arabicSource("dashboard.performance_evaluation_distribution")}</h3>
              {evalStats.completed > 0 ? (
                <div className="space-y-4">
                  {ratingLevels.map(level => (
                    <DashboardRatingLevelBar
                      key={level.label}
                      label={level.label}
                      count={level.count}
                      color={level.color}
                      percent={pct(level.count, evalStats.completed)}
                    />
                  ))}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10">
                      <span className="text-sm text-muted-foreground">{arabicSource("dashboard.high_performance_4")}</span>
                      <span className="text-sm font-medium text-emerald-400">{pct(evalStats.high, evalStats.completed)}%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                      <span className="text-sm text-muted-foreground">{arabicSource("dashboard.needs_development_2")}</span>
                      <span className="text-sm font-medium text-red-400">{pct(evalStats.low, evalStats.completed)}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-muted-foreground">{arabicSource("dashboard.there_are_no_completed_reviews")}</div>
              )}
            </motion.div>

            {/* Warning Distribution */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
              <h3 className="text-foreground mb-4">{arabicSource("dashboard.alarms_by_type")}</h3>
              {warningDistribution.length > 0 ? (
                <>
                  <div className="flex items-center justify-center" style={{ height: 220 }}>
                    <DonutChart data={warningDistribution} />
                  </div>
                  {warningStats.escalationRisk > 0 && (
                    <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 text-sm">{warningStats.escalationRisk} {arabicSource("dashboard.employee_with_multiple_alarms_escalation_risk")}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-[280px]">
                  <Shield className="w-12 h-12 text-emerald-400/30 mb-3" />
                  <p className="text-emerald-400 text-sm">{arabicSource("dashboard.no_active_alarms")}</p>
                  <p className="text-muted-foreground text-xs mt-1">{arabicSource("dashboard.excellent_work_environment")}</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Training Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
            <h3 className="text-foreground mb-4">{arabicSource("dashboard.summary_of_training_and_development")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              {trainingTiles.map(tile => (
                <ColorStatTile key={tile.label} {...tile} />
              ))}
            </div>
            {/* Coverage bar */}
            <div className="mt-4 p-3 rounded-lg bg-muted/20">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">{arabicSource("dashboard.training_coverage_percentage_of_employees_participating")}</span>
                <span className="text-primary font-medium">{trainingStats.coverageRate}%</span>
              </div>
              <DashboardMiniBar value={trainingStats.coverageRate} max={100} color={trainingStats.coverageRate >= cfg.trainingCompletionTarget ? "bg-emerald-500" : "bg-amber-500"} />
            </div>
          </motion.div>
        </>
  );
};

export default DashboardComplianceSection;
