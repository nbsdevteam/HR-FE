import { memo, useMemo } from "react";
import { SearchInput, Select } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DbApplicant, DbJobOpening } from "@/shared/hooks";
import { ALL_STAGES } from "../constants/recruitment";
import ApplicantsTable from "./ApplicantsTable";

const FILTER_SELECT_CLASS =
  "h-10 px-3 rounded-lg border border-border bg-input-background text-foreground cursor-pointer";

type RecruitmentApplicantsViewProps = {
  applicants: DbApplicant[];
  filterJob: string;
  filterStage: string;
  jobs: DbJobOpening[];
  searchTerm: string;
  onFilterJobChange: (value: string) => void;
  onFilterStageChange: (value: string) => void;
  onSearchTermChange: (value: string) => void;
  onSelectApplicant: (applicant: DbApplicant) => void;
  onToggleBookmark: (applicant: DbApplicant) => void;
  onUpdateRating: (id: string, rating: number) => void;
  onUpdateStage: (id: string, stage: string) => void;
};

const RecruitmentApplicantsView = ({
  applicants,
  filterJob,
  filterStage,
  jobs,
  searchTerm,
  onFilterJobChange,
  onFilterStageChange,
  onSearchTermChange,
  onSelectApplicant,
  onToggleBookmark,
  onUpdateRating,
  onUpdateStage,
}: RecruitmentApplicantsViewProps) => {
  const stageOptions = useMemo(
    () => [
      { value: arabicSource("common.all"), label: arabicSource("recruitment.all_stages") },
      ...ALL_STAGES,
    ],
    [],
  );

  const jobOptions = useMemo(
    () => [
      { value: arabicSource("common.all"), label: arabicSource("recruitment.all_jobs") },
      ...jobs.map((job) => ({ value: job.id, label: job.title })),
    ],
    [jobs],
  );

  const handleFilterStageChange = (value: string): void => {
    onFilterStageChange(value);
  };

  const handleFilterJobChange = (value: string): void => {
    onFilterJobChange(value);
  };

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        <SearchInput
          wrapperClassName="relative flex-1 min-w-[200px]"
          iconClassName="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
          inputClassName="w-full h-10 ps-9 pe-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
          placeholder={arabicSource("recruitment.search_by_name_email_phone_skills")}
          value={searchTerm}
          onChange={onSearchTermChange}
          style={{ fontSize: 13 }}
        />
        <Select
          value={filterStage}
          onChange={handleFilterStageChange}
          options={stageOptions}
          className={FILTER_SELECT_CLASS}
          style={{ fontSize: 13 }}
        />
        <Select
          value={filterJob}
          onChange={handleFilterJobChange}
          options={jobOptions}
          className={FILTER_SELECT_CLASS}
          style={{ fontSize: 13 }}
        />
      </div>

      <ApplicantsTable
        applicants={applicants}
        onSelect={onSelectApplicant}
        onToggleBookmark={onToggleBookmark}
        onUpdateRating={onUpdateRating}
        onUpdateStage={onUpdateStage}
      />
    </>
  );
};

export default memo(RecruitmentApplicantsView);
