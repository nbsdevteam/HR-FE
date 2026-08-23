import { memo } from "react";

type MatchedSkillChipProps = {
  skill: string;
};

/** Matched-skill pill in the AI screening table. */
const MatchedSkillChip = ({ skill }: MatchedSkillChipProps) => (
  <span
    className="px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
    style={{ fontSize: 10 }}
  >
    {skill}
  </span>
);

export default memo(MatchedSkillChip);
