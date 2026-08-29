import { memo } from "react";
import { formatNumber } from "@/i18n/format";
import { arabicSource } from "@/i18n/source";

type ApplicantExpectedSalaryCardProps = {
  expectedSalary: number | string;
  salaryCurrency?: string | null;
};

const ApplicantExpectedSalaryCard = ({ expectedSalary, salaryCurrency }: ApplicantExpectedSalaryCardProps) => (
  <div className="p-3 rounded-lg bg-muted/20 border border-border/20">
    <span className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("recruitment.expected_salary_2")} </span>
    <span className="text-foreground" style={{ fontSize: 13 }}>
      {formatNumber(Number(expectedSalary))} {salaryCurrency || "IQD"}
    </span>
  </div>
);

export default memo(ApplicantExpectedSalaryCard);
