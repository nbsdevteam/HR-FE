import { memo } from "react";
import { type DbApplicant } from "@/shared/hooks";
import { STAGES } from "../constants/recruitment";
import { applicantIrFallbackFields } from "../data";
import RankBar from "./RankBar";

type ApplicantIrFallbackBreakdownProps = {
  applicant: DbApplicant;
};

const ApplicantIrFallbackBreakdown = ({ applicant }: ApplicantIrFallbackBreakdownProps) => (
  <div className="grid grid-cols-2 gap-3">
    {applicantIrFallbackFields.map((field) => (
      <RankBar key={field.label} label={field.label} value={field.getValue(applicant, STAGES)} weight={field.weight} />
    ))}
  </div>
);

export default memo(ApplicantIrFallbackBreakdown);
