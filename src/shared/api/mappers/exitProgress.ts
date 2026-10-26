import type {
  ExitProgress,
  ExitProgressPerson,
  ExitProgressStage,
  ExitRequiredItem,
  ExitWaitingOn,
} from "../../hooks";
import { sid, sornull, num } from "./mapHelpers";

const mapPerson = (r: any): ExitProgressPerson => {
  return { id: sid(r?.id), name: r?.name || "" };
}

const mapPeople = (r: any): ExitProgressPerson[] => {
  return Array.isArray(r) ? r.map(mapPerson) : [];
}

const mapStage = (r: any): ExitProgressStage => {
  return { key: r?.key || "", state: r?.state || "todo" };
}

const mapWaitingOn = (r: any): ExitWaitingOn => {
  return { owner: r?.owner || "", people: mapPeople(r?.people) };
}

/** Ids arrive as numbers or `false`; an absent id stays null. */
const mapRequiredItem = (r: any): ExitRequiredItem => {
  return {
    code: r?.code || "",
    owner: r?.owner || "",
    label: r?.label || "",
    label_ar: r?.label_ar || "",
    line_id: sornull(r?.line_id),
    custody_id: sornull(r?.custody_id),
    detail: r?.detail || "",
    people: mapPeople(r?.people),
  };
}

/**
 * The backend's `progress` block, kept as sent. A record without one (an older
 * server) maps to an empty block, which renders nothing instead of a guess.
 */
export const mapExitProgress = (r: any): ExitProgress => {
  return {
    stages: Array.isArray(r?.stages) ? r.stages.map(mapStage) : [],
    percent: num(r?.percent),
    waiting_on: Array.isArray(r?.waiting_on) ? r.waiting_on.map(mapWaitingOn) : [],
    still_required: Array.isArray(r?.still_required) ? r.still_required.map(mapRequiredItem) : [],
    next: r?.next ? mapRequiredItem(r.next) : null,
    since: r?.since || null,
    days_in_stage: typeof r?.days_in_stage === "number" ? r.days_in_stage : null,
  };
}
