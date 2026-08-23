import { memo } from "react";
import { Trophy } from "lucide-react";
import { Select } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { ALL_STAGES } from "../constants/recruitment";
import { labelCls, selectCls, inputCls } from "../styles";
import StarRating from "./StarRating";
import Option from "./Option";

type ApplicantFormSalarySectionProps = {
  expectedSalary: number | string;
  salaryCurrency: string;
  rating: number;
  stage: string;
  onFieldChange: (field: string, value: string | number) => void;
  onRatingChange: (rating: number) => void;
};

const ApplicantFormSalarySection = ({
  expectedSalary,
  salaryCurrency,
  rating,
  stage,
  onFieldChange,
  onRatingChange,
}: ApplicantFormSalarySectionProps) => {
  const handleExpectedSalaryChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange("expected_salary", e.target.value);
  };

  const handleSalaryCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    onFieldChange("salary_currency", e.target.value);
  };

  const handleStageChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    onFieldChange("stage", e.target.value);
  };

  return (
    <fieldset className="rounded-xl border border-border/30 p-4 space-y-4">
      <legend
        className="px-2 text-primary flex items-center gap-1.5"
        style={{ fontSize: 13 }}
      >
        <Trophy className="w-4 h-4" />{" "}
        {arabicSource("recruitment.salary_and_evaluation")}
      </legend>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className={labelCls} style={{ fontSize: 13 }}>
            {arabicSource("recruitment.expected_salary")}
          </label>
          <input
            type="number"
            value={expectedSalary}
            onChange={handleExpectedSalaryChange}
            placeholder="0"
            className={inputCls}
            min={1}
            dir="ltr"
          />
        </div>
        <div>
          <label className={labelCls} style={{ fontSize: 13 }}>
            {arabicSource("recruitment.currency")}
          </label>
          <Select
            value={salaryCurrency}
            onChange={handleSalaryCurrencyChange}
            className={selectCls}
          >
            <option>IQD</option>
            <option>USD</option>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls} style={{ fontSize: 13 }}>
            {arabicSource("recruitment.initial_assessment")}
          </label>
          <div className="pt-1.5">
            <StarRating value={rating} onChange={onRatingChange} size={22} />
          </div>
        </div>
        <div>
          <label className={labelCls} style={{ fontSize: 13 }}>
            {arabicSource("common.stage")}
          </label>
          <Select
            value={stage}
            onChange={handleStageChange}
            className={selectCls}
          >
            {ALL_STAGES.map((s) => (
              <Option key={s}>{s}</Option>
            ))}
          </Select>
        </div>
      </div>
    </fieldset>
  );
};

export default memo(ApplicantFormSalarySection);
