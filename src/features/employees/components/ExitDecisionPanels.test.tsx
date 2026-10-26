import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { arabicSource } from "@/i18n/source";
import { mapExitProcess } from "@/shared/api/mappers/lifecycle";
import type { DbExitProcess } from "@/shared/hooks";
import type { ExitDecisionActions } from "../hooks/useExitDecisionActions";
import ExitApprovalPanel from "./ExitApprovalPanel";
import ExitSettlementPanel from "./ExitSettlementPanel";
import ExitSigningPanel from "./ExitSigningPanel";
import { signingLinkUrl, whatsappShareUrl } from "./ExitSigningLinkActions";

const actions = (): ExitDecisionActions => ({
  approve: vi.fn().mockResolvedValue(true),
  reject: vi.fn().mockResolvedValue(true),
  recalculate: vi.fn().mockResolvedValue(true),
  confirmSettlement: vi.fn().mockResolvedValue(true),
  reopenSettlement: vi.fn().mockResolvedValue(true),
  issueLink: vi.fn().mockResolvedValue(true),
});

const proc = (overrides: Record<string, unknown> = {}): DbExitProcess =>
  mapExitProcess({ id: 7, employee_id: 12, status: "approval", exit_type: "termination", ...overrides });

const approval = {
  request_id: 3, status: "pending", workflow_name: "End of Service", submitted_by_name: "Hana",
  submitted_at: "2026-11-01T09:00:00+03:00", decided_at: null, rejection_reason: "",
  current_step: { sequence: 2, name: "HR Manager", approver_type: "permission" },
  steps: [
    { sequence: 2, name: "HR Manager", approver_type: "permission", state: "pending", waiting_for: [{ id: 5, name: "Layla" }] },
    { sequence: 1, name: "Direct Manager", approver_type: "manager", state: "approved", acted_by_name: "Omar", acted_at: "2026-11-01T10:00:00+03:00", comment: "ok" },
    { sequence: 3, name: "General Manager", approver_type: "permission", state: "not_reached" },
  ],
};

describe("ExitApprovalPanel", () => {
  it("lists the steps in order with their state, who acted and who the pending step waits for", () => {
    render(<ExitApprovalPanel proc={proc({ approval })} canDecide={false} actions={actions()} cardCls="" />);

    const steps = Array.from(document.querySelectorAll("[data-approval-step]"));
    expect(steps.map(step => step.getAttribute("data-approval-state"))).toEqual(["approved", "pending", "not_reached"]);
    expect(screen.getByText("Omar")).toBeTruthy();
    expect(screen.getByText("Layla")).toBeTruthy();
    expect(document.querySelector("[data-exit-approve]")).toBeNull();
  });

  it("offers Approve and Reject only to someone the backend lists as the approver", () => {
    render(<ExitApprovalPanel proc={proc({ approval })} canDecide actions={actions()} cardCls="" />);
    expect(document.querySelector("[data-exit-approve]")).toBeTruthy();
    expect(document.querySelector("[data-exit-reject]")).toBeTruthy();
  });

  it("requires a reason to reject and sends it", async () => {
    const decide = actions();
    render(<ExitApprovalPanel proc={proc({ approval })} canDecide actions={decide} cardCls="" />);

    fireEvent.click(document.querySelector("[data-exit-reject]") as HTMLElement);
    const confirm = screen.getAllByText(arabicSource("lifecycle.exit_approval_reject")).at(-1) as HTMLElement;
    expect((confirm.closest("button") as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(document.querySelector("[data-exit-decision-comment]") as HTMLTextAreaElement, { target: { value: "Missing paperwork" } });
    fireEvent.click(confirm);
    await waitFor(() => expect(decide.reject).toHaveBeenCalledWith("7", "Missing paperwork"));
  });

  it("shows why a rejected process went back to in progress", () => {
    render(
      <ExitApprovalPanel
        proc={proc({ status: "in_progress", approval: { ...approval, status: "rejected", rejection_reason: "Wrong exit date" } })}
        canDecide={false}
        actions={actions()}
        cardCls=""
      />,
    );
    expect(document.querySelector("[data-exit-rejection]")?.textContent).toContain("Wrong exit date");
  });

  it("renders nothing before the process is submitted", () => {
    const { container } = render(<ExitApprovalPanel proc={proc({ approval: null })} canDecide actions={actions()} cardCls="" />);
    expect(container.textContent).toBe("");
  });
});

const settlement = {
  lines: [
    { code: "eos_benefit", label: "EOS", amount: 3000000, currency: "IQD" },
    { code: "loan", label: "Loan 4", amount: -500000, currency: "IQD" },
    { code: "custody", label: "Laptop (lost)", amount: -200, currency: "USD" },
  ],
  totals: { IQD: 2500000, USD: -200 },
  warnings: [{ code: "custody_value_missing", custody_id: 9, item: "Phone" }],
  computed_at: "2026-11-02T09:00:00+03:00", confirmed: false, confirmed_by_name: "", confirmed_at: null,
};

describe("ExitSettlementPanel", () => {
  const panel = (p: DbExitProcess, over: Partial<Parameters<typeof ExitSettlementPanel>[0]> = {}) =>
    render(<ExitSettlementPanel proc={p} canConfirm canRecalculate canPreview actions={actions()} cardCls="" {...over} />);

  it("shows the server's lines, deductions and per-currency totals, never converted", () => {
    panel(proc({ status: "settlement", settlement }));

    expect(document.querySelectorAll("[data-settlement-line]")).toHaveLength(3);
    expect(document.querySelector('[data-settlement-line="loan"]')?.textContent).toContain("-");
    expect(document.querySelector('[data-settlement-total="IQD"]')?.textContent).toContain("IQD");
    expect(document.querySelector('[data-settlement-total="USD"]')?.textContent).toContain("USD");
    expect(document.querySelector('[data-settlement-warning="custody_value_missing"]')?.textContent).toContain("Phone");
  });

  it("lets Finance confirm an open statement, and reopen a confirmed one", async () => {
    const decide = actions();
    const { rerender } = panel(proc({ status: "settlement", settlement }), { actions: decide });
    fireEvent.click(document.querySelector("[data-exit-settlement-confirm]") as HTMLElement);
    await waitFor(() => expect(decide.confirmSettlement).toHaveBeenCalledWith("7"));

    rerender(
      <ExitSettlementPanel
        proc={proc({ status: "settlement", settlement: { ...settlement, confirmed: true, confirmed_by_name: "Finance Lead" } })}
        canConfirm canRecalculate canPreview actions={decide} cardCls=""
      />,
    );
    expect(document.querySelector("[data-exit-settlement-confirm]")).toBeNull();
    fireEvent.click(document.querySelector("[data-exit-settlement-reopen]") as HTMLElement);
    await waitFor(() => expect(decide.reopenSettlement).toHaveBeenCalledWith("7"));
  });

  it("hides the confirm action from anyone who is not Finance", () => {
    panel(proc({ status: "settlement", settlement }), { canConfirm: false, canRecalculate: false });
    expect(document.querySelector("[data-exit-settlement-confirm]")).toBeNull();
    expect(document.querySelector("[data-exit-settlement-recalculate]")).toBeNull();
  });

  it("offers an estimate preview before settlement, only to those who may", () => {
    panel(proc({ status: "clearance", settlement: null }));
    expect(document.querySelector("[data-exit-settlement-preview]")).toBeTruthy();
  });

  it("renders nothing before settlement for someone who cannot preview", () => {
    const { container } = panel(proc({ status: "clearance", settlement: null }), { canPreview: false });
    expect(container.textContent).toBe("");
  });
});

const signature = {
  id: 1, state: "sent", sent_at: "2026-11-02T09:00:00+03:00", expires_at: "2026-11-16T09:00:00+03:00",
  emailed_to: "leaver@example.com", view_count: 0,
};

describe("ExitSigningPanel", () => {
  it("shows the link actions only when the backend sent the link", () => {
    const { rerender } = render(
      <ExitSigningPanel proc={proc({ status: "settlement", signature: { ...signature, path: "/exit-sign/abc", url: "https://hr.example/exit-sign/abc" } })} canIssue actions={actions()} cardCls="" />,
    );
    expect(document.querySelector("[data-exit-signing-link]")).toBeTruthy();
    expect(document.querySelector("[data-exit-signing-copy]")).toBeTruthy();

    rerender(<ExitSigningPanel proc={proc({ status: "settlement", signature })} canIssue={false} actions={actions()} cardCls="" />);
    expect(document.querySelector("[data-exit-signing-link]")).toBeNull();
    expect(document.querySelector('[data-exit-signing="sent"]')).toBeTruthy();
  });

  it("builds the shared link from the url, or the origin plus path when the server has no public base", () => {
    expect(signingLinkUrl({ ...mapExitProcess({ signature: { ...signature, path: "/exit-sign/abc", url: "https://hr.example/exit-sign/abc" } }).signature! }))
      .toBe("https://hr.example/exit-sign/abc");
    expect(signingLinkUrl(mapExitProcess({ signature: { ...signature, path: "/exit-sign/abc", url: "" } }).signature!))
      .toBe(`${window.location.origin}/exit-sign/abc`);
    expect(whatsappShareUrl("https://hr.example/exit-sign/a b")).toBe("https://wa.me/?text=https%3A%2F%2Fhr.example%2Fexit-sign%2Fa%20b");
  });

  it("renders nothing until a link exists", () => {
    const { container } = render(<ExitSigningPanel proc={proc({ signature: null })} canIssue actions={actions()} cardCls="" />);
    expect(container.textContent).toBe("");
  });
});
