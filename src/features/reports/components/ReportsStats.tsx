import StatCard from "@/shared/components/StatCard";
import { reportsStatFields } from "../data";

interface IReportsStatsProps {
  templateCount: number;
  historyCount: number;
  departmentCount: number;
  employeeCount: number;
}

const ReportsStats = ({
  templateCount,
  historyCount,
  departmentCount,
  employeeCount,
}: IReportsStatsProps) => {
  const values: Record<string, number> = {
    templateCount,
    historyCount,
    departmentCount,
    employeeCount,
  };
  const items = reportsStatFields.map((field) => ({
    ...field,
    value: values[field.key],
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {items.map((stat, i) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          index={i}
          padding="p-5"
          valueMarginClassName="mt-2"
        />
      ))}
    </div>
  );
};

export default ReportsStats;
