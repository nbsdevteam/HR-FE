import {
  Briefcase, BookmarkCheck, Building2, Clock, FileCheck, GraduationCap,
  Mail, MapPin, Phone, Sparkles, UserPlus, Users, Workflow,
} from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { type DbApplicant } from "@/shared/hooks";

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
  { id: "jobs", label: arabicSource("recruitment.vacancies"), icon: Briefcase },
  { id: "applicants", label: arabicSource("recruitment.applicants"), icon: Users },
  { id: "ai", label: arabicSource("recruitment.ai_tab"), icon: Sparkles },
  { id: "pipeline", label: arabicSource("recruitment.recruitment_path"), icon: Workflow },
  { id: "bank", label: arabicSource("recruitment.candidates_bank"), icon: BookmarkCheck },
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

export const applicantInfoRows: ReadonlyArray<{
  icon: typeof Mail;
  label: string;
  dir?: "ltr";
  getValue: (applicant: DbApplicant) => string | null | undefined;
}> = [
  { icon: Mail, label: arabicSource("common.post"), dir: "ltr", getValue: (a) => a.email },
  { icon: Phone, label: arabicSource("recruitment.phone"), dir: "ltr", getValue: (a) => a.phone },
  { icon: MapPin, label: arabicSource("common.city"), getValue: (a) => a.city },
  { icon: Building2, label: arabicSource("common.current_company"), getValue: (a) => a.current_company },
  { icon: GraduationCap, label: arabicSource("recruitment.education"), getValue: (a) => a.education },
  {
    icon: Briefcase,
    label: arabicSource("common.years_of_experience"),
    getValue: (a) => (a.experience_years > 0 ? `${a.experience_years} ${arabicSource("common.years")}` : null),
  },
  { icon: Clock, label: arabicSource("common.submission_date"), dir: "ltr", getValue: (a) => a.applied_date },
  { icon: Users, label: arabicSource("common.source"), getValue: (a) => a.source },
];

export const applicantIrFallbackFields: ReadonlyArray<{
  label: string;
  weight: string;
  getValue: (applicant: DbApplicant, stages: readonly string[]) => number;
}> = [
  { label: arabicSource("common.evaluation"), weight: "40%", getValue: (a) => (a.rating / 5) * 100 },
  {
    label: arabicSource("recruitment.progress_of_stages"),
    weight: "20%",
    getValue: (a, stages) => {
      const idx = stages.indexOf(a.stage);
      return idx >= 0 ? (idx / (stages.length - 1)) * 100 : 0;
    },
  },
  { label: arabicSource("recruitment.experience"), weight: "25%", getValue: (a) => Math.min(a.experience_years / 15, 1) * 100 },
  { label: arabicSource("common.skills"), weight: "15%", getValue: (a) => Math.min((a.skills?.length || 0) / 8, 1) * 100 },
];
