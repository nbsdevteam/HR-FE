import { memo } from "react";

type ApplicantSkillChipProps = {
  skill: string;
};

const ApplicantSkillChip = ({ skill }: ApplicantSkillChipProps) => (
  <span className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary" style={{ fontSize: 12 }}>
    {skill}
  </span>
);

export default memo(ApplicantSkillChip);
