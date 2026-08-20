import { memo } from "react";
import { type DbApplicant } from "@/shared/hooks";
import { applicantInfoRows } from "../data";
import InfoRow from "./InfoRow";

type ApplicantContactInfoGridProps = {
  applicant: DbApplicant;
};

const ApplicantContactInfoGrid = ({ applicant }: ApplicantContactInfoGridProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {applicantInfoRows.map((row, i) => (
      <InfoRow
        key={i}
        icon={<row.icon className="w-4 h-4" />}
        label={row.label}
        value={row.getValue(applicant)}
        dir={row.dir}
      />
    ))}
  </div>
);

export default memo(ApplicantContactInfoGrid);
