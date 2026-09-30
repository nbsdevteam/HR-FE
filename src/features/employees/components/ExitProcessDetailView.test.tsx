import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { arabicSource } from "@/i18n/source";
import type { DbExitChecklistItem, DbExitProcess } from "@/shared/hooks";
import { mapExitProcess } from "@/shared/api/mappers/lifecycle";
import type { ExitClearanceActions } from "../hooks/useExitClearanceActions";
import type { ExitChecklistLine } from "../types/lifecycle";
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
    ...overrides,
  };
  render(<ExitProcessDetailView {...props} />);
  return props;
};

const transitionButton = (target: string) =>
  document.querySelector(`[data-exit-transition="${target}"]`) as HTMLButtonElement | null;

describe("ExitProcessDetailView", () => {
  it("offers exactly the backend's allowed transitions, cancel last", () => {
    const props = renderView(baseProcess());
    const buttons = [...document.querySelectorAll("[data-exit-transition]")]
      .map(b => b.getAttribute("data-exit-transition"));
    expect(buttons).toEqual(["clearance", "cancelled"]);

    fireEvent.click(transitionButton("clearance")!);
    expect(props.onTransition).toHaveBeenCalledWith("7", "clearance");
    // The old hardcoded Disclaimer button sent "clearance" from any label; the
    // label is now the stage it starts.
    expect(screen.getByText(arabicSource("lifecycle.exit_start_clearance"))).toBeTruthy();
  });

  it("disables a gated move and says why", () => {
    renderView(baseProcess({
      status: "clearance",
      allowed_transitions: ["settlement", "cancelled"],
      transition_blockers: { settlement: ["clearance_checklist_incomplete"] },
    }));
    expect(transitionButton("settlement")!.disabled).toBe(true);
    expect(transitionButton("cancelled")!.disabled).toBe(false);
    expect(screen.getByText(arabicSource("lifecycle.exit_blocked_checklist"))).toBeTruthy();
  });

  it("shows no stage buttons and no edit once completed", () => {
    renderView(baseProcess({ status: "completed", editable: false, allowed_transitions: [] }));
    // Positive evidence the completed process really rendered...
    expect(document.querySelector('[data-exit-status="completed"]')).toBeTruthy();
    // ...and that it carries neither stage buttons nor an edit action.
    expect(document.querySelectorAll("[data-exit-transition]").length).toBe(0);
    expect(screen.queryByText(arabicSource("common.edit"))).toBeNull();
  });

  it("edits the open process through the update payload", async () => {
    const props = renderView(baseProcess());
    fireEvent.click(screen.getByText(arabicSource("common.edit")));
    expect(screen.getByText(arabicSource("lifecycle.exit_edit_details"))).toBeTruthy();
    fireEvent.click(screen.getByText(arabicSource("common.save_changes")));
    expect(props.onEditSave).toHaveBeenCalledWith("7", expect.objectContaining({
      exit_type: "resignation",
      exit_date: "2026-10-15",
      last_working_day: "2026-10-14",
      eos_amount: 1500000,
      eos_currency: "IQD",
    }));
  });

  it("keeps the employee name after the employee is archived", () => {
    renderView(baseProcess());
    expect(screen.getByText("Archived Leaver")).toBeTruthy();
  });

  it("lets a user tick only the lines the backend says they may", () => {
    const props = renderView(baseProcess());
    const finance = screen.getByLabelText("التسوية") as HTMLButtonElement;
    const itLine = screen.getByLabelText("الحاسوب") as HTMLButtonElement;
    expect(finance.disabled).toBe(false);
    expect(itLine.disabled).toBe(true);
    fireEvent.click(finance);
    expect(props.onChecklistToggle).toHaveBeenCalledWith("10", true);
  });

  it("shows the e-sign state from the process", () => {
    renderView(baseProcess({ status: "clearance", esign: { required: true, state: "pending" } }));
    expect(document.querySelector('[data-exit-esign="pending"]')).toBeTruthy();
    expect(screen.getByText(arabicSource("lifecycle.exit_esign_pending"))).toBeTruthy();
  });
});
