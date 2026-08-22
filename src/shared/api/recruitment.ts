import { hrCall } from "./client";
import { mapJobOpening, mapApplicant } from "./mappers";
import type { DbJobOpening, DbApplicant, JobRankingStats, ApplicationLink } from "../hooks";
import { items, eid } from "./httpHelpers";

export const fetchJobOpenings = async (): Promise<DbJobOpening[]> => {
  const rows = await items<any>("/api/hr/jobs/list", { limit: 200 });
  return rows.map(mapJobOpening);
}

export const createJobOpening = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/jobs/create", payload);
}

export const updateJobOpening = async (jobId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/jobs/${eid(jobId)}/update`, payload);
}

export const deleteJobOpening = async (jobId: string | number) => {
  return hrCall(`/api/hr/jobs/${eid(jobId)}/delete`, {});
}

export const fetchApplicants = async (jobOpeningId?: string | number): Promise<DbApplicant[]> => {
  const params: Record<string, unknown> = { limit: 500 };
  if (jobOpeningId) params.job_opening_id = eid(jobOpeningId);
  const rows = await items<any>("/api/hr/applicants/list", params);
  return rows.map(mapApplicant);
}

export const createApplicant = async (payload: Record<string, unknown>) => {
  const params = { ...payload };
  if (params.job_opening_id != null) {
    params.job_opening_id = eid(params.job_opening_id as string | number);
  }
  return hrCall("/api/hr/applicants/create", params);
}

export const updateApplicant = async (applicantId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/applicants/${eid(applicantId)}/update`, payload);
}

export const deleteApplicant = async (applicantId: string | number) => {
  return hrCall(`/api/hr/applicants/${eid(applicantId)}/delete`, {});
}

export const uploadApplicantResume = async (
  applicantId: string | number,
  fileDataBase64: string,
  fileName?: string,
) => {
  return hrCall(`/api/hr/applicants/${eid(applicantId)}/upload_resume`, {
    file_data: fileDataBase64,
    file_name: fileName,
  });
}

/**
 * Download an applicant's CV.
 *
 * The attachment is private and we authenticate with a JWT, so a plain
 * `<a href="/web/content/...">` cannot work — the browser sends no auth on a
 * link navigation. Fetch the bytes through the authenticated API instead and
 * hand the browser a Blob.
 */
export const downloadApplicantResume = async (applicantId: string | number) => {
  const res = await hrCall<{
    file_name: string;
    mimetype: string;
    file_data: string;
  }>(`/api/hr/applicants/${eid(applicantId)}/resume`, {});

  const binary = atob(res.file_data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const url = URL.createObjectURL(new Blob([bytes], { type: res.mimetype }));
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = res.file_name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    // Revoke on the next tick — revoking synchronously can cancel the download.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

// ─── AI resume screening / Initial Rating ─────────────────────────────

/** Queue (or with `sync`, immediately run) the AI screening for one applicant. */
export const screenApplicant = async (
  applicantId: string | number,
  options: { force?: boolean; sync?: boolean } = {},
): Promise<DbApplicant> => {
  const row = await hrCall<any>(`/api/hr/applicants/${eid(applicantId)}/screen`, {
    force: Boolean(options.force),
    sync: Boolean(options.sync),
  });
  return mapApplicant(row);
}

export const fetchApplicantScreening = async (applicantId: string | number): Promise<{
  applicant: DbApplicant;
  parsed_profile: Record<string, unknown>;
  runs: ScreeningRun[];
}> => {
  const data = await hrCall<any>(`/api/hr/applicants/${eid(applicantId)}/screening`, {});
  return {
    applicant: mapApplicant(data.applicant || {}),
    parsed_profile: data.parsed_profile || {},
    runs: (data.runs || []) as ScreeningRun[],
  };
}

export const bulkScreenApplicants = async (params: {
  applicantIds?: Array<string | number>;
  jobOpeningId?: string | number;
  force?: boolean;
}): Promise<{ queued: number; skipped: number }> => {
  return hrCall("/api/hr/applicants/bulk_screen", {
    applicant_ids: params.applicantIds?.map(eid),
    job_opening_id: params.jobOpeningId != null ? eid(params.jobOpeningId) : undefined,
    force: Boolean(params.force),
  });
}

export const fetchJobRanking = async (
  jobId: string | number,
  params: { minIr?: number; stage?: string } = {},
): Promise<{ job: DbJobOpening; items: DbApplicant[]; stats: JobRankingStats }> => {
  const data = await hrCall<any>(`/api/hr/jobs/${eid(jobId)}/ranking`, {
    limit: 200,
    min_ir: params.minIr,
    stage: params.stage,
  });
  return {
    job: mapJobOpening(data.job || {}),
    items: (data.items || []).map((row: any) => ({
      ...mapApplicant(row),
      rank: row.rank ?? null,
    })),
    stats: data.stats as JobRankingStats,
  };
}

export const getJobApplyLink = async (
  jobId: string | number,
  params: { rotate?: boolean; expires_on?: string | null; max_submissions?: number; active?: boolean } = {},
): Promise<ApplicationLink> => {
  return hrCall<ApplicationLink>(`/api/hr/jobs/${eid(jobId)}/apply_link`, params);
}

export const fetchApplicationLinks = async (jobOpeningId?: string | number): Promise<ApplicationLink[]> => {
  return items<ApplicationLink>("/api/hr/recruitment/links/list", {
    limit: 200,
    job_opening_id: jobOpeningId != null ? eid(jobOpeningId) : undefined,
  });
}

export const updateApplicationLink = async (
  linkId: string | number,
  payload: Record<string, unknown>,
): Promise<ApplicationLink> => {
  return hrCall<ApplicationLink>(`/api/hr/recruitment/links/${eid(linkId)}/update`, payload);
}

export const deleteApplicationLink = async (linkId: string | number) => {
  return hrCall(`/api/hr/recruitment/links/${eid(linkId)}/delete`, {});
}

export const fetchScreeningSettings = async (): Promise<ScreeningSettings> => {
  return hrCall<ScreeningSettings>("/api/hr/recruitment/screening_settings", {});
}

export const updateScreeningSettings = async (
  payload: Partial<{
    weights: Record<string, number>;
    min_confidence: number;
    retention_months: number;
    max_resume_mb: number;
    model: string;
  }>,
): Promise<ScreeningSettings> => {
  return hrCall<ScreeningSettings>("/api/hr/recruitment/screening_settings/update", payload);
}

export interface ScreeningRun {
  id: number;
  model_name: string;
  prompt_version: string;
  ir_score: number;
  confidence: number;
  prompt_tokens: number;
  output_tokens: number;
  latency_ms: number;
  used_vision: boolean;
  state: string;
  error: string;
  created_at: string;
}

export interface ScreeningSettings {
  weights: Record<string, number>;
  default_weights: Record<string, number>;
  min_confidence: number;
  retention_months: number;
  max_resume_mb: number;
  model: string;
  api_key_configured: boolean;
  prompt_version: string;
  runs_total: number;
  runs_failed: number;
}
