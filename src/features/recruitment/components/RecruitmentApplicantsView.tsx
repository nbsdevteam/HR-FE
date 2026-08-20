import { memo } from "react";
import { Search } from "lucide-react";
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
}: RecruitmentApplicantsViewProps) => (
  <>
    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder={arabicSource("recruitment.search_by_name_email_phone_skills")}
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          className="w-full h-10 ps-9 pe-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
          style={{ fontSize: 13 }}
        />
      </div>
      <select value={filterStage} onChange={(event) => onFilterStageChange(event.target.value)} className="h-10 px-3 rounded-lg border border-border bg-input-background text-foreground cursor-pointer" style={{ fontSize: 13 }}>
        <option value={arabicSource("common.all")}>{arabicSource("recruitment.all_stages")}</option>
        {ALL_STAGES.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
      </select>
      <select value={filterJob} onChange={(event) => onFilterJobChange(event.target.value)} className="h-10 px-3 rounded-lg border border-border bg-input-background text-foreground cursor-pointer" style={{ fontSize: 13 }}>
        <option value={arabicSource("common.all")}>{arabicSource("recruitment.all_jobs")}</option>
        {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
      </select>
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

export default memo(RecruitmentApplicantsView);
