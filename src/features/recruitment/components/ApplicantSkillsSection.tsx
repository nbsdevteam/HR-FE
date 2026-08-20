import { memo } from "react";
import { arabicSource } from "@/i18n/source";
import ApplicantSkillChip from "./ApplicantSkillChip";

type ApplicantSkillsSectionProps = {
  skills: string[];
};

const ApplicantSkillsSection = ({ skills }: ApplicantSkillsSectionProps) => (
  <div>
    <label className="text-muted-foreground block mb-2" style={{ fontSize: 12 }}>
      {arabicSource("common.skills")}
    </label>
    <div className="flex flex-wrap gap-2">
      {skills.map((s) => (
        <ApplicantSkillChip key={s} skill={s} />
      ))}
    </div>
  </div>
);

export default memo(ApplicantSkillsSection);
