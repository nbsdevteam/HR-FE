import { memo } from "react";
import { Users } from "lucide-react";
import { Select, TypeAhead } from "@/shared/components";
import { type DbJobOpening } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { inputCls, labelCls, selectCls } from "../styles";

const getJobOpeningId = (job: DbJobOpening): string => job.id;
const getJobOpeningLabel = (job: DbJobOpening): string => job.title;

type ApplicantFormBasicSectionProps = {
  name: string;
  jobOpeningId: string;
  gender: string;
  city: string;
  openJobs: DbJobOpening[];
  onFieldChange: (field: string, value: string) => void;
};

const ApplicantFormBasicSection = ({ name, jobOpeningId, gender, city, openJobs, onFieldChange }: ApplicantFormBasicSectionProps) => {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange("name", e.target.value);
  };

  const handleJobOpeningChange = (value: string): void => {
    onFieldChange("job_opening_id", value);
  };

  const handleGenderChange = (value: string): void => {
    onFieldChange("gender", value);
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange("city", e.target.value);
  };

  return (
    <fieldset className="rounded-xl border border-border/30 p-4 space-y-4">
      <legend className="px-2 text-primary flex items-center gap-1.5" style={{ fontSize: 13 }}>
        <Users className="w-4 h-4" /> {arabicSource("recruitment.basic_information")}
      </legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls} style={{ fontSize: 13 }}>{arabicSource("common.full_name")}</label>
          <input type="text" value={name} onChange={handleNameChange}
            placeholder={arabicSource("recruitment.applicant_s_name")} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} style={{ fontSize: 13 }}>{arabicSource("recruitment.the_job_applied_for")}</label>
          <TypeAhead
            items={openJobs}
            getId={getJobOpeningId}
            getLabel={getJobOpeningLabel}
            value={jobOpeningId}
            onChange={handleJobOpeningChange}
          />
        </div>
        <div>
          <label className={labelCls} style={{ fontSize: 13 }}>{arabicSource("recruitment.sex")}</label>
          <Select
            value={gender}
            onChange={handleGenderChange}
            options={[arabicSource("common.male"), arabicSource("common.female")]}
            placeholder={arabicSource("common.select")}
            className={selectCls}
          />
        </div>
        <div>
          <label className={labelCls} style={{ fontSize: 13 }}>{arabicSource("common.city")}</label>
          <input type="text" value={city} onChange={handleCityChange}
            placeholder={arabicSource("common.baghdad")} className={inputCls} />
        </div>
      </div>
    </fieldset>
  );
};

export default memo(ApplicantFormBasicSection);
