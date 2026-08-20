import { Sparkles } from "lucide-react";
import { SelectField } from "@/shared/components";
import { type JobSkillRequirement } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { EDUCATION_LEVELS } from "../constants/recruitment";
import { inputCls, labelCls, selectCls } from "../styles";
import SkillTagInput from "./SkillTagInput";

type JobScreeningSpecFieldsProps = {
  requiredSkills: JobSkillRequirement[];
  niceToHave: JobSkillRequirement[];
  minExperienceYears: number;
  educationLevel: string;
  irAutoShortlist: number;
  onRequiredSkillsChange: (skills: JobSkillRequirement[]) => void;
  onNiceToHaveChange: (skills: JobSkillRequirement[]) => void;
  onMinExperienceYearsChange: (value: number) => void;
  onEducationLevelChange: (value: string) => void;
  onIrAutoShortlistChange: (value: number) => void;
};

// AI screening spec — drives the Initial Rating for every applicant
const JobScreeningSpecFields = ({
  requiredSkills,
  niceToHave,
  minExperienceYears,
  educationLevel,
  irAutoShortlist,
  onRequiredSkillsChange,
  onNiceToHaveChange,
  onMinExperienceYearsChange,
  onEducationLevelChange,
  onIrAutoShortlistChange,
}: JobScreeningSpecFieldsProps) => (
  <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-4">
    <div
      className="flex items-center gap-2 text-primary"
      style={{ fontSize: 13 }}
    >
      <Sparkles className="w-4 h-4" />
      {arabicSource("recruitment.screening_spec")}
    </div>
    <SkillTagInput
      label={arabicSource("recruitment.required_skills")}
      skills={requiredSkills}
      onChange={onRequiredSkillsChange}
      weighted
    />
    <SkillTagInput
      label={arabicSource("recruitment.nice_to_have")}
      skills={niceToHave}
      onChange={onNiceToHaveChange}
    />
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className={labelCls} style={{ fontSize: 12 }}>
          {arabicSource("recruitment.min_experience")}
        </label>
        <input
          type="number"
          min={0}
          max={50}
          value={minExperienceYears}
          onChange={(e) =>
            onMinExperienceYearsChange(Number(e.target.value) || 0)
          }
          className={inputCls}
          dir="ltr"
        />
      </div>
      <div>
        <label className={labelCls} style={{ fontSize: 12 }}>
          {arabicSource("recruitment.education_level")}
        </label>
        <SelectField
          value={educationLevel}
          onChange={onEducationLevelChange}
          options={EDUCATION_LEVELS}
          className={selectCls}
        />
      </div>
    </div>
    <div>
      <label className={labelCls} style={{ fontSize: 12 }}>
        {arabicSource("recruitment.auto_shortlist")}
        {irAutoShortlist === 0 &&
          ` — ${arabicSource("recruitment.auto_shortlist_off")}`}
      </label>
      <input
        type="range"
        min={0}
        max={95}
        step={5}
        value={irAutoShortlist}
        onChange={(e) => onIrAutoShortlistChange(Number(e.target.value))}
        className="w-full cursor-pointer accent-current text-primary"
        dir="ltr"
      />
      <div
        className="text-muted-foreground text-center"
        style={{ fontSize: 11 }}
      >
        {irAutoShortlist > 0 ? `${irAutoShortlist}%` : ""}
      </div>
    </div>
  </div>
);

export default JobScreeningSpecFields;
