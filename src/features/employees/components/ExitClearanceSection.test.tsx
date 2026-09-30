import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { arabicSource } from "@/i18n/source";
import type { DbExitChecklistItem, DbExitProcess } from "@/shared/hooks";
import { mapExitProcess } from "@/shared/api/mappers/lifecycle";
import type { ExitClearanceActions } from "../hooks/useExitClearanceActions";
import type { ExitChecklistLine } from "../types/lifecycle";
import ExitProcessDetailView from "./ExitProcessDetailView";

const clearanceProcess = (overrides: Record<string, unknown> = {}): DbExitProcess =>
  mapExitProcess({
    id: 7,
    employee_id: 12,
    employee_name: "Leaver",
    exit_type: "resignation",
    exit_date: "2026-10-15",
    status: "clearance",
    editable: true,
    allowed_transitions: ["settlement", "cancelled"],
    transition_blockers: {},
    ...overrides,
  });

const items: DbExitChecklistItem[] = [
  { id: "1", name_ar: "التسوية", category: "finance" } as unknown as DbExitChecklistItem,
  { id: "2", name_ar: "الحاسوب", category: "it" } as unknown as DbExitChecklistItem,
];

const lines: ExitChecklistLine[] = [
  { id: "10", checklist_item_id: "1", is_completed: false, can_toggle: true },
  { id: "11", checklist_item_id: "2", is_completed: false, can_toggle: true },
];

const noopActions = (): ExitClearanceActions => ({
  approve: vi.fn().mockResolvedValue(true),
  rejectSection: vi.fn().mockResolvedValue(true),
  sign: vi.fn().mockResolvedValue(true),
  rejectSignature: vi.fn().mockResolvedValue(true),
  resend: vi.fn().mockResolvedValue(true),
});

const itSection = (overrides: Record<string, unknown> = {}) => ({
  id: 3,
  category: "it",
  state: "pending_approval",
  approver_count: 1,
  can_approve: true,
  signatures: [],
  ...overrides,
});

const renderView = (proc: DbExitProcess, clearanceActions: ExitClearanceActions = noopActions()) => {
  render(
    <ExitProcessDetailView
      proc={proc}
      emp={undefined}
      checklist={lines}
      exitItems={items}
      categoryLabels={{ finance: "المالية", it: "تقنية المعلومات" }}
      exitTypeLabels={{ resignation: "استقالة" }}
      statusLabels={{}}
      statusColors={{}}
      cardCls=""
      inputCls=""
      busy={false}
      clearanceActions={clearanceActions}
      onBack={vi.fn()}
      onTransition={vi.fn()}
      onEditSave={vi.fn().mockResolvedValue(true)}
      onChecklistToggle={vi.fn()}
    />,
  );
  return clearanceActions;
};

const withSection = (section: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
  clearanceProcess({ clearance_sections: [section], ...extra });

describe("clearance sections", () => {
  it("renders nothing extra while the backend sends no sections", () => {
    renderView(clearanceProcess());
    // Positive evidence the process rendered, so the absence below is not an empty pass.
    expect(document.querySelector('[data-exit-status="clearance"]')).toBeTruthy();
    expect(document.querySelector("[data-exit-section]")).toBeNull();
    expect((screen.getByLabelText("الحاسوب") as HTMLButtonElement).disabled).toBe(false);
  });

  it("gates only the governed category's lines", () => {
    renderView(withSection(itSection()));
    expect(document.querySelectorAll("[data-exit-section]").length).toBe(1);
    // The ungoverned finance line still ticks: the control proving the lock is scoped.
    expect((screen.getByLabelText("التسوية") as HTMLButtonElement).disabled).toBe(false);
    const itLine = screen.getByLabelText("الحاسوب") as HTMLButtonElement;
    expect(itLine.disabled).toBe(true);
    expect(itLine.title).toBe(arabicSource("lifecycle.exit_clr_items_locked"));
  });

  it("approves through the action when the backend allows it", async () => {
    const actions = renderView(withSection(itSection()));
    fireEvent.click(screen.getByText(arabicSource("lifecycle.exit_clr_approve")));
    await waitFor(() => expect(actions.approve).toHaveBeenCalledWith("3"));
  });

  it("hides approve from a caller without the permission", () => {
    renderView(withSection(itSection({ can_approve: false })));
    expect(document.querySelector('[data-exit-section="pending_approval"]')).toBeTruthy();
    expect(screen.queryByText(arabicSource("lifecycle.exit_clr_approve"))).toBeNull();
  });

  it("warns when nobody holds the approver permission", () => {
    renderView(withSection(itSection({ approver_count: 0 })));
    expect(document.querySelector("[data-exit-no-approvers]")).toBeTruthy();
  });

  it("requires a reason before a section can be rejected", async () => {
    const actions = renderView(withSection(itSection()));
    fireEvent.click(screen.getByText(arabicSource("lifecycle.exit_clr_reject")));
    const confirm = screen.getByText(arabicSource("lifecycle.exit_clr_reject_confirm")).closest("button")!;
    expect(confirm.disabled).toBe(true);
    fireEvent.change(document.querySelector("[data-exit-reject-reason]")!, { target: { value: "  عهدة غير مسلّمة " } });
    expect(confirm.disabled).toBe(false);
    fireEvent.click(confirm);
    await waitFor(() => expect(actions.rejectSection).toHaveBeenCalledWith("3", "عهدة غير مسلّمة"));
  });

  const signingSection = (extra: Record<string, unknown> = {}) => itSection({
    state: "signing",
    can_approve: false,
    signatures: [
      { id: 22, sequence: 2, signer_role: "employee", signer_name: "Suraj", state: "pending", can_resend: true },
      { id: 21, sequence: 1, signer_role: "hr_manager", signer_name: "Muntadher", state: "sent", can_sign: true },
    ],
    ...extra,
  });

  it("lists signers in order and signs with a typed name", async () => {
    const actions = renderView(withSection(signingSection()));
    const order = [...document.querySelectorAll("[data-exit-signature]")].map(r => r.getAttribute("data-exit-signature"));
    expect(order).toEqual(["sent", "pending"]);
    // One Sign (the named signer's) and one Resend (the employee's link).
    expect(screen.getAllByText(arabicSource("lifecycle.exit_clr_sign")).length).toBe(1);
    expect(screen.getAllByText(arabicSource("lifecycle.exit_clr_resend")).length).toBe(1);

    fireEvent.click(screen.getByText(arabicSource("lifecycle.exit_clr_sign")));
    const confirm = screen.getByText(arabicSource("lifecycle.exit_clr_sign_confirm")).closest("button")!;
    expect(confirm.disabled).toBe(true);
    fireEvent.change(document.querySelector("[data-exit-sign-name]")!, { target: { value: " Muntadher A. " } });
    fireEvent.click(confirm);
    await waitFor(() => expect(actions.sign).toHaveBeenCalledWith("21", "Muntadher A.", ""));
  });

  it("keeps the dialog open when the backend refuses the signature", async () => {
    const actions = { ...noopActions(), sign: vi.fn().mockResolvedValue(false) };
    renderView(withSection(signingSection()), actions);
    fireEvent.click(screen.getByText(arabicSource("lifecycle.exit_clr_sign")));
    fireEvent.change(document.querySelector("[data-exit-sign-name]")!, { target: { value: "X" } });
    fireEvent.click(screen.getByText(arabicSource("lifecycle.exit_clr_sign_confirm")).closest("button")!);
    await waitFor(() => expect(actions.sign).toHaveBeenCalled());
    expect(document.querySelector("[data-exit-sign-name]")).toBeTruthy();
  });

  it("resends a signing link through the action", async () => {
    const actions = renderView(withSection(signingSection()));
    fireEvent.click(screen.getByText(arabicSource("lifecycle.exit_clr_resend")));
    await waitFor(() => expect(actions.resend).toHaveBeenCalledWith("22"));
  });

  it("explains the two settlement blockers the clearance gates add", () => {
    renderView(clearanceProcess({
      transition_blockers: { settlement: ["clearance_approval_incomplete", "clearance_signatures_incomplete"] },
    }));
    expect(screen.getByText(arabicSource("lifecycle.exit_blocked_clearance_approval"))).toBeTruthy();
    expect(screen.getByText(arabicSource("lifecycle.exit_blocked_clearance_signatures"))).toBeTruthy();
  });
});
