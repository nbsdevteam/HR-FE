import { arabicSource } from "@/i18n/source";
import type { IrBand } from "@/shared/hooks";

export const JOB_STATUS_TO_ODOO: Record<string, string> = {
  "مفتوح": "open", "مغلق": "closed", "قيد المراجعة": "on_hold", "مسودة": "draft",
};
/** Selectable vacancy statuses, in the order HR moves through them. */
export const JOB_STATUSES = ["مسودة", "مفتوح", "قيد المراجعة", "مغلق"];
export const ODOO_TO_JOB_STATUS: Record<string, string> = {
  open: "مفتوح", closed: "مغلق", on_hold: "قيد المراجعة", draft: "مسودة",
};
export const JOB_TYPE_TO_ODOO: Record<string, string> = {
  "دوام كامل": "full_time", "دوام جزئي": "part_time", "عقد مؤقت": "contract",
};
export const ODOO_TO_JOB_TYPE: Record<string, string> = {
  full_time: "دوام كامل", part_time: "دوام جزئي", contract: "عقد مؤقت",
  temporary: "عقد مؤقت", internship: "تدريب",
};
export const STAGE_TO_ODOO: Record<string, string> = {
  "تقديم": "applied", "فرز أولي": "screening", "مقابلة": "interview_1",
  "اختبار": "assessment", "عرض": "offer", "مقبول": "hired", "مرفوض": "rejected",
};
export const ODOO_TO_STAGE: Record<string, string> = {
  applied: "تقديم", screening: "فرز أولي", interview_1: "مقابلة", interview_2: "مقابلة",
  assessment: "اختبار", offer: "عرض", hired: "مقبول", rejected: "مرفوض",
};
export const GENDER_TO_ODOO: Record<string, string> = { "ذكر": "male", "أنثى": "female" };
export const ODOO_TO_GENDER: Record<string, string> = { male: "ذكر", female: "أنثى" };

export const STAGES = [arabicSource("common.introduction"), arabicSource("common.initial_sort"), arabicSource("common.interview"), arabicSource("common.test"), arabicSource("common.width"), arabicSource("common.accepted")] as const;
export const ALL_STAGES = [...STAGES, arabicSource("common.rejected_3")] as const;

export const stageColors: Record<string, string> = {
  [arabicSource("common.introduction")]: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  [arabicSource("common.initial_sort")]: "bg-purple-500/10 border-purple-500/30 text-purple-400",
  [arabicSource("common.interview")]: "bg-primary/10 border-primary/30 text-primary",
  [arabicSource("common.test")]: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
  [arabicSource("common.width")]: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  [arabicSource("common.accepted")]: "bg-green-500/10 border-green-500/30 text-green-400",
  [arabicSource("common.rejected_3")]: "bg-destructive/10 border-destructive/30 text-destructive",
};

export const statusColors: Record<string, string> = {
  [arabicSource("common.is_open")]: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  [arabicSource("common.closed")]: "bg-muted/30 border-border text-muted-foreground",
  [arabicSource("common.is_under_review")]: "bg-primary/10 border-primary/30 text-primary",
};

export const sourceOptions = [arabicSource("common.live"), arabicSource("recruitment.linkedin"), arabicSource("recruitment.referral_of_an_employee"), arabicSource("recruitment.recruitment_site"), arabicSource("common.other")];

/* ──────── Ranking Algorithm ──────── */
/**
 * Fallback estimate for applicants the AI has not screened yet. It is driven by
 * the manual star rating and a raw skills count, so it never reads the CV and
 * never compares against the job — it is deliberately labelled as an estimate
 * in the UI and is always superseded by the backend IR once screening lands.
 */

export const BAND_STYLES: Record<Exclude<IrBand, "">, { text: string; color: string }> = {
  excellent: { text: arabicSource("recruitment.excellent"), color: "text-green-400 bg-green-500/10 border-green-500/30" },
  strong: { text: arabicSource("recruitment.very_good"), color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  moderate: { text: arabicSource("recruitment.good"), color: "text-primary bg-primary/10 border-primary/30" },
  weak: { text: arabicSource("recruitment.weak"), color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  unfit: { text: arabicSource("recruitment.band_unfit"), color: "text-red-400 bg-red-500/10 border-red-500/30" },
};

export const IR_COMPONENT_LABELS: Record<string, string> = {
  skills_match: arabicSource("recruitment.comp_skills_match"),
  experience_relevance: arabicSource("recruitment.comp_experience_relevance"),
  resume_quality: arabicSource("recruitment.comp_resume_quality"),
  education_fit: arabicSource("recruitment.comp_education_fit"),
  bonus_skills: arabicSource("recruitment.comp_bonus_skills"),
  stability_progression: arabicSource("recruitment.comp_stability_progression"),
  logistics_fit: arabicSource("recruitment.comp_logistics_fit"),
};

// `ir_missing_info` mixes two sources: free-text sentences written by the model
// and stable snake_case keys from the backend's deterministic CV checklist.
// Only the keys can be translated, and leaving them unmapped put raw tokens
// like "education" in front of HR next to a full English sentence.
export const MISSING_INFO_LABELS: Record<string, string> = {
  email: arabicSource("recruitment.missing_email"),
  phone: arabicSource("recruitment.missing_phone"),
  work_experience: arabicSource("recruitment.missing_work_experience"),
  experience_dates: arabicSource("recruitment.missing_experience_dates"),
  education: arabicSource("recruitment.missing_education"),
  skills_not_evidenced: arabicSource("recruitment.missing_skills_not_evidenced"),
};

export const IR_STATUS_LABELS: Record<string, string> = {
  pending: arabicSource("recruitment.ir_pending"),
  processing: arabicSource("recruitment.ir_processing"),
  failed: arabicSource("recruitment.ir_failed"),
  stale: arabicSource("recruitment.ir_stale"),
  none: arabicSource("recruitment.ir_not_screened"),
};

export const EDUCATION_LEVELS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "none", label: arabicSource("common.not_specified") },
  { value: "high_school", label: arabicSource("recruitment.preparatory_school") },
  { value: "diploma", label: arabicSource("recruitment.diploma") },
  { value: "bachelor", label: arabicSource("recruitment.bachelor_s_degree") },
  { value: "master", label: arabicSource("recruitment.master") },
  { value: "phd", label: arabicSource("recruitment.ph_d") },
];

/* ──────── Star Rating Component ──────── */
