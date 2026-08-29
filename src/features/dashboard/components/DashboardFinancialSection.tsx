import CustomBarChart from "@/shared/components/custom-bar-chart";
import CustomLineChart from "@/shared/components/custom-line-chart";
import ColorStatTile from "@/shared/components/ColorStatTile";
import LabeledMetricRow from "@/shared/components/LabeledMetricRow";
import { arabicSource } from "@/i18n/source";
import { useDashboardFinancialData } from "../hooks/useDashboardFinancialData";
import type { DashboardSectionData } from "../hooks/useDashboardData";
import DashboardChartCard from "./DashboardChartCard";
import DashboardMiniBar from "./DashboardMiniBar";
import DashboardSectionStatCard from "./DashboardSectionStatCard";
import DashboardTrendBadge from "./DashboardTrendBadge";
import { formatIQD, pct } from "../utils/dashboardFormat";

type DashboardFinancialSectionProps = {
  data: DashboardSectionData;
};

const DashboardFinancialSection = ({
  data,
}: DashboardFinancialSectionProps) => {
  const {
    compensationStats,
    colors,
    payrollMoM,
    monthlyPayroll,
    activeLoans,
    cardCls,
    totalSalaries,
    avgSalary,
    medianSalary,
    salaryByDept,
    loanUtilization,
  } = data;

  const { financialStats, totalLoanAmount, totalPaidLoanAmount, loanTiles, loanPaymentTiles } =
    useDashboardFinancialData(data);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {financialStats.map((stat, i) => (
          <DashboardSectionStatCard
            key={stat.label}
            index={i}
            valueTextClassName="text-lg"
            dir="ltr"
            {...stat}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardChartCard className={cardCls}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-foreground">
              {arabicSource("common.net_monthly_salaries_thousand_iqd")}
            </h3>
            {payrollMoM !== 0 && (
              <DashboardTrendBadge
                value={payrollMoM}
                suffix={arabicSource("dashboard.monthly")}
                inverse
              />
            )}
          </div>
          {monthlyPayroll.length > 0 ? (
            <CustomLineChart
              data={monthlyPayroll}
              color={colors.primary}
              height={280}
              valueLabel={arabicSource("common.amount")}
            />
          ) : (
            <div className="flex items-center justify-center h-[280px] text-muted-foreground">
              {arabicSource("common.there_is_no_salary_data")}
            </div>
          )}
        </DashboardChartCard>

        <DashboardChartCard className={cardCls}>
          <h3 className="text-foreground mb-4">
            {arabicSource(
              "dashboard.cost_of_salaries_by_department_thousand_iqd",
            )}
          </h3>
          {salaryByDept.length > 0 ? (
            <CustomBarChart
              data={salaryByDept}
              color="#22C55E"
              height={280}
              barLabel={arabicSource("dashboard.cost")}
            />
          ) : (
            <div className="flex items-center justify-center h-[280px] text-muted-foreground">
              {arabicSource("common.no_data")}
            </div>
          )}
        </DashboardChartCard>
      </div>

      {/* Compensation Breakdown + Loan Portfolio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compensation breakdown */}
        <DashboardChartCard className={cardCls}>
          <h3 className="text-foreground mb-4">
            {arabicSource("dashboard.compensation_analysis")}
          </h3>
          <div className="space-y-4">
            <LabeledMetricRow
              label={arabicSource("common.total_basic_salaries")}
              value={formatIQD(totalSalaries)}
              valueColorClassName="text-primary"
              dir="ltr"
            />
            <LabeledMetricRow
              label={arabicSource("common.total_allowances")}
              value={formatIQD(compensationStats.totalAllowances)}
              valueColorClassName="text-emerald-400"
              dir="ltr"
            />
            <LabeledMetricRow
              label={arabicSource("common.total_deductions")}
              value={formatIQD(compensationStats.totalDeductions)}
              valueColorClassName="text-red-400"
              dir="ltr"
            />
            <div className="border-t border-border/40 pt-3">
              <LabeledMetricRow
                label={arabicSource("dashboard.net_compensation")}
                value={formatIQD(
                  compensationStats.totalCompensation -
                    compensationStats.totalDeductions,
                )}
                valueColorClassName="text-primary"
                valueWeightClassName="font-bold"
                labelClassName="font-medium text-foreground"
                wrapperClassName="bg-primary/10 border border-primary/20"
                dir="ltr"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="p-3 rounded-lg bg-muted/20 text-center">
                <p className="text-xs text-muted-foreground">
                  {arabicSource("dashboard.average_salary")}
                </p>
                <p className="text-sm font-medium text-primary" dir="ltr">
                  {formatIQD(avgSalary)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 text-center">
                <p className="text-xs text-muted-foreground">
                  {arabicSource("common.median_salary")}
                </p>
                <p className="text-sm font-medium text-blue-400" dir="ltr">
                  {formatIQD(medianSalary)}
                </p>
              </div>
            </div>
          </div>
        </DashboardChartCard>

        {/* Loan Portfolio */}
        <DashboardChartCard className={cardCls}>
          <h3 className="text-foreground mb-4">
            {arabicSource("dashboard.loan_portfolio")}
          </h3>
          {activeLoans.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              {arabicSource("dashboard.there_are_no_active_loans")}
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {loanTiles.map((tile) => (
                  <ColorStatTile key={tile.label} {...tile} />
                ))}
              </div>
              <div className="p-3 rounded-lg bg-muted/20">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">
                    {arabicSource("dashboard.payment_ratio")}
                  </span>
                  <span className="text-emerald-400 font-medium">
                    {pct(totalPaidLoanAmount, totalLoanAmount)}%
                  </span>
                </div>
                <DashboardMiniBar
                  value={totalPaidLoanAmount}
                  max={totalLoanAmount}
                  color="bg-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {loanPaymentTiles.map((tile) => (
                  <ColorStatTile
                    key={tile.label}
                    padding="p-3"
                    valueTextClassName="text-lg font-semibold"
                    dir="ltr"
                    {...tile}
                  />
                ))}
              </div>
              <div className="p-3 rounded-lg bg-muted/20">
                <p className="text-xs text-muted-foreground">
                  {arabicSource("dashboard.percentage_of_employees_who_borrow")}
                </p>
                <p className="text-sm font-medium text-blue-400">
                  {loanUtilization}
                  {arabicSource("dashboard.of_total_employees")}
                </p>
              </div>
            </div>
          )}
        </DashboardChartCard>
      </div>
    </>
  );
};

export default DashboardFinancialSection;
