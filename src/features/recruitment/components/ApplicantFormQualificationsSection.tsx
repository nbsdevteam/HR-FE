import { memo } from "react";
import { GraduationCap } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { sourceOptions } from "../constants/recruitment";
import { inputCls, labelCls, selectCls } from "../styles";

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
}: ApplicantFormQualificationsSectionProps) => (
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
        <select
          value={education}
          onChange={(e) => onFieldChange("education", e.target.value)}
          className={selectCls}
        >
          <option value="">{arabicSource("common.select")}</option>
          <option>{arabicSource("recruitment.preparatory_school")}</option>
          <option>{arabicSource("recruitment.diploma")}</option>
          <option>{arabicSource("recruitment.bachelor_s_degree")}</option>
          <option>{arabicSource("recruitment.master")}</option>
          <option>{arabicSource("recruitment.ph_d")}</option>
        </select>
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
          onChange={(e) =>
            onFieldChange("experience_years", Number(e.target.value))
          }
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
          onChange={(e) => onFieldChange("current_company", e.target.value)}
          placeholder={arabicSource("recruitment.company_name")}
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls} style={{ fontSize: 13 }}>
          {arabicSource("recruitment.submission_source")}
        </label>
        <select
          value={source}
          onChange={(e) => onFieldChange("source", e.target.value)}
          className={selectCls}
        >
          {sourceOptions.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
    <div>
      <label className={labelCls} style={{ fontSize: 13 }}>
        {arabicSource("recruitment.skills_comma_separated")}
      </label>
      <input
        type="text"
        value={skills}
        onChange={(e) => onFieldChange("skills", e.target.value)}
        placeholder={arabicSource(
          "recruitment.react_node_js_sql_project_management",
        )}
        className={inputCls}
      />
      {skills && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {skills
            ?.split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .map((s, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary"
                style={{ fontSize: 11 }}
              >
                {s}
              </span>
            ))}
        </div>
      )}
    </div>
  </fieldset>
);

export default memo(ApplicantFormQualificationsSection);
