import { memo } from "react";
import type { DbApplicant } from "@/shared/hooks";
import type { sortTypes } from "../types";
import CandidateBank from "./CandidateBank";

type RecruitmentCandidateBankViewProps = {
  applicants: DbApplicant[];
  sortBy: sortTypes;
  onSelectApplicant: (applicant: DbApplicant) => void;
  onSortChange: (sortBy: sortTypes) => void;
  onToggleBookmark: (applicant: DbApplicant) => void;
  onUpdateRating: (id: string, rating: number) => void;
};

const RecruitmentCandidateBankView = ({
  applicants,
  sortBy,
  onSelectApplicant,
  onSortChange,
  onToggleBookmark,
  onUpdateRating,
}: RecruitmentCandidateBankViewProps) => (
  <CandidateBank
    applicants={applicants}
    onSelect={onSelectApplicant}
    onToggleBookmark={onToggleBookmark}
    onUpdateRating={onUpdateRating}
    sortBy={sortBy}
    setSortBy={onSortChange}
  />
);

export default memo(RecruitmentCandidateBankView);
