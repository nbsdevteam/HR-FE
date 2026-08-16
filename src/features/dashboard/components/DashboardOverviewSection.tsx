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

type DashboardOverviewSectionProps = {
  data: any;
};

export const DashboardOverviewSection = ({ data }: DashboardOverviewSectionProps) => {
  const {
    activeEmployees, inactiveEmployees, totalEmployees, attendanceStats, compensationStats, turnoverRate, newHireStats, tenureStats, approvedLeaves, cfg, riskScore,
    expiryStats, probationCount, warningStats, departmentData, colors, attendanceChartData, headcountTrend, payrollMoM, monthlyPayroll,
    pendingLeaves, activeLoans, evalStats, trainingStats, recruitmentStats, exitProcesses, notifications, unreadCount, cardCls, deptAttendance,
    tenureDistribution, dayOfWeekAttendance, leaveRequests, leaveUtilization, leaveDistribution, activeContracts, totalSalaries, avgSalary, medianSalary,
    salaryByDept, loanUtilization, totalLoanBalance, allAllowances, allDeductions, warningDistribution, evaluations, trainingPrograms, recruitmentPipeline, jobs, applicants,
  } = data;

  return (
<>
          {/* Top-level KPI Cards */}
          <DashboardStatGrid
            hoverLift
            compactValue
            stats={[
              { label: arabicSource("common.total_employees"), value: totalEmployees, sub: `${activeEmployees} ${arabicSource("dashboard.active")} ${inactiveEmployees} ${arabicSource("common.is_inactive")}`, icon: Users, color: "text-primary" },
              { label: arabicSource("dashboard.attendance_7_days"), value: `${attendanceStats.rolling7Rate}%`, sub: `${arabicSource("common.today")} ${attendanceStats.attendanceRate}%`, icon: ClipboardCheck, color: "text-emerald-400", trend: attendanceStats.attendanceTrend },
              { label: arabicSource("common.total_compensation"), value: formatIQD(compensationStats.totalCompensation), sub: `${arabicSource("dashboard.cost_employee")} ${formatIQD(compensationStats.costPerEmployee)}`, icon: Wallet, color: "text-blue-400" },
              { label: arabicSource("common.turnover_rate_annual"), value: `${turnoverRate}%`, sub: `${newHireStats.last30} ${arabicSource("dashboard.new_appointment_30_days")}`, icon: Activity, color: turnoverRate > cfg.turnoverWarning ? "text-red-400" : "text-emerald-400" },
              { label: arabicSource("dashboard.risk_level"), value: `${riskScore.score}/100`, sub: `${riskScore.items.length} ${arabicSource("dashboard.risk_factors")}`, icon: Shield, color: riskScore.level === "low" ? "text-emerald-400" : riskScore.level === "medium" ? "text-amber-400" : "text-red-400" },
            ]}
          />

          {/* Alert Banners */}
          {(expiryStats.expiringDocs > 0 || expiryStats.expiredDocs > 0 || expiryStats.expiringContracts > 0 || probationCount > 0 || warningStats.active > 0 || warningStats.escalationRisk > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
              {expiryStats.expiredDocs > 0 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                  <FileCheck className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-xs font-medium">{expiryStats.expiredDocs} {arabicSource("common.finished_document")}</p>
                </motion.div>
              )}
              {expiryStats.expiringDocs > 0 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <FileCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <p className="text-amber-400 text-xs font-medium">{expiryStats.expiringDocs} {arabicSource("common.document_nearing_completion")}</p>
                </motion.div>
              )}
              {expiryStats.expiringContracts > 0 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                  <Briefcase className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-xs font-medium">{expiryStats.expiringContracts} {arabicSource("common.contract_soon_to_expire")}</p>
                </motion.div>
              )}
              {probationCount > 0 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
                  <Shield className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <p className="text-blue-400 text-xs font-medium">{probationCount} {arabicSource("dashboard.is_in_a_trial_period")}</p>
                </motion.div>
              )}
              {warningStats.active > 0 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/30">
                  <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <p className="text-orange-400 text-xs font-medium">{warningStats.active} {arabicSource("common.alarm_active")}</p>
                </motion.div>
              )}
              {warningStats.escalationRisk > 0 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                  <Zap className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-xs font-medium">{warningStats.escalationRisk} {arabicSource("common.risk_of_escalation")}</p>
                </motion.div>
              )}
            </div>
          )}

          {/* Charts Row 1: Department + Attendance Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={cardCls}>
              <h3 className="text-foreground mb-4">{arabicSource("dashboard.distribution_of_employees_according_to_departments")}</h3>
              <CustomBarChart data={departmentData} color={colors.primary} height={280} barLabel={arabicSource("common.number_of_employees")} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className={cardCls}>
              <h3 className="text-foreground mb-4">{arabicSource("common.attendance_status")} {attendanceStats.date ? `(${attendanceStats.date})` : arabicSource("common.today")}</h3>
              <div className="flex items-center justify-center" style={{ height: 240 }}>
                <DonutChart data={attendanceChartData} />
              </div>
              {/* Attendance sub-metrics */}
              <div className="grid grid-cols-4 gap-2 mt-4">
                <div className="text-center p-2 rounded-lg bg-muted/20">
                  <p className="text-xs text-muted-foreground">{arabicSource("dashboard.7_days")}</p>
                  <p className="text-sm font-medium text-emerald-400">{attendanceStats.rolling7Rate}%</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/20">
                  <p className="text-xs text-muted-foreground">{arabicSource("dashboard.30_days")}</p>
                  <p className="text-sm font-medium text-blue-400">{attendanceStats.rolling30Rate}%</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/20">
                  <p className="text-xs text-muted-foreground">{arabicSource("dashboard.discipline")}</p>
                  <p className="text-sm font-medium text-primary">{attendanceStats.punctualityRate}%</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/20">
                  <p className="text-xs text-muted-foreground">{arabicSource("common.fingerprint_device")}</p>
                  <p className="text-sm font-medium text-cyan-400">{attendanceStats.deviceCoverage}%</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Charts Row 2: Headcount Trend + Payroll Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className={cardCls}>
              <h3 className="text-foreground mb-4">{arabicSource("dashboard.headcount_trend_12_months")}</h3>
              <CustomLineChart data={headcountTrend} color="#3B82F6" height={250} valueLabel={arabicSource("common.number_of_employees")} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className={cardCls}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-foreground">{arabicSource("common.net_monthly_salaries_thousand_iqd")}</h3>
                {payrollMoM !== 0 && <DashboardTrendBadge value={payrollMoM} suffix="%" inverse />}
              </div>
              {monthlyPayroll.length > 0 ? (
                <CustomLineChart data={monthlyPayroll} color={colors.primary} height={250} valueLabel={arabicSource("common.amount")} />
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">{arabicSource("common.there_is_no_salary_data")}</div>
              )}
            </motion.div>
          </div>

          {/* Charts Row 3: Quick KPIs + Risk Scorecard + Notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className={cardCls}>
              <h3 className="text-foreground mb-4">{arabicSource("dashboard.quick_indicators")}</h3>
              <div className="space-y-3">
                {[
                  { label: arabicSource("dashboard.vacations_pending"), value: pendingLeaves, icon: CalendarDays, color: "text-amber-400" },
                  { label: arabicSource("common.active_loans"), value: activeLoans.length, icon: CreditCard, color: "text-blue-400" },
                  { label: arabicSource("dashboard.reviews_awaited"), value: evalStats.pending, icon: Award, color: "text-purple-400" },
                  { label: arabicSource("dashboard.training_underway"), value: trainingStats.ongoing, icon: GraduationCap, color: "text-emerald-400" },
                  { label: arabicSource("common.active_alarms"), value: warningStats.active, icon: AlertTriangle, color: "text-orange-400" },
                  { label: arabicSource("common.open_jobs"), value: recruitmentStats.openPositions, icon: UserPlus, color: "text-cyan-400" },
                  { label: arabicSource("dashboard.exits"), value: exitProcesses.filter((p: any) => p.status !== "completed" && p.status !== "cancelled").length, icon: UserX, color: "text-red-400" },
                ].map((item: any) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${item.color}`} />
                        <span className="text-sm text-foreground">{item.label}</span>
                      </div>
                      <span className={`text-sm font-medium ${item.color}`}>{item.value}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Risk Scorecard */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className={cardCls}>
              <h3 className="text-foreground mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> {arabicSource("dashboard.risk_card")}
              </h3>
              <div className="text-center p-4 rounded-xl bg-muted/20 mb-4">
                <p className={`text-4xl font-bold ${
                  riskScore.level === "critical" ? "text-red-400" :
                  riskScore.level === "high" ? "text-orange-400" :
                  riskScore.level === "medium" ? "text-amber-400" : "text-emerald-400"
                }`}>{riskScore.score}</p>
                <p className="text-muted-foreground text-xs mt-1">{arabicSource("dashboard.out_of_100")}</p>
                <div className="mt-2"><DashboardRiskBadge level={riskScore.level} /></div>
              </div>
              <div className="space-y-2">
                {riskScore.items.length === 0 ? (
                  <div className="text-center py-4">
                    <Heart className="w-8 h-8 text-emerald-400/30 mx-auto mb-2" />
                    <p className="text-emerald-400 text-sm">{arabicSource("dashboard.no_risks")}</p>
                  </div>
                ) : riskScore.items.slice(0, 5).map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/10">
                    <span className="text-xs text-foreground">{item.label}</span>
                    <DashboardRiskBadge level={item.level} />
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Notifications */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className={cardCls}>
              <h3 className="text-foreground mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" /> {arabicSource("dashboard.latest_notices")}
                {unreadCount > 0 && <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs">{unreadCount}</span>}
              </h3>
              <div className="space-y-2.5">
                {notifications.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">{arabicSource("common.no_notifications")}</p>
                ) : notifications.slice(0, 6).map((n: any) => (
                  <div key={n.id} className={`flex items-start gap-3 p-2.5 rounded-lg ${n.is_read ? "bg-muted/10" : "bg-primary/5 border border-primary/20"}`}>
                    <Bell className={`w-3.5 h-3.5 mt-0.5 ${n.type === "warning" ? "text-amber-400" : n.type === "error" ? "text-red-400" : "text-primary"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground truncate" style={{ fontSize: 12 }}>{n.title}</p>
                      <p className="text-muted-foreground" style={{ fontSize: 10 }}>{formatDateTime(n.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </>
  );
};
