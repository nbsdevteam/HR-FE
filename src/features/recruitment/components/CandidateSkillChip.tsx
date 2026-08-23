import { memo } from "react";

type CandidateSkillChipProps = {
  skill: string;
};

/** Compact skill pill shown on the candidate-bank card. */
const CandidateSkillChip = ({ skill }: CandidateSkillChipProps) => (
  <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary" style={{ fontSize: 10 }}>
    {skill}
  </span>
);

export default memo(CandidateSkillChip);
