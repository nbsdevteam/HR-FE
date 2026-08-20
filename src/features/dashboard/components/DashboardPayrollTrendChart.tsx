import { CustomLineChart } from "@/shared/components/custom-line-chart";
import { arabicSource } from "@/i18n/source";
import DashboardChartCard from "./DashboardChartCard";
import DashboardTrendBadge from "./DashboardTrendBadge";

type DashboardPayrollTrendChartProps = {
  monthlyPayroll: any[];
  payrollMoM: number;
  color: string;
  cardCls: string;
};

const DashboardPayrollTrendChart = ({
  monthlyPayroll,
  payrollMoM,
  color,
  cardCls,
}: DashboardPayrollTrendChartProps) => (
  <DashboardChartCard delay={0.6} className={cardCls}>
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-foreground">
        {arabicSource("common.net_monthly_salaries_thousand_iqd")}
      </h3>
      {payrollMoM !== 0 && (
        <DashboardTrendBadge value={payrollMoM} suffix="%" inverse />
      )}
    </div>
    {monthlyPayroll.length > 0 ? (
      <CustomLineChart
        data={monthlyPayroll}
        color={color}
        height={250}
        valueLabel={arabicSource("common.amount")}
      />
    ) : (
      <div className="flex items-center justify-center h-[250px] text-muted-foreground">
        {arabicSource("common.there_is_no_salary_data")}
      </div>
    )}
  </DashboardChartCard>
);

export default DashboardPayrollTrendChart;
