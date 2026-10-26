import type {
  EmployeeLifecycleSummary,
  LifecycleContract,
  LifecycleExit,
  LifecycleTimelineEntry,
} from "../../hooks/employeeLifecycleTypes";
import { sid, sornull, num, empty } from "./mapHelpers";

const mapLifecycleContract = (r: any): LifecycleContract => {
  return {
    id: sid(r.id),
    contract_number: r.contract_number || null,
    contract_type_name: r.contract_type_name || "",
    start_date: r.start_date || "",
    end_date: r.end_date || null,
    status: r.status || "active",
    probation_status: r.probation_status || "",
    salary_amount: r.salary_amount ?? null,
    salary_currency: r.salary_currency || "IQD",
  };
}

/** `blockers` has the shape of `transition_blockers` (`{ stage: [code] }`); the codes are what the UI needs. */
const flattenBlockers = (r: any): string[] => {
  if (Array.isArray(r)) return r.map(String);
  if (r && typeof r === "object") return Array.from(new Set(Object.values(r).flatMap((codes) => (Array.isArray(codes) ? codes.map(String) : []))));
  return [];
}

const mapLifecycleExit = (r: any): LifecycleExit | null => {
  const id = sornull(r?.id);
  if (!id) return null;
  return {
    id,
    stage: r.status || "in_progress",
    since: r.since || null,
    waiting_on: r.waiting_on || null,
    blockers: flattenBlockers(r.blockers),
  };
}

const mapTimelineEntry = (r: any): LifecycleTimelineEntry => {
  return { stage: r.stage || "", at: r.at || "" };
}

export const mapEmployeeLifecycle = (r: any): EmployeeLifecycleSummary => {
  return {
    employee: {
      id: sid(r?.employee?.id),
      name: r?.employee?.name || empty,
      status: r?.employee?.status || "",
    },
    contract: {
      current: r?.contract?.current ? mapLifecycleContract(r.contract.current) : null,
      history: Array.isArray(r?.contract?.history) ? r.contract.history.map(mapLifecycleContract) : [],
    },
    documents: { total: num(r?.documents?.total), with_attachment: num(r?.documents?.with_attachment) },
    custody: { total: num(r?.custody?.total), outstanding: num(r?.custody?.outstanding) },
    exit: mapLifecycleExit(r?.exit),
    actions: Array.isArray(r?.actions) ? r.actions.map(String) : [],
    timeline: Array.isArray(r?.timeline) ? r.timeline.map(mapTimelineEntry) : [],
  };
}
