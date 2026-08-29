import { memo, useMemo } from "react";
import { GraduationCap } from "lucide-react";
import { Select } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { sourceOptions } from "../constants/recruitment";
import { inputCls, labelCls, selectCls } from "../styles";
import Chip from "./Chip";

type ApplicantFormQualificationsSectionProps = {
  education: string;
  experienceYears: number;
  currentCompany: string;
  source: string;
  skills: string;
  onFieldChange: (field: string, value: string | number) => void;
};

const ApplicantFormQualificationsSection = ({
  education,
  experienceYears,
  currentCompany,
  source,
  skills,
  onFieldChange,
}: ApplicantFormQualificationsSectionProps) => {
  const handleEducationChange = (value: string): void => {
    onFieldChange("education", value);
  };

  const handleExperienceYearsChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange("experience_years", Number(e.target.value));
  };

  const handleCurrentCompanyChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange("current_company", e.target.value);
  };

  const handleSourceChange = (value: string): void => {
    onFieldChange("source", value);
  };

  const skillPreview = useMemo(
    () => skills.split(",").map((s) => s.trim()).filter(Boolean),
    [skills],
  );

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange("skills", e.target.value);
  };

  return (
    <fieldset className="rounded-xl border border-border/30 p-4 space-y-4">
      <legend
        className="px-2 text-primary flex items-center gap-1.5"
        style={{ fontSize: 13 }}
      >
        <GraduationCap className="w-4 h-4" />{" "}
        {arabicSource("recruitment.qualifications_and_experience")}
      </legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls} style={{ fontSize: 13 }}>
            {arabicSource("recruitment.academic_qualification")}
          </label>
          <Select
            value={education}
            onChange={handleEducationChange}
            options={[
              arabicSource("recruitment.preparatory_school"),
              arabicSource("recruitment.diploma"),
              arabicSource("recruitment.bachelor_s_degree"),
              arabicSource("recruitment.master"),
              arabicSource("recruitment.ph_d"),
            ]}
            placeholder={arabicSource("common.select")}
            className={selectCls}
          />
        </div>
        <div>
          <label className={labelCls} style={{ fontSize: 13 }}>
            {arabicSource("common.years_of_experience")}
          </label>
          <input
            type="number"
            min={0}
            max={50}
            value={experienceYears}
            onChange={handleExperienceYearsChange}
            className={inputCls}
            dir="ltr"
          />
        </div>
        <div>
          <label className={labelCls} style={{ fontSize: 13 }}>
            {arabicSource("common.current_company")}
          </label>
          <input
            type="text"
            value={currentCompany}
            onChange={handleCurrentCompanyChange}
            placeholder={arabicSource("recruitment.company_name")}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls} style={{ fontSize: 13 }}>
            {arabicSource("recruitment.submission_source")}
          </label>
          <Select
            value={source}
            onChange={handleSourceChange}
            options={sourceOptions}
            className={selectCls}
          />
        </div>
      </div>
      <div>
        <label className={labelCls} style={{ fontSize: 13 }}>
          {arabicSource("recruitment.skills_comma_separated")}
        </label>
        <input
          type="text"
          value={skills}
          onChange={handleSkillsChange}
          placeholder={arabicSource(
            "recruitment.react_node_js_sql_project_management",
          )}
          className={inputCls}
        />
        {skillPreview.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {skillPreview.map((s, i) => (
              <Chip key={`${s}-${i}`} label={s} variant="form" />
            ))}
          </div>
        )}
      </div>
    </fieldset>
  );
};

export default memo(ApplicantFormQualificationsSection);
