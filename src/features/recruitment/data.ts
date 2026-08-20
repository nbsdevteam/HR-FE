import { Briefcase, BookmarkCheck, FileCheck, UserPlus, Users } from "lucide-react";
import { arabicSource } from "@/i18n/source";

export const applicantsTableColumns = [
  { label: "", key: null },
  { label: arabicSource("recruitment.advanced"), key: "name" },
  { label: arabicSource("recruitment.function"), key: "job" },
  { label: arabicSource("common.submission_date"), key: "date" },
  { label: arabicSource("common.stage"), key: "stage" },
  { label: arabicSource("common.evaluation"), key: "rating" },
  { label: arabicSource("recruitment.ranking"), key: "rank" },
  { label: "", key: null },
] as const;

export const recruitmentTabsData = [
  { id: "jobs", label: arabicSource("recruitment.vacancies") },
  { id: "applicants", label: arabicSource("recruitment.applicants") },
  { id: "ai", label: arabicSource("recruitment.ai_tab") },
  { id: "pipeline", label: arabicSource("recruitment.recruitment_path") },
  { id: "bank", label: arabicSource("recruitment.candidates_bank") },
] as const;

export const aiScreeningStatFields = [
  { key: "total", label: arabicSource("common.total_applicants") },
  { key: "screened", label: arabicSource("recruitment.screened_count") },
  { key: "pending", label: arabicSource("recruitment.ir_pending") },
  { key: "average_ir", label: arabicSource("recruitment.average_ir"), suffix: "%" },
] as const;

export const recruitmentStatFields = [
  { key: "openJobs", label: arabicSource("recruitment.vacancies_2"), icon: Briefcase },
  { key: "totalApplicants", label: arabicSource("common.total_applicants"), icon: Users },
  { key: "interviewing", label: arabicSource("recruitment.under_interview"), icon: UserPlus },
  { key: "hired", label: arabicSource("recruitment.hired"), icon: FileCheck },
  { key: "bookmarked", label: arabicSource("recruitment.preferred_candidates"), icon: BookmarkCheck },
] as const;
