import { InputField, Select } from "@/shared/components";
import { DEPARTMENTS } from "@/shared/constants";
import { arabicSource } from "@/i18n/source";
import { JOB_STATUSES } from "../constants/recruitment";
import { inputCls, labelCls, selectCls } from "../styles";

type JobFormFieldsSectionProps = {
  title: string;
  department: string;
  location: string;
  type: string;
  deadline: string;
  status: string;
  salaryRange: string;
  requirements: string;
  description: string;
  onFieldChange: (field: string, value: string) => void;
};

const JobFormFieldsSection = ({
  title,
  department,
  location,
  type,
  deadline,
  status,
  salaryRange,
  requirements,
  description,
  onFieldChange,
}: JobFormFieldsSectionProps) => {
  const handleTitleChange = (value: string): void => {
    onFieldChange("title", value);
  };
  const handleDepartmentChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ): void => {
    onFieldChange("department", e.target.value);
  };
  const handleLocationChange = (value: string): void => {
    onFieldChange("location", value);
  };
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    onFieldChange("type", e.target.value);
  };
  const handleDeadlineChange = (value: string): void => {
    onFieldChange("deadline", value);
  };
  const handleStatusChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ): void => {
    onFieldChange("status", e.target.value);
  };
  const handleSalaryRangeChange = (value: string): void => {
    onFieldChange("salary_range", value);
  };
  const handleRequirementsChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ): void => {
    onFieldChange("requirements", e.target.value);
  };
  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ): void => {
    onFieldChange("description", e.target.value);
  };

  return (
    <>
      <div>
        <label className={labelCls} style={{ fontSize: 13 }}>
          {arabicSource("recruitment.job_title")}
        </label>
        <InputField
          value={title}
          onChange={handleTitleChange}
          placeholder={arabicSource("recruitment.job_title_2")}
          className={inputCls}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls} style={{ fontSize: 13 }}>
            {arabicSource("common.section")}
          </label>
          <Select
            value={department}
            onChange={handleDepartmentChange}
            options={DEPARTMENTS}
            className={selectCls}
          />
        </div>
        <div>
          <label className={labelCls} style={{ fontSize: 13 }}>
            {arabicSource("recruitment.location")}
          </label>
          <InputField
            value={location}
            onChange={handleLocationChange}
            className={inputCls}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls} style={{ fontSize: 13 }}>
            {arabicSource("recruitment.permanent_type")}
          </label>
          <Select
            value={type}
            onChange={handleTypeChange}
            options={[
              arabicSource("common.full_time"),
              arabicSource("recruitment.part_time"),
              arabicSource("recruitment.temporary_contract"),
            ]}
            className={selectCls}
          />
        </div>
        <div>
          <label className={labelCls} style={{ fontSize: 13 }}>
            {arabicSource("recruitment.deadline")}
          </label>
          <InputField
            type="date"
            value={deadline}
            onChange={handleDeadlineChange}
            className={inputCls}
            dir="ltr"
          />
        </div>
      </div>
      <div>
        <label className={labelCls} style={{ fontSize: 13 }}>
          {arabicSource("recruitment.vacancy_status")}
        </label>
        <Select
          value={status}
          onChange={handleStatusChange}
          options={JOB_STATUSES}
          className={selectCls}
        />
      </div>
      <div>
        <label className={labelCls} style={{ fontSize: 13 }}>
          {arabicSource("recruitment.salary_range")}
        </label>
        <InputField
          value={salaryRange}
          onChange={handleSalaryRangeChange}
          placeholder={arabicSource(
            "recruitment.example_1_500_000_2_500_000_iqd",
          )}
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls} style={{ fontSize: 13 }}>
          {arabicSource("recruitment.requirements_line_for_each_requirement")}
        </label>
        <textarea
          value={requirements}
          onChange={handleRequirementsChange}
          rows={3}
          placeholder={arabicSource("recruitment.5_years_experience")}
          className={`${inputCls} h-auto py-3 resize-none`}
        />
      </div>
      <div>
        <label className={labelCls} style={{ fontSize: 13 }}>
          {arabicSource("common.description")}
        </label>
        <textarea
          value={description}
          onChange={handleDescriptionChange}
          rows={3}
          placeholder={arabicSource("recruitment.job_description")}
          className={`${inputCls} h-auto py-3 resize-none`}
        />
      </div>
    </>
  );
};

export default JobFormFieldsSection;
