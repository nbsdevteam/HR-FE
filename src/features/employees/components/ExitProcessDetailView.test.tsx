import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { arabicSource } from "@/i18n/source";
import type { DbExitChecklistItem, DbExitProcess } from "@/shared/hooks";
import { mapExitProcess } from "@/shared/api/mappers/lifecycle";
import type { ExitClearanceActions } from "../hooks/useExitClearanceActions";
import type { ExitDecisionActions } from "../hooks/useExitDecisionActions";
import type { ExitChecklistLine } from "../types/lifecycle";
import { progressAt } from "../utils/exitProgress.fixtures";
import ExitProcessDetailView from "./ExitProcessDetailView";

const baseProcess = (overrides: Record<string, unknown> = {}): DbExitProcess =>
  mapExitProcess({
    id: 7,
    employee_id: 12,
    employee_name: "Archived Leaver",
    employee_active: true,
    exit_type: "resignation",
    exit_date: "2026-10-15",
    last_working_day: "2026-10-14",
    eos_amount: 1500000,
    eos_currency: "IQD",
    status: "in_progress",
    editable: true,
    allowed_transitions: ["clearance", "cancelled"],
    transition_blockers: {},
    esign: { required: false, state: "not_required" },
    clearance_notifications: {},
    progress: progressAt("in_progress"),
    my_actions: [],
    ...overrides,
  });

const items: DbExitChecklistItem[] = [
  { id: "1", name: "Final pay", name_ar: "التسوية", category: "finance" } as unknown as DbExitChecklistItem,
  { id: "2", name: "Laptop", name_ar: "الحاسوب", category: "it" } as unknown as DbExitChecklistItem,
];

const lines: ExitChecklistLine[] = [
  { id: "10", checklist_item_id: "1", is_completed: false, can_toggle: true },
  { id: "11", checklist_item_id: "2", is_completed: false, can_toggle: false },
];

const noopActions = (): ExitClearanceActions => ({
  approve: vi.fn().mockResolvedValue(true),
  rejectSection: vi.fn().mockResolvedValue(true),
  sign: vi.fn().mockResolvedValue(true),
  rejectSignature: vi.fn().mockResolvedValue(true),
  resend: vi.fn().mockResolvedValue(true),
});

const noopDecisionActions = (): ExitDecisionActions => ({
  approve: vi.fn().mockResolvedValue(true),
  reject: vi.fn().mockResolvedValue(true),
  recalculate: vi.fn().mockResolvedValue(true),
  confirmSettlement: vi.fn().mockResolvedValue(true),
  reopenSettlement: vi.fn().mockResolvedValue(true),
  issueLink: vi.fn().mockResolvedValue(true),
});

const renderView = (proc: DbExitProcess, overrides: Record<string, unknown> = {}) => {
  const props = {
    proc,
    emp: undefined,
    checklist: lines,
    exitItems: items,
    categoryLabels: { finance: "المالية", it: "تقنية المعلومات" },
    exitTypeLabels: { resignation: "استقالة" },
    statusLabels: {},
    statusColors: {},
    cardCls: "",
    inputCls: "",
    busy: false,
    clearanceActions: noopActions(),
    onBack: vi.fn(),
    onTransition: vi.fn(),
    onEditSave: vi.fn().mockResolvedValue(true),
    onChecklistToggle: vi.fn(),
    decisionActions: noopDecisionActions(),
    ...overrides,
  };
  render(<ExitProcessDetailView {...props} />);
  return props;
};

describe("ExitProcessDetailView", () => {
  it("leads with the stepper and the Now panel", () => {
    renderView(baseProcess({ status: "clearance", progress: progressAt("clearance") }));
    expect(document.querySelector('[data-exit-stepper="lg"]')).toBeTruthy();
    expect(document.querySelector('[data-exit-stage="clearance"]')?.getAttribute("data-exit-stage-state")).toBe("current");
    expect(document.querySelector('[data-exit-now="clearance"]')).toBeTruthy();
  });

  it("offers Cancel only when the backend lists it, and sends the cancelled move", () => {
    const { onTransition } = renderView(baseProcess({ my_actions: ["edit", "cancel"] }));
    fireEvent.click(document.querySelector("[data-exit-cancel]") as HTMLElement);
    expect(onTransition).toHaveBeenCalledWith("7", "cancelled");
  });

  it("builds no stage buttons from allowed_transitions", () => {
    renderView(baseProcess());
    expect(document.querySelectorAll("[data-exit-transition]").length).toBe(0);
    expect(document.querySelector("[data-exit-cancel]")).toBeNull();
  });

  it("shows no edit and no Now rows once completed", () => {
    renderView(baseProcess({ status: "completed", editable: false, my_actions: [], progress: progressAt("completed") }));
    expect(document.querySelector('[data-exit-status="completed"]')).toBeTruthy();
    expect(screen.queryByText(arabicSource("common.edit"))).toBeNull();
    expect(document.querySelectorAll("[data-exit-required]").length).toBe(0);
  });

  it("edits the open process through the update payload", async () => {
    const props = renderView(baseProcess({ my_actions: ["edit"] }));
    fireEvent.click(screen.getByText(arabicSource("common.edit")));
    expect(screen.getByText(arabicSource("lifecycle.exit_edit_details"))).toBeTruthy();
    fireEvent.click(screen.getByText(arabicSource("common.save_changes")));
    expect(props.onEditSave).toHaveBeenCalledWith("7", expect.objectContaining({
      exit_type: "resignation",
      exit_date: "2026-10-15",
      last_working_day: "2026-10-14",
    }));
  });

  it("never sends the amounts the settlement writes, and has no editable money fields", () => {
    const props = renderView(baseProcess({ my_actions: ["edit"] }));
    fireEvent.click(screen.getByText(arabicSource("common.edit")));
    expect(document.querySelectorAll('input[type="number"]')).toHaveLength(1); // notice period only
    fireEvent.click(screen.getByText(arabicSource("common.save_changes")));
    const payload = props.onEditSave.mock.calls[0][1] as Record<string, unknown>;
    expect(payload).not.toHaveProperty("eos_amount");
    expect(payload).not.toHaveProperty("eos_currency");
    expect(payload).not.toHaveProperty("final_settlement_amount");
  });

  it("keeps the employee name after the employee is archived", () => {
    renderView(baseProcess());
    expect(screen.getByText("Archived Leaver")).toBeTruthy();
  });

  it("lets a user tick only the lines the backend says they may", () => {
    const props = renderView(baseProcess({ status: "clearance", progress: progressAt("clearance") }));
    const finance = screen.getByLabelText("التسوية") as HTMLButtonElement;
    const itLine = screen.getByLabelText("الحاسوب") as HTMLButtonElement;
    expect(finance.disabled).toBe(false);
    expect(itLine.disabled).toBe(true);
    fireEvent.click(finance);
    expect(props.onChecklistToggle).toHaveBeenCalledWith("10", true);
  });

  it("folds a finished stage to its summary and greys one not reached", () => {
    renderView(baseProcess({ status: "clearance", progress: progressAt("clearance") }));
    const states = [...document.querySelectorAll("[data-exit-section-state]")].map(s => s.getAttribute("data-exit-section-state"));
    // approval (done), clearance (current), settlement and final approval (not started)
    expect(states).toEqual(["done", "current", "todo", "todo"]);
  });

  it("shows the e-sign state from the process", () => {
    renderView(baseProcess({ status: "clearance", esign: { required: true, state: "pending" }, progress: progressAt("clearance") }));
    expect(document.querySelector('[data-exit-esign="pending"]')).toBeTruthy();
    expect(screen.getByText(arabicSource("lifecycle.exit_esign_pending"))).toBeTruthy();
  });

  it("warns about open loans before settlement, with the remaining balance per currency", () => {
    renderView(baseProcess({
      status: "clearance",
      progress: progressAt("clearance"),
      warnings: [{ code: "open_loans", count: 2, loan_ids: [4, 9], remaining: { IQD: 500000 } }],
    }));
    const warning = document.querySelector('[data-exit-open-loans="2"]');
    expect(warning).toBeTruthy();
    expect(warning?.textContent).toContain("IQD");
    expect(screen.getByText(arabicSource("lifecycle.exit_open_loans_note"))).toBeTruthy();
  });

  it("does not show the open-loans warning once settlement starts, where loans are statement lines", () => {
    renderView(baseProcess({
      status: "settlement",
      progress: progressAt("settlement"),
      warnings: [{ code: "open_loans", count: 1, loan_ids: [4], remaining: { IQD: 1 } }],
    }));
    expect(document.querySelector("[data-exit-open-loans]")).toBeNull();
  });
});
