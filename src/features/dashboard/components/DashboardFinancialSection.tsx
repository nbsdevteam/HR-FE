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
import DashboardMiniBar from "./DashboardMiniBar";
import DashboardRiskBadge from "./DashboardRiskBadge";
import DashboardStatGrid from "./DashboardStatGrid";
import DashboardTrendBadge from "./DashboardTrendBadge";
import { formatIQD, formatK, pct } from "../utils/dashboardFormat";

type DashboardFinancialSectionProps = {
  data: any;
};

const DashboardFinancialSection = ({ data }: DashboardFinancialSectionProps) => {
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
              { label: arabicSource("common.total_compensation"), value: formatIQD(compensationStats.totalCompensation), sub: `${arabicSource("dashboard.salaries_allowances")}`, icon: Wallet, color: "text-primary" },
              { label: arabicSource("dashboard.cost_per_employee"), value: formatIQD(compensationStats.costPerEmployee), sub: `${arabicSource("common.median_salary")} ${formatIQD(medianSalary)}`, icon: Coins, color: "text-emerald-400" },
              { label: arabicSource("common.total_allowances"), value: formatIQD(compensationStats.totalAllowances), sub: `${allAllowances.length} ${arabicSource("dashboard.active_allowance")}`, icon: TrendingUp, color: "text-blue-400" },
              { label: arabicSource("dashboard.loan_balance"), value: formatIQD(totalLoanBalance), sub: `${activeLoans.length} ${arabicSource("dashboard.loan")}${loanUtilization}%)`, icon: CreditCard, color: "text-amber-400" },
              { label: arabicSource("dashboard.active_exits"), value: exitProcesses.filter((p: any) => p.status !== "completed" && p.status !== "cancelled").length, sub: `${arabicSource("dashboard.end_of_service_benefits")}`, icon: UserX, color: "text-red-400" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="relative bg-card backdrop-blur-sm border border-border rounded-xl p-5 shadow-lg overflow-hidden">
                  <div className="absolute top-0 end-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <p className="text-muted-foreground" style={{ fontSize: 12 }}>{stat.label}</p>
                      <p className={`text-lg font-semibold mt-1 ${stat.color}`} dir="ltr">{stat.value}</p>
                      <p className="text-muted-foreground mt-1" style={{ fontSize: 11 }}>{stat.sub}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20"><Icon className="w-5 h-5 text-primary" /></div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-foreground">{arabicSource("common.net_monthly_salaries_thousand_iqd")}</h3>
                {payrollMoM !== 0 && <DashboardTrendBadge value={payrollMoM} suffix={arabicSource("dashboard.monthly")} inverse />}
              </div>
              {monthlyPayroll.length > 0 ? (
                <CustomLineChart data={monthlyPayroll} color={colors.primary} height={280} valueLabel={arabicSource("common.amount")} />
              ) : (
                <div className="flex items-center justify-center h-[280px] text-muted-foreground">{arabicSource("common.there_is_no_salary_data")}</div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
              <h3 className="text-foreground mb-4">{arabicSource("dashboard.cost_of_salaries_by_department_thousand_iqd")}</h3>
              {salaryByDept.length > 0 ? (
                <CustomBarChart data={salaryByDept} color="#22C55E" height={280} barLabel={arabicSource("dashboard.cost")} />
              ) : (
                <div className="flex items-center justify-center h-[280px] text-muted-foreground">{arabicSource("common.no_data")}</div>
              )}
            </motion.div>
          </div>

          {/* Compensation Breakdown + Loan Portfolio */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compensation breakdown */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
              <h3 className="text-foreground mb-4">{arabicSource("dashboard.compensation_analysis")}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <span className="text-sm text-muted-foreground">{arabicSource("common.total_basic_salaries")}</span>
                  <span className="text-sm font-medium text-primary" dir="ltr">{formatIQD(totalSalaries)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <span className="text-sm text-muted-foreground">{arabicSource("common.total_allowances")}</span>
                  <span className="text-sm font-medium text-emerald-400" dir="ltr">{formatIQD(compensationStats.totalAllowances)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <span className="text-sm text-muted-foreground">{arabicSource("common.total_deductions")}</span>
                  <span className="text-sm font-medium text-red-400" dir="ltr">{formatIQD(compensationStats.totalDeductions)}</span>
                </div>
                <div className="border-t border-border/40 pt-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <span className="text-sm font-medium text-foreground">{arabicSource("dashboard.net_compensation")}</span>
                    <span className="text-sm font-bold text-primary" dir="ltr">{formatIQD(compensationStats.totalCompensation - compensationStats.totalDeductions)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="p-3 rounded-lg bg-muted/20 text-center">
                    <p className="text-xs text-muted-foreground">{arabicSource("dashboard.average_salary")}</p>
                    <p className="text-sm font-medium text-primary" dir="ltr">{formatIQD(avgSalary)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/20 text-center">
                    <p className="text-xs text-muted-foreground">{arabicSource("common.median_salary")}</p>
                    <p className="text-sm font-medium text-blue-400" dir="ltr">{formatIQD(medianSalary)}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Loan Portfolio */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
              <h3 className="text-foreground mb-4">{arabicSource("dashboard.loan_portfolio")}</h3>
              {activeLoans.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">{arabicSource("dashboard.there_are_no_active_loans")}</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <p className="text-2xl font-semibold text-blue-400">{activeLoans.length}</p>
                      <p className="text-muted-foreground text-xs mt-1">{arabicSource("common.active_loans")}</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-primary/10 border border-primary/20">
                      <p className="text-lg font-semibold text-primary" dir="ltr">{formatIQD(activeLoans.reduce((s: number, l: any) => s + (l.loan_amount || 0), 0))}</p>
                      <p className="text-muted-foreground text-xs mt-1">{arabicSource("dashboard.total_loans")}</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/20">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">{arabicSource("dashboard.payment_ratio")}</span>
                      <span className="text-emerald-400 font-medium">{pct(activeLoans.reduce((s: number, l: any) => s + (l.loan_amount || 0), 0) - totalLoanBalance, activeLoans.reduce((s: number, l: any) => s + (l.loan_amount || 0), 0))}%</span>
                    </div>
                    <DashboardMiniBar value={activeLoans.reduce((s: number, l: any) => s + (l.loan_amount || 0), 0) - totalLoanBalance} max={activeLoans.reduce((s: number, l: any) => s + (l.loan_amount || 0), 0)} color="bg-emerald-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-lg font-semibold text-emerald-400" dir="ltr">{formatIQD(activeLoans.reduce((s: number, l: any) => s + (l.loan_amount || 0), 0) - totalLoanBalance)}</p>
                      <p className="text-muted-foreground text-xs mt-1">{arabicSource("dashboard.the_payer")}</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <p className="text-lg font-semibold text-amber-400" dir="ltr">{formatIQD(totalLoanBalance)}</p>
                      <p className="text-muted-foreground text-xs mt-1">{arabicSource("dashboard.remaining")}</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/20">
                    <p className="text-xs text-muted-foreground">{arabicSource("dashboard.percentage_of_employees_who_borrow")}</p>
                    <p className="text-sm font-medium text-blue-400">{loanUtilization}{arabicSource("dashboard.of_total_employees")}</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </>
  );
};

export default DashboardFinancialSection;
