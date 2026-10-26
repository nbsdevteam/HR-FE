/**
 * The per-employee lifecycle summary (`POST /api/hr/employees/<id>/lifecycle`).
 * One backend read that both the Employees profile and the Life cycle screen
 * build from, so neither keeps its own copy of contract or exit state. It
 * covers one employee only; organization-wide totals stay on the list endpoints.
 */

/** A contract row on the summary: `current` is the latest active one, the rest are `history`. */
export interface LifecycleContract {
  id: string;
  contract_number: string | null;
  contract_type_name: string;
  start_date: string;
  end_date: string | null;
  status: string;
  probation_status: string;
  salary_amount: number | null;
  salary_currency: string;
}

/** The End of Service process on the summary; the backend's stage and blockers stay authoritative. */
export interface LifecycleExit {
  id: string;
  /** The process stage (`in_progress`, `clearance`, `settlement`, ...). */
  stage: string;
  /** ISO datetime with a +03:00 offset. */
  since: string | null;
  /** `HR`, `Clearance teams` or `Finance` while open, null once closed. A stage label, not an assigned person. */
  waiting_on: string | null;
  /** Every code the backend holds a move back with, flattened from its `transition_blockers` shape. */
  blockers: string[];
}

/** One stage the process reached, `at` an ISO datetime with a +03:00 offset. */
export interface LifecycleTimelineEntry {
  stage: string;
  at: string;
}

export interface EmployeeLifecycleSummary {
  employee: { id: string; name: string; status: string };
  contract: { current: LifecycleContract | null; history: LifecycleContract[] };
  /** Counts, not rows. */
  documents: { total: number; with_attachment: number };
  custody: { total: number; outstanding: number };
  exit: LifecycleExit | null;
  /** Exact codes the caller may act on: `start_exit`, `edit_exit`; empty when neither applies. */
  actions: string[];
  timeline: LifecycleTimelineEntry[];
}
