import { useTranslation } from "react-i18next";
import { CircleSlash, LayoutGrid, UserCheck, UserMinus } from "lucide-react";
import { StatCard } from "@/shared/components";

type GradesSummaryHeaderProps = {
  totalSeats: number;
  gradedEmployees: number;
  totalEmployees: number;
  unassignedEmployees: number;
  ungradedEmployees: number;
};

/**
 * The three populations the ladder spans, stated separately. They are wildly
 * different numbers — a lone "of {total}" invites the reader to conclude the
 * ladder has lost every employee who holds no position.
 */
const GradesSummaryHeader = ({
  totalSeats,
  gradedEmployees,
  totalEmployees,
  unassignedEmployees,
  ungradedEmployees,
}: GradesSummaryHeaderProps) => {
  const { t } = useTranslation();

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label={t("hierarchy.establishment")} value={totalSeats} icon={LayoutGrid} index={0} sub={t("hierarchy.seats")} />
      <StatCard
        label={t("hierarchy.filled")}
        value={gradedEmployees}
        icon={UserCheck}
        index={1}
        sub={t("hierarchy.graded_of_total", { graded: gradedEmployees, total: totalEmployees })}
      />
      <StatCard
        label={t("hierarchy.vacancies")}
        value={Math.max(0, totalSeats - gradedEmployees)}
        icon={CircleSlash}
        index={2}
        sub={t("hierarchy.vacant")}
      />
      <StatCard
        label={t("hierarchy.without_position")}
        value={unassignedEmployees}
        icon={UserMinus}
        index={3}
        sub={ungradedEmployees > 0 ? t("hierarchy.ungraded_employees", { count: ungradedEmployees }) : undefined}
      />
    </div>
  );
};

export default GradesSummaryHeader;
