import { useMemo } from "react";
import { motion } from "motion/react";
import CustomBarChart from "@/shared/components/custom-bar-chart";
import { arabicSource } from "@/i18n/source";
import { cardCls } from "../styles";

type TMonthlyHoursChartProps = {
  monthlyHours: { month: string; hours: number }[];
};

const MonthlyHoursChart = ({ monthlyHours }: TMonthlyHoursChartProps) => {
  const chartData = useMemo(
    () => monthlyHours?.map((d) => ({ label: d.month, value: d.hours })),
    [monthlyHours],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={cardCls}
    >
      <h3 className="text-foreground mb-4">
        {arabicSource("training.monthly_training_hours")}
      </h3>
      <CustomBarChart
        data={chartData}
        barLabel={arabicSource("common.hours_2")}
        height={250}
      />
    </motion.div>
  );
};

export default MonthlyHoursChart;
