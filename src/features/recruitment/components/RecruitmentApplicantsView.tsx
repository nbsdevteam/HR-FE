import { memo } from "react";
import { Search } from "lucide-react";
import { Select } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DbApplicant, DbJobOpening } from "@/shared/hooks";
import { ALL_STAGES } from "../constants/recruitment";
import ApplicantsTable from "./ApplicantsTable";

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
  const handleSearchTermChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    onSearchTermChange(event.target.value);
  };

  const handleFilterStageChange = (value: string): void => {
    onFilterStageChange(value);
  };

  const handleFilterJobChange = (value: string): void => {
    onFilterJobChange(value);
  };

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder={arabicSource("recruitment.search_by_name_email_phone_skills")}
            value={searchTerm}
            onChange={handleSearchTermChange}
            className="w-full h-10 ps-9 pe-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
            style={{ fontSize: 13 }}
          />
        </div>
        <Select
          value={filterStage}
          onChange={handleFilterStageChange}
          options={[
            { value: arabicSource("common.all"), label: arabicSource("recruitment.all_stages") },
            ...ALL_STAGES,
          ]}
          className="h-10 px-3 rounded-lg border border-border bg-input-background text-foreground cursor-pointer"
          style={{ fontSize: 13 }}
        />
        <Select
          value={filterJob}
          onChange={handleFilterJobChange}
          options={[
            { value: arabicSource("common.all"), label: arabicSource("recruitment.all_jobs") },
            ...jobs.map((job) => ({ value: job.id, label: job.title })),
          ]}
          className="h-10 px-3 rounded-lg border border-border bg-input-background text-foreground cursor-pointer"
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
