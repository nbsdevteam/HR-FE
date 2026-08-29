import CustomLineChart from "@/shared/components/custom-line-chart";
import { arabicSource } from "@/i18n/source";
import DashboardChartCard from "./DashboardChartCard";

type DashboardHeadcountTrendChartProps = {
  headcountTrend: any[];
  cardCls: string;
};

const DashboardHeadcountTrendChart = ({
  headcountTrend,
  cardCls,
}: DashboardHeadcountTrendChartProps) => (
  <DashboardChartCard delay={0.5} className={cardCls}>
    <h3 className="text-foreground mb-4">
      {arabicSource("dashboard.headcount_trend_12_months")}
    </h3>
    <CustomLineChart
      data={headcountTrend}
      color="#3B82F6"
      height={250}
      valueLabel={arabicSource("common.number_of_employees")}
    />
  </DashboardChartCard>
);

export default DashboardHeadcountTrendChart;
