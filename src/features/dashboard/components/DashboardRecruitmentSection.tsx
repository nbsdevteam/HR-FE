import { useMemo } from "react";
import { motion } from "motion/react";
import { Users, UserPlus, Clock, Briefcase, Target, UserX, Heart } from "lucide-react";
import { CustomLineChart } from "@/shared/components/custom-line-chart";
import { arabicSource } from "@/i18n/source";
import DashboardSectionStatCard from "./DashboardSectionStatCard";
import RecruitmentFunnelStageRow from "./RecruitmentFunnelStageRow";
import { pct } from "../utils/dashboardFormat";

type DashboardRecruitmentSectionProps = {
  data: any;
};

const DashboardRecruitmentSection = ({ data }: DashboardRecruitmentSectionProps) => {
  const {
    activeEmployees, inactiveEmployees, totalEmployees, attendanceStats, compensationStats, turnoverRate, newHireStats, tenureStats, approvedLeaves, cfg, riskScore,
    expiryStats, probationCount, warningStats, departmentData, colors, attendanceChartData, headcountTrend, payrollMoM, monthlyPayroll,
    pendingLeaves, activeLoans, evalStats, trainingStats, recruitmentStats, exitProcesses, notifications, unreadCount, cardCls, deptAttendance,
    tenureDistribution, dayOfWeekAttendance, leaveRequests, leaveUtilization, leaveDistribution, activeContracts, totalSalaries, avgSalary, medianSalary,
    salaryByDept, loanUtilization, totalLoanBalance, allAllowances, allDeductions, warningDistribution, evaluations, trainingPrograms, recruitmentPipeline, jobs, applicants,
  } = data;

  const recruitmentStatCards = useMemo(() => [
    { label: arabicSource("common.open_jobs"), value: recruitmentStats.openPositions, sub: `${jobs.length} ${arabicSource("dashboard.total")}`, icon: Briefcase, color: "text-primary" },
    { label: arabicSource("common.total_applicants"), value: recruitmentStats.totalApplicants, sub: `${recruitmentStats.avgApplicantsPerJob} ${arabicSource("dashboard.average_function")}`, icon: Users, color: "text-blue-400" },
    { label: arabicSource("dashboard.average_time_to_hire"), value: `${recruitmentStats.avgTimeToFill} ${arabicSource("common.days_2")}`, sub: arabicSource("dashboard.from_applying_for_appointment"), icon: Clock, color: recruitmentStats.avgTimeToFill > cfg.timeToFillWarningDays ? "text-amber-400" : "text-emerald-400" },
    { label: arabicSource("dashboard.offer_acceptance_rate"), value: `${recruitmentStats.offerAcceptRate}%`, sub: `${recruitmentStats.hired} ${arabicSource("dashboard.were_appointed")}`, icon: Target, color: "text-emerald-400" },
    { label: arabicSource("dashboard.talent_bank"), value: recruitmentStats.bookmarked, sub: arabicSource("dashboard.saved_filter"), icon: Heart, color: "text-purple-400" },
  ], [recruitmentStats, jobs, cfg]);

  const funnelStages: Array<{ stage: { name: string; value: number; color: string }; width: number; conversionPct: number | null }> = useMemo(() => {
    const maxVal = Math.max(...recruitmentPipeline.map((s: any) => s.value), 1);
    return recruitmentPipeline.map((stage: any, i: number) => ({
      stage,
      width: Math.max(8, Math.round((stage.value / maxVal) * 100)),
      conversionPct: i < recruitmentPipeline.length - 1 && stage.value > 0
        ? pct(recruitmentPipeline[i + 1].value, stage.value)
        : null,
    }));
  }, [recruitmentPipeline]);

  return (
<>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {recruitmentStatCards.map((stat, i) => (
              <DashboardSectionStatCard key={stat.label} index={i} {...stat} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recruitment Funnel */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
              <h3 className="text-foreground mb-4">{arabicSource("dashboard.recruitment_suppression")}</h3>
              {recruitmentPipeline.some((stage: any) => stage.value > 0) ? (
                <div className="space-y-3">
                  {funnelStages.map(({ stage, width, conversionPct }, i) => (
                    <RecruitmentFunnelStageRow key={stage.name} stage={stage} width={width} conversionPct={conversionPct} index={i} />
                  ))}
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

export default DashboardRecruitmentSection;
