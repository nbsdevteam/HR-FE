import { memo } from "react";
import { empDisplayName, type DbEmployee } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";

type ProbationAlertRowProps = {
  employee: DbEmployee | undefined;
  probationEndDate: string;
};

const ProbationAlertRow = ({ employee, probationEndDate }: ProbationAlertRowProps) => {
  const daysLeft = Math.ceil(
    (new Date(probationEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  return (
    <p className="text-foreground" style={{ fontSize: 13 }}>
      {employee ? empDisplayName(employee) : "—"} {arabicSource("lifecycle.the_trial_period_ends_yet")}{" "}
      <span className="text-amber-400">{daysLeft} {arabicSource("common.days_2")}</span>
    </p>
  );
};

export default memo(ProbationAlertRow);
