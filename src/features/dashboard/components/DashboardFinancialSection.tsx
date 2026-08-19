import { useMemo } from "react";
import { motion } from "motion/react";
import { Wallet, TrendingUp, CreditCard, Coins, UserX } from "lucide-react";
import { CustomBarChart } from "@/shared/components/custom-bar-chart";
import { CustomLineChart } from "@/shared/components/custom-line-chart";
import ColorStatTile from "@/shared/components/ColorStatTile";
import { arabicSource } from "@/i18n/source";
import DashboardMiniBar from "./DashboardMiniBar";
import DashboardSectionStatCard from "./DashboardSectionStatCard";
import DashboardTrendBadge from "./DashboardTrendBadge";
import { formatIQD, pct } from "../utils/dashboardFormat";

type DashboardFinancialSectionProps = {
  data: any;
};

const DashboardFinancialSection = ({ data }: DashboardFinancialSectionProps) => {
  const {
    compensationStats, colors, payrollMoM, monthlyPayroll, activeLoans, exitProcesses, cardCls,
    totalSalaries, avgSalary, medianSalary, salaryByDept, loanUtilization, totalLoanBalance, allAllowances,
  } = data;

  const financialStats = useMemo(() => [
    { label: arabicSource("common.total_compensation"), value: formatIQD(compensationStats.totalCompensation), sub: `${arabicSource("dashboard.salaries_allowances")}`, icon: Wallet, color: "text-primary" },
    { label: arabicSource("dashboard.cost_per_employee"), value: formatIQD(compensationStats.costPerEmployee), sub: `${arabicSource("common.median_salary")} ${formatIQD(medianSalary)}`, icon: Coins, color: "text-emerald-400" },
    { label: arabicSource("common.total_allowances"), value: formatIQD(compensationStats.totalAllowances), sub: `${allAllowances.length} ${arabicSource("dashboard.active_allowance")}`, icon: TrendingUp, color: "text-blue-400" },
    { label: arabicSource("dashboard.loan_balance"), value: formatIQD(totalLoanBalance), sub: `${activeLoans.length} ${arabicSource("dashboard.loan")}${loanUtilization}%)`, icon: CreditCard, color: "text-amber-400" },
    { label: arabicSource("dashboard.active_exits"), value: exitProcesses.filter((p: any) => p.status !== "completed" && p.status !== "cancelled").length, sub: `${arabicSource("dashboard.end_of_service_benefits")}`, icon: UserX, color: "text-red-400" },
  ], [compensationStats, medianSalary, allAllowances, totalLoanBalance, activeLoans, loanUtilization, exitProcesses]);

  const totalLoanAmount = useMemo(
    () => activeLoans.reduce((s: number, l: any) => s + (l.loan_amount || 0), 0),
    [activeLoans]
  );
  const totalPaidLoanAmount = totalLoanAmount - totalLoanBalance;

  const loanTiles = useMemo(() => [
    { value: activeLoans.length, label: arabicSource("common.active_loans"), colorClassName: "bg-blue-500/10 border border-blue-500/20", textColorClassName: "text-blue-400" },
    { value: formatIQD(totalLoanAmount), label: arabicSource("dashboard.total_loans"), colorClassName: "bg-primary/10 border border-primary/20", textColorClassName: "text-primary", valueTextClassName: "text-lg font-semibold", dir: "ltr" as const },
  ], [activeLoans.length, totalLoanAmount]);

  const loanPaymentTiles = useMemo(() => [
    { value: formatIQD(totalPaidLoanAmount), label: arabicSource("dashboard.the_payer"), colorClassName: "bg-emerald-500/10 border border-emerald-500/20", textColorClassName: "text-emerald-400" },
    { value: formatIQD(totalLoanBalance), label: arabicSource("dashboard.remaining"), colorClassName: "bg-amber-500/10 border border-amber-500/20", textColorClassName: "text-amber-400" },
  ], [totalPaidLoanAmount, totalLoanBalance]);

  return (
<>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {financialStats.map((stat, i) => (
              <DashboardSectionStatCard key={stat.label} index={i} valueTextClassName="text-lg" dir="ltr" {...stat} />
            ))}
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
                    {loanTiles.map(tile => (
                      <ColorStatTile key={tile.label} {...tile} />
                    ))}
                  </div>
                  <div className="p-3 rounded-lg bg-muted/20">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">{arabicSource("dashboard.payment_ratio")}</span>
                      <span className="text-emerald-400 font-medium">{pct(totalPaidLoanAmount, totalLoanAmount)}%</span>
                    </div>
                    <DashboardMiniBar value={totalPaidLoanAmount} max={totalLoanAmount} color="bg-emerald-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {loanPaymentTiles.map(tile => (
                      <ColorStatTile key={tile.label} padding="p-3" valueTextClassName="text-lg font-semibold" dir="ltr" {...tile} />
                    ))}
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
