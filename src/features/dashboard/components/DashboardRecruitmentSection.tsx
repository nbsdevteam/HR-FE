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

type DashboardRecruitmentSectionProps = {
  data: any;
};

export const DashboardRecruitmentSection = ({ data }: DashboardRecruitmentSectionProps) => {
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
              { label: arabicSource("common.open_jobs"), value: recruitmentStats.openPositions, sub: `${jobs.length} ${arabicSource("dashboard.total")}`, icon: Briefcase, color: "text-primary" },
              { label: arabicSource("common.total_applicants"), value: recruitmentStats.totalApplicants, sub: `${recruitmentStats.avgApplicantsPerJob} ${arabicSource("dashboard.average_function")}`, icon: Users, color: "text-blue-400" },
              { label: arabicSource("dashboard.average_time_to_hire"), value: `${recruitmentStats.avgTimeToFill} ${arabicSource("common.days_2")}`, sub: arabicSource("dashboard.from_applying_for_appointment"), icon: Clock, color: recruitmentStats.avgTimeToFill > cfg.timeToFillWarningDays ? "text-amber-400" : "text-emerald-400" },
              { label: arabicSource("dashboard.offer_acceptance_rate"), value: `${recruitmentStats.offerAcceptRate}%`, sub: `${recruitmentStats.hired} ${arabicSource("dashboard.were_appointed")}`, icon: Target, color: "text-emerald-400" },
              { label: arabicSource("dashboard.talent_bank"), value: recruitmentStats.bookmarked, sub: arabicSource("dashboard.saved_filter"), icon: Heart, color: "text-purple-400" },
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
            {/* Recruitment Funnel */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
              <h3 className="text-foreground mb-4">{arabicSource("dashboard.recruitment_suppression")}</h3>
              {recruitmentPipeline.some((stage: any) => stage.value > 0) ? (
                <div className="space-y-3">
                  {recruitmentPipeline.map((stage: any, i: number) => {
                    const maxVal = Math.max(...recruitmentPipeline.map((s: any) => s.value), 1);
                    const width = Math.max(8, Math.round((stage.value / maxVal) * 100));
                    return (
                      <div key={stage.name} className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-24 flex-shrink-0">{stage.name}</span>
                        <div className="flex-1 relative">
                          <div className="h-8 rounded-lg bg-muted/20 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${width}%` }}
                              transition={{ delay: i * 0.1, duration: 0.5 }}
                              className="h-full rounded-lg flex items-center justify-end pe-2"
                              style={{ backgroundColor: stage.color + "30", borderLeft: `3px solid ${stage.color}` }}
                            >
                              <span className="text-xs font-medium text-foreground">{stage.value}</span>
                            </motion.div>
                          </div>
                        </div>
                        {i < recruitmentPipeline.length - 1 && recruitmentPipeline[i].value > 0 && (
                          <span className="text-xs text-muted-foreground w-12 text-center">
                            {pct(recruitmentPipeline[i + 1].value, recruitmentPipeline[i].value)}%
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {/* Conversion summary */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 mt-4">
                    <span className="text-sm text-muted-foreground">{arabicSource("dashboard.overall_conversion_rate")}</span>
                    <span className="text-sm font-medium text-emerald-400">
                      {recruitmentPipeline[0].value > 0 ? pct(recruitmentPipeline[recruitmentPipeline.length - 1].value, recruitmentPipeline[0].value) : 0}%
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-muted-foreground">{arabicSource("dashboard.no_employment_data")}</div>
              )}
            </motion.div>

            {/* Hiring vs Turnover Comparison */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
              <h3 className="text-foreground mb-4">{arabicSource("dashboard.hire_vs_exit")}</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <UserPlus className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-emerald-400">{newHireStats.last90}</p>
                    <p className="text-muted-foreground text-xs mt-1">{arabicSource("common.set_90_days")}</p>
                  </div>
                  <div className="text-center p-5 rounded-xl bg-red-500/10 border border-red-500/20">
                    <UserX className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-red-400">
                      {exitProcesses.filter((p: any) => p.status === "completed").length}
                    </p>
                    <p className="text-muted-foreground text-xs mt-1">{arabicSource("dashboard.exit_total")}</p>
                  </div>
                </div>

                {/* Net growth */}
                <div className="p-4 rounded-xl bg-muted/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{arabicSource("dashboard.net_growth")}</span>
                    <span className={`text-lg font-bold ${
                      newHireStats.last90 - exitProcesses.filter((p: any) => p.status === "completed").length >= 0
                        ? "text-emerald-400" : "text-red-400"
                    }`}>
                      {newHireStats.last90 - exitProcesses.filter((p: any) => p.status === "completed").length >= 0 ? "+" : ""}
                      {newHireStats.last90 - exitProcesses.filter((p: any) => p.status === "completed").length}
                    </span>
                  </div>
                </div>

                {/* Headcount Trend */}
                <div>
                  <h4 className="text-sm text-muted-foreground mb-3">{arabicSource("dashboard.headcount_trend")}</h4>
                  <CustomLineChart data={headcountTrend} color="#3B82F6" height={150} valueLabel={arabicSource("dashboard.number")} />
                </div>
              </div>
            </motion.div>
          </div>
        </>
  );
};
