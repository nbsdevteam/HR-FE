import { motion } from "motion/react";
import {
  Users, CalendarDays, Wallet, ClipboardCheck, AlertTriangle, UserPlus, Clock, GraduationCap, TrendingUp, TrendingDown,
  Briefcase, FileCheck, CreditCard, Bell, Shield, Award, Target, Activity, Percent, Coins, FileText, UserX,
  Zap, Heart, Building2, PieChart, Gauge, Eye,
} from "lucide-react";
import { DonutChart } from "@/shared/components/donut-chart";
import { CustomBarChart } from "@/shared/components/custom-bar-chart";
import { CustomLineChart } from "@/shared/components/custom-line-chart";
import { formatDateTime } from "@/i18n/format";
import { arabicSource } from "@/i18n/source";
import { normalizeLeaveStatus } from "@/i18n/status";
import { DashboardMiniBar } from "./DashboardMiniBar";
import { DashboardRiskBadge } from "./DashboardRiskBadge";
import { DashboardStatGrid } from "./DashboardStatGrid";
import { DashboardTrendBadge } from "./DashboardTrendBadge";
import { formatIQD, formatK, pct } from "../utils/dashboardFormat";

type DashboardComplianceSectionProps = {
  data: any;
};

export const DashboardComplianceSection = ({ data }: DashboardComplianceSectionProps) => {
  const {
    activeEmployees, inactiveEmployees, totalEmployees, attendanceStats, compensationStats, turnoverRate, newHireStats, tenureStats, approvedLeaves, cfg, riskScore,
    expiryStats, probationCount, warningStats, departmentData, colors, attendanceChartData, headcountTrend, payrollMoM, monthlyPayroll,
    pendingLeaves, activeLoans, evalStats, trainingStats, recruitmentStats, exitProcesses, notifications, unreadCount, cardCls, deptAttendance,
    tenureDistribution, dayOfWeekAttendance, leaveRequests, leaveUtilization, leaveDistribution, activeContracts, totalSalaries, avgSalary, medianSalary,
    salaryByDept, loanUtilization, totalLoanBalance, allAllowances, allDeductions, warningDistribution, evaluations, trainingPrograms, recruitmentPipeline, jobs, applicants,
  } = data;

  return (
<>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: arabicSource("dashboard.average_performance_rating"), value: `${evalStats.avgRating}/5`, sub: `${arabicSource("common.cover")} ${evalStats.coverageRate}${arabicSource("common.of_employees")}`, icon: Award, color: evalStats.avgRating >= cfg.performanceGoodThreshold ? "text-emerald-400" : "text-amber-400" },
              { label: arabicSource("common.active_alarms"), value: warningStats.active, sub: `${warningStats.escalationRisk} ${arabicSource("common.risk_of_escalation")}`, icon: AlertTriangle, color: warningStats.active > 0 ? "text-orange-400" : "text-emerald-400" },
              { label: arabicSource("dashboard.completion_of_training"), value: `${trainingStats.completionRate}%`, sub: `${arabicSource("common.cover")} ${trainingStats.coverageRate}${arabicSource("common.of_employees")}`, icon: GraduationCap, color: trainingStats.completionRate >= cfg.trainingCompletionTarget ? "text-emerald-400" : "text-amber-400" },
              { label: arabicSource("dashboard.expired_nearly_documents"), value: expiryStats.expiredDocs + expiryStats.expiringDocs, sub: `${expiryStats.expiredDocs} ${arabicSource("dashboard.finished")} ${expiryStats.expiringDocs} ${arabicSource("dashboard.close")}`, icon: FileCheck, color: expiryStats.expiredDocs > 0 ? "text-red-400" : "text-amber-400" },
              { label: arabicSource("dashboard.high_performance_rate"), value: `${pct(evalStats.high, evalStats.completed)}%`, sub: `${evalStats.high} ${arabicSource("common.from")} ${evalStats.completed} ${arabicSource("dashboard.evaluator")}`, icon: Zap, color: "text-purple-400" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="relative bg-card backdrop-blur-sm border border-border rounded-xl p-5 shadow-lg overflow-hidden">
                  <div className="absolute top-0 end-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <p className="text-muted-foreground" style={{ fontSize: 12 }}>{stat.label}</p>
                      <p className={`text-2xl font-semibold mt-1 ${stat.color}`}>{stat.value}</p>
                      <p className="text-muted-foreground mt-1" style={{ fontSize: 11 }}>{stat.sub}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20"><Icon className="w-5 h-5 text-primary" /></div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Distribution */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
              <h3 className="text-foreground mb-4">{arabicSource("dashboard.performance_evaluation_distribution")}</h3>
              {evalStats.completed > 0 ? (
                <div className="space-y-4">
                  {[
                    { label: arabicSource("dashboard.featured_5"), count: evaluations.filter((e: any) => e.status === arabicSource("common.complete") && e.overall_rating === 5).length, color: "bg-emerald-500" },
                    { label: arabicSource("dashboard.exceeding_expectations_4"), count: evaluations.filter((e: any) => e.status === arabicSource("common.complete") && e.overall_rating === 4).length, color: "bg-blue-500" },
                    { label: arabicSource("dashboard.within_expected_3"), count: evaluations.filter((e: any) => e.status === arabicSource("common.complete") && e.overall_rating === 3).length, color: "bg-primary" },
                    { label: arabicSource("dashboard.below_expectations_2"), count: evaluations.filter((e: any) => e.status === arabicSource("common.complete") && e.overall_rating === 2).length, color: "bg-amber-500" },
                    { label: arabicSource("dashboard.not_achieved_1"), count: evaluations.filter((e: any) => e.status === arabicSource("common.complete") && e.overall_rating === 1).length, color: "bg-red-500" },
                  ].map(level => (
                    <div key={level.label} className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-32 flex-shrink-0">{level.label}</span>
                      <div className="flex-1 h-6 rounded-full bg-muted/20 overflow-hidden">
                        <div className={`h-full ${level.color} rounded-full transition-all`} style={{ width: `${pct(level.count, evalStats.completed)}%` }} />
                      </div>
                      <span className="text-sm text-foreground w-8 text-center">{level.count}</span>
                    </div>
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
              <div className="text-center p-4 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-2xl font-semibold text-primary">{trainingStats.totalPrograms}</p>
                <p className="text-muted-foreground text-xs mt-1">{arabicSource("common.total_programs")}</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <p className="text-2xl font-semibold text-blue-400">{trainingStats.ongoing}</p>
                <p className="text-muted-foreground text-xs mt-1">{arabicSource("dashboard.now_underway")}</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-2xl font-semibold text-emerald-400">{trainingStats.completed}</p>
                <p className="text-muted-foreground text-xs mt-1">{arabicSource("common.complete_2")}</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-2xl font-semibold text-amber-400">{trainingStats.uniqueTrainees}</p>
                <p className="text-muted-foreground text-xs mt-1">{arabicSource("dashboard.unique_trainee")}</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <p className="text-2xl font-semibold text-purple-400">{trainingStats.completionRate}%</p>
                <p className="text-muted-foreground text-xs mt-1">{arabicSource("dashboard.completion_rate")}</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <p className="text-2xl font-semibold text-cyan-400">{trainingStats.avgScore || "—"}</p>
                <p className="text-muted-foreground text-xs mt-1">{arabicSource("dashboard.average_score")}</p>
              </div>
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
