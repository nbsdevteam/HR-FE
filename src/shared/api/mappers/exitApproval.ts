import type {
  ExitApproval,
  ExitApprovalStep,
  ExitSettlement,
  ExitSettlementLine,
  ExitSettlementWarning,
  ExitSigningLink,
} from "../../hooks";
import type { MyTask, MyTaskItem } from "../../hooks/myTasksTypes";
import { sid, sornull, num, bool, empty } from "./mapHelpers";

const mapApprovalStep = (r: any): ExitApprovalStep => {
  return {
    sequence: num(r.sequence),
    name: r.name || "",
    approver_type: r.approver_type || "",
    approver_permission: r.approver_permission || "",
    state: r.state || "not_reached",
    acted_by_name: r.acted_by_name || "",
    acted_at: r.acted_at || null,
    comment: r.comment || "",
    waiting_for: Array.isArray(r.waiting_for)
      ? r.waiting_for.map((who: any) => ({ id: sid(who.id), name: who.name || "" }))
      : [],
  };
}

export const mapExitApproval = (r: any): ExitApproval | null => {
  if (!r || typeof r !== "object") return null;
  return {
    request_id: sid(r.request_id),
    status: r.status || "",
    workflow_name: r.workflow_name || "",
    submitted_by_name: r.submitted_by_name || "",
    submitted_at: r.submitted_at || null,
    decided_at: r.decided_at || null,
    rejection_reason: r.rejection_reason || "",
    current_step: r.current_step
      ? { sequence: num(r.current_step.sequence), name: r.current_step.name || "", approver_type: r.current_step.approver_type || "" }
      : null,
    steps: Array.isArray(r.steps) ? r.steps.map(mapApprovalStep).sort((a: ExitApprovalStep, b: ExitApprovalStep) => a.sequence - b.sequence) : [],
  };
}

const mapSettlementLine = (r: any): ExitSettlementLine => {
  return {
    code: r.code || "",
    label: r.label || "",
    amount: num(r.amount),
    currency: r.currency || "IQD",
    basis: r.basis || null,
  };
}

const mapSettlementWarning = (r: any): ExitSettlementWarning => {
  return { code: r.code || "", custody_id: sornull(r.custody_id), item: r.item || "" };
}

/** Handles the saved statement and the not-saved `estimate` preview (which has no confirmation fields). */
export const mapExitSettlement = (r: any): ExitSettlement | null => {
  if (!r || typeof r !== "object") return null;
  const totals: Record<string, number> = {};
  if (r.totals && typeof r.totals === "object") {
    for (const [currency, amount] of Object.entries(r.totals)) totals[currency] = num(amount);
  }
  return {
    lines: Array.isArray(r.lines) ? r.lines.map(mapSettlementLine) : [],
    totals,
    warnings: Array.isArray(r.warnings) ? r.warnings.map(mapSettlementWarning) : [],
    computed_at: r.computed_at || null,
    confirmed: bool(r.confirmed),
    confirmed_by_name: r.confirmed_by_name || "",
    confirmed_at: r.confirmed_at || null,
  };
}

export const mapExitSigningLink = (r: any): ExitSigningLink | null => {
  if (!r || typeof r !== "object") return null;
  return {
    id: sid(r.id),
    state: r.state || "sent",
    sent_at: r.sent_at || null,
    expires_at: r.expires_at || null,
    emailed_to: r.emailed_to || empty,
    first_viewed_at: r.first_viewed_at || null,
    view_count: num(r.view_count),
    decided_at: r.decided_at || null,
    typed_name: r.typed_name || empty,
    decision_notes: r.decision_notes || empty,
    path: r.path || null,
    url: r.url || null,
  };
}

const mapTaskItem = (r: any): MyTaskItem => {
  return { line_id: sid(r.line_id), item: r.item || "", category: r.category || "" };
}

export const mapMyTask = (r: any): MyTask => {
  return {
    action: r.action || "",
    exit_id: sid(r.exit_id),
    employee_id: sid(r.employee_id),
    employee_name: r.employee_name || "",
    exit_type: r.exit_type || "",
    stage: r.stage || "",
    since: r.since || null,
    detail: r.detail || "",
    items: Array.isArray(r.items) ? r.items.map(mapTaskItem) : [],
  };
}
