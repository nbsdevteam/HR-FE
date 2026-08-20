import { memo } from "react";

type SkillTagVariant = "matched" | "missing";

type SkillTagProps = {
  skill: string;
  variant: SkillTagVariant;
};

const VARIANT_CLASSES: Record<SkillTagVariant, string> = {
  matched: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  missing: "border-destructive/30 bg-destructive/10 text-destructive",
};

const SkillTag = ({ skill, variant }: SkillTagProps) => (
  <span
    className={`px-2 py-0.5 rounded-md border ${VARIANT_CLASSES[variant]}`}
    style={{ fontSize: 11 }}
    data-i18n-ignore
  >
    {skill}
  </span>
);

export default memo(SkillTag);
