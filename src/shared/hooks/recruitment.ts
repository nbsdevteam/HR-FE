import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import * as odooData from "@/shared/api/odooData";
import { useCachedList } from "./core";

// ——— Recruitment Hooks ———

export interface DbJobOpening {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  status: string;
  posted_date: string;
  deadline: string | null;
  requirements: string[] | null;
  description: string | null;
  salary_range: string | null;
  created_at: string;
  updated_at: string;
  applicant_count?: number;
  hired_count?: number;
  // AI screening spec — what the IR matcher compares a CV against.
  required_skills?: JobSkillRequirement[];
  nice_to_have_skills?: JobSkillRequirement[];
  min_experience_years?: number;
  max_experience_years?: number;
  education_level?: string;
  required_languages?: string[];
  required_certs?: string[];
  ir_auto_shortlist?: number;
  ir_weights?: Record<string, number> | null;
}

export interface JobSkillRequirement {
  name: string;
  /** 1 = nice, 2 = important, 3 = must-have (a missing must-have costs IR). */
  weight?: number;
}

export type IrStatus = "none" | "pending" | "processing" | "done" | "failed" | "stale";
export type IrBand = "excellent" | "strong" | "moderate" | "weak" | "unfit" | "";

export interface IrComponent {
  score: number;
  weight: number;
  contribution: number;
  evidence: string;
}

export interface IrPenalty {
  code: string;
  amount: number;
  detail: string;
}

export interface IrBreakdown {
  components?: Record<string, IrComponent>;
  penalties?: IrPenalty[];
  weights?: Record<string, number>;
  raw_total?: number;
}

export interface IrRedFlag {
  code: string;
  detail: string;
  severity: string;
}

export interface DbApplicant {
  id: string;
  name: string;
  job_opening_id: string;
  stage: string;
  applied_date: string;
  rating: number;
  resume_url: string | null;
  notes: string | null;
  phone: string | null;
  email: string | null;
  skills: string[] | null;
  experience_years: number;
  education: string | null;
  current_company: string | null;
  city: string | null;
  gender: string | null;
  birth_date: string | null;
  interview_notes: string | null;
  is_bookmarked: boolean;
  source: string | null;
  expected_salary: number | null;
  salary_currency: string | null;
  created_at: string;
  updated_at: string;
  // joined fields
  job_title?: string;
  job_department?: string;
  job_status?: string;
  // Initial Rating (IR) produced by the AI screening pipeline
  ir_score?: number;
  ir_band?: IrBand;
  ir_status?: IrStatus;
  ir_breakdown?: IrBreakdown | null;
  ir_summary_ar?: string;
  ir_summary_en?: string;
  ir_confidence?: number;
  ir_red_flags?: IrRedFlag[];
  ir_missing_info?: string[];
  ir_needs_review?: boolean;
  ir_screened_at?: string | null;
  ir_error?: string;
  matched_skills?: string[];
  missing_skills?: string[];
  suggested_job_id?: string | null;
  suggested_job_title?: string;
  suggested_job_score?: number;
  reference_code?: string;
  /** Present only in /jobs/<id>/ranking responses. */
  rank?: number | null;
}

export interface JobRankingStats {
  total: number;
  screened: number;
  pending: number;
  failed: number;
  stale: number;
  needs_review: number;
  average_ir: number;
  bands: Record<string, number>;
}

export interface ApplicationLink {
  id: number;
  name: string;
  token: string;
  url: string;
  scope: "job" | "all_open";
  job_opening_id: number | false;
  job_title: string;
  active: boolean;
  expires_on: string | null;
  max_submissions: number;
  submission_count: number;
  unusable_reason: string;
  /** False when the backend has no SPA origin configured — `url` is relative. */
  base_url_configured?: boolean;
}

export const useJobOpenings = () => {
  const { data: jobs, loading, refetch } = useCachedList("jobOpenings", () => odooData.fetchJobOpenings(), "Failed to load job openings");
  return { jobs, loading, refetch };
}

export const useApplicants = () => {
  const { data: applicants, loading, refetch } = useCachedList("applicants", () => odooData.fetchApplicants(), "Failed to load applicants");
  return { applicants, loading, refetch };
}

/**
 * Candidates for one job, ranked by their Initial Rating.
 *
 * While any candidate is still queued the query polls every 10s, because
 * screening runs asynchronously on the backend cron and HR should watch
 * scores land without refreshing the page. `loading` only reflects the first
 * load (`isLoading`) so those background polls stay silent, same as before.
 */
export const useJobRanking = (jobId: string | null) => {
  const query = useQuery<{ items: DbApplicant[]; stats: JobRankingStats }, Error>({
    queryKey: ["jobRanking", jobId],
    queryFn: () => odooData.fetchJobRanking(jobId as string),
    enabled: Boolean(jobId),
    staleTime: 0,
    refetchInterval: (q) => (q.state.data?.stats?.pending ? 10_000 : false),
  });

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query.refetch]);

  return {
    items: query.data?.items ?? [],
    stats: query.data?.stats ?? null,
    loading: query.isLoading,
    refetch,
  };
}
