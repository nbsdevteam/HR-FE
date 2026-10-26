/**
 * The per-employee lifecycle summary (`POST /api/hr/employees/<id>/lifecycle`).
 * One backend read that both the Employees profile and the Life cycle screen
 * build from, so neither keeps its own copy of contract or exit state.
 */

/** A contract row on the summary — the current one or an entry of the history. */
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

/** The open End of Service on the summary; the backend's stage and blockers stay authoritative. */
export interface LifecycleExit {
  id: string;
  /** The process stage (`in_progress`, `clearance`, `settlement`, ...). */
  stage: string;
  since: string | null;
  /** A stage label, not an assigned person, until the later phases add named owners. */
  waiting_on: string;
  blockers: string[];
}

export interface LifecycleTimelineEntry {
  id: string;
  kind: string;
  at: string | null;
  title: string;
  detail: string;
}

export interface EmployeeLifecycleSummary {
  employee: { id: string; name: string; status: string };
  contract: { current: LifecycleContract | null; history: LifecycleContract[] };
  /** Counts by state, as the backend names them (e.g. `total`, `expiring_soon`). */
  documents: Record<string, number>;
  custody: Record<string, number>;
  exit: LifecycleExit | null;
  /** Action codes the backend offers the caller, e.g. a start or edit End of Service. */
  actions: string[];
  timeline: LifecycleTimelineEntry[];
}
