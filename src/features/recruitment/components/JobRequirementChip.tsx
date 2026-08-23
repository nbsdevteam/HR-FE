import { memo } from "react";

type JobRequirementChipProps = {
  requirement: string;
};

/** One requirement pill on a job-opening card. */
const JobRequirementChip = ({ requirement }: JobRequirementChipProps) => (
  <span
    className="px-2 py-0.5 rounded-md bg-muted/30 text-muted-foreground"
    style={{ fontSize: 11 }}
  >
    {requirement}
  </span>
);

export default memo(JobRequirementChip);
