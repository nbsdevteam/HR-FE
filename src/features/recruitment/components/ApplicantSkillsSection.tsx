import { memo } from "react";
import { arabicSource } from "@/i18n/source";
import Chip from "./Chip";

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
        <Chip key={s} label={s} variant="applicant" />
      ))}
    </div>
  </div>
);

export default memo(ApplicantSkillsSection);
