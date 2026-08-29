import CustomBarChart from "@/shared/components/custom-bar-chart";
import { arabicSource } from "@/i18n/source";
import DashboardChartCard from "./DashboardChartCard";

type DashboardDepartmentChartProps = {
  departmentData: any[];
  color: string;
  cardCls: string;
};

const DashboardDepartmentChart = ({
  departmentData,
  color,
  cardCls,
}: DashboardDepartmentChartProps) => (
  <DashboardChartCard delay={0.3} className={cardCls}>
    <h3 className="text-foreground mb-4">
      {arabicSource(
        "dashboard.distribution_of_employees_according_to_departments",
      )}
    </h3>
    <CustomBarChart
      data={departmentData}
      color={color}
      height={280}
      barLabel={arabicSource("common.number_of_employees")}
    />
  </DashboardChartCard>
);

export default DashboardDepartmentChart;
