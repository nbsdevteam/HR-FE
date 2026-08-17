import type { DbApplicant, DbJobOpening } from "@/shared/hooks";
import CandidateBank from "./CandidateBank";

type RecruitmentCandidateBankViewProps = {
  applicants: DbApplicant[];
  jobs: DbJobOpening[];
  sortBy: "rank" | "rating" | "date" | "name" | "job" | "stage";
  onSelectApplicant: (applicant: DbApplicant) => void;
  onSortChange: (sortBy: "rank" | "rating" | "date" | "name" | "job" | "stage") => void;
  onToggleBookmark: (applicant: DbApplicant) => void;
  onUpdateRating: (id: string, rating: number) => void;
};

const RecruitmentCandidateBankView = ({
  applicants,
  jobs,
  sortBy,
  onSelectApplicant,
  onSortChange,
  onToggleBookmark,
  onUpdateRating,
}: RecruitmentCandidateBankViewProps) => (
  <CandidateBank
    applicants={applicants}
    jobs={jobs}
    onSelect={onSelectApplicant}
    onToggleBookmark={onToggleBookmark}
    onUpdateRating={onUpdateRating}
    sortBy={sortBy}
    setSortBy={onSortChange}
  />
);

export default RecruitmentCandidateBankView;
