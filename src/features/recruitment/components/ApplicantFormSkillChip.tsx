import { memo } from "react";

type ApplicantFormSkillChipProps = {
  skill: string;
};

/** Live preview pill for a skill typed into the applicant form's skills field. */
const ApplicantFormSkillChip = ({ skill }: ApplicantFormSkillChipProps) => (
  <span
    className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary"
    style={{ fontSize: 11 }}
  >
    {skill}
  </span>
);

export default memo(ApplicantFormSkillChip);
