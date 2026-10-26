import type {
  EmployeeLifecycleSummary,
  LifecycleContract,
  LifecycleExit,
  LifecycleTimelineEntry,
} from "../../hooks/employeeLifecycleTypes";
import { sid, sornull, empty } from "./mapHelpers";

const mapLifecycleContract = (r: any): LifecycleContract => {
  return {
    id: sid(r.id),
    contract_number: r.contract_number || null,
    contract_type_name: r.contract_type_name || r.contract_type || r.type_name || "",
    start_date: r.start_date || "",
    end_date: r.end_date || null,
    status: r.status || "active",
    probation_status: r.probation_status || "",
    salary_amount: r.salary_amount ?? null,
    salary_currency: r.salary_currency || r.currency || "IQD",
  };
}

const mapLifecycleExit = (r: any): LifecycleExit | null => {
  if (!r || typeof r !== "object") return null;
  const id = sornull(r.id ?? r.exit_id);
  if (!id) return null;
  return {
    id,
    stage: r.stage || r.status || r.exit_stage || "in_progress",
    since: r.since || null,
    waiting_on: r.waiting_on || "",
    blockers: Array.isArray(r.blockers) ? r.blockers.map(String) : [],
  };
}

/** Counts arrive as `{ state: n }`; anything else is ignored rather than guessed at. */
const mapCounts = (r: any): Record<string, number> => {
  const counts: Record<string, number> = {};
  if (r && typeof r === "object" && !Array.isArray(r)) {
    for (const [key, value] of Object.entries(r)) {
      if (typeof value === "number") counts[key] = value;
    }
  }
  return counts;
}

/** Accepts `["code"]`, `[{ code, enabled }]` or `{ code: true }` — only the offered codes survive. */
export const mapLifecycleActions = (r: any): string[] => {
  if (Array.isArray(r)) {
    return r.flatMap((entry: any) => {
      if (typeof entry === "string") return [entry];
      const code = entry?.code ?? entry?.key ?? entry?.action ?? entry?.id;
      const offered = entry?.enabled ?? entry?.allowed ?? entry?.available ?? true;
      return code && offered ? [String(code)] : [];
    });
  }
  if (r && typeof r === "object") {
    return Object.entries(r).filter(([, offered]) => offered === true).map(([code]) => code);
  }
  return [];
}

const mapTimelineEntry = (r: any, index: number): LifecycleTimelineEntry => {
  return {
    id: sid(r.id) || String(index),
    kind: r.kind || r.type || r.event || "",
    at: r.at || r.date || r.created_at || null,
    title: r.title || r.label || r.name || r.event || "",
    detail: r.detail || r.description || r.note || empty,
  };
}

export const mapEmployeeLifecycle = (r: any): EmployeeLifecycleSummary => {
  const history = Array.isArray(r?.contract?.history) ? r.contract.history.map(mapLifecycleContract) : [];
  return {
    employee: {
      id: sid(r?.employee?.id),
      name: r?.employee?.name || empty,
      status: r?.employee?.status || "",
    },
    contract: {
      current: r?.contract?.current ? mapLifecycleContract(r.contract.current) : null,
      history,
    },
    documents: mapCounts(r?.documents),
    custody: mapCounts(r?.custody),
    exit: mapLifecycleExit(r?.exit),
    actions: mapLifecycleActions(r?.actions),
    timeline: Array.isArray(r?.timeline) ? r.timeline.map(mapTimelineEntry) : [],
  };
}

