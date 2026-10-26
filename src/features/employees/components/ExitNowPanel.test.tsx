import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { arabicSource } from "@/i18n/source";
import { mapExitProcess } from "@/shared/api/mappers/lifecycle";
import type { DbExitProcess } from "@/shared/hooks";
import type { ExitDecisionActions } from "../hooks/useExitDecisionActions";
import { progressAt } from "../utils/exitProgress.fixtures";
import ExitNowPanel from "./ExitNowPanel";

const decisionActions = (): ExitDecisionActions => ({
  approve: vi.fn().mockResolvedValue(true),
  reject: vi.fn().mockResolvedValue(true),
  recalculate: vi.fn().mockResolvedValue(true),
  confirmSettlement: vi.fn().mockResolvedValue(true),
  reopenSettlement: vi.fn().mockResolvedValue(true),
  issueLink: vi.fn().mockResolvedValue(true),
});

const proc = (status: string, progress: Record<string, unknown>, my_actions: string[] = [], extra: Record<string, unknown> = {}): DbExitProcess =>
  mapExitProcess({ id: 7, employee_id: 12, status, progress: progressAt(status, progress), my_actions, ...extra });

const categoryLabels = { hr: "HR", it: "IT", custodies: "Custody", finance: "Finance" };

const renderPanel = (p: DbExitProcess, over: Record<string, unknown> = {}) => {
  const props = {
    proc: p,
    statusLabels: { clearance: "Clearance", settlement: "Settlement", approval: "Approval" },
    categoryLabels,
    toggleableLineIds: new Set<string>(["812"]),
    busy: false,
    decisionActions: decisionActions(),
    cardCls: "",
    onTransition: vi.fn(),
    onChecklistToggle: vi.fn(),
    ...over,
  };
  render(<ExitNowPanel {...props} />);
  return props;
};

const clearance = {
  waiting_on: [{ owner: "it", people: [] }, { owner: "hr", people: [] }, { owner: "custodies", people: [] }],
  still_required: [
    { code: "clearance_item", owner: "it", label: "Laptop returned", label_ar: "إرجاع الحاسوب", line_id: 812 },
    { code: "clearance_item", owner: "hr", label: "Hand over files", label_ar: "Hand over files", line_id: 813 },
    { code: "custody_item", owner: "custodies", label: "Work phone", custody_id: 77 },
    { code: "move_to_settlement", owner: "hr" },
  ],
};

const rowCodes = () => [...document.querySelectorAll("[data-exit-required]")].map(r => r.getAttribute("data-exit-required"));
const button = (action: string) => document.querySelector(`[data-exit-row-action="${action}"]`) as HTMLElement | null;

describe("ExitNowPanel, clearance", () => {
  it("lists every owner waiting and every item still required, in the backend's order", () => {
    renderPanel(proc("clearance", clearance));
    const owners = [...document.querySelectorAll("h3 [data-exit-owner]")].map(o => o.textContent);
    expect(owners).toEqual(["IT", "HR", "Custody"]);
    expect(rowCodes()).toEqual(["clearance_item", "clearance_item", "custody_item", "move_to_settlement"]);
  });

  it("offers Mark done only on a line the user may tick, and ticks it", () => {
    const props = renderPanel(proc("clearance", clearance));
    expect(document.querySelectorAll('[data-exit-row-action="tick"]')).toHaveLength(1);
    fireEvent.click(button("tick") as HTMLElement);
    expect(props.onChecklistToggle).toHaveBeenCalledWith("812", true);
  });

  it("draws Move to settlement as held behind the open items, with no button unless my_actions lists it", () => {
    renderPanel(proc("clearance", clearance));
    expect(document.querySelector('[data-exit-required="move_to_settlement"]')?.getAttribute("data-exit-held")).toBe("true");
    expect(screen.getByText(arabicSource("lifecycle.exit_progress_held"))).toBeTruthy();
    expect(button("start_settlement")).toBeNull();
  });

  it("sends the settlement move from its row once the backend lists start_settlement", () => {
    const props = renderPanel(proc("clearance", { ...clearance, still_required: [clearance.still_required[3]] }, ["start_settlement"]));
    expect(document.querySelector('[data-exit-required="move_to_settlement"]')?.hasAttribute("data-exit-held")).toBe(false);
    fireEvent.click(button("start_settlement") as HTMLElement);
    expect(props.onTransition).toHaveBeenCalledWith("7", "settlement");
  });
});

describe("ExitNowPanel, settlement", () => {
  const settlement = {
    waiting_on: [{ owner: "finance", people: [] }],
    still_required: [
      { code: "confirm_settlement", owner: "finance" },
      { code: "employee_signature", owner: "employee", detail: "not_sent" },
      { code: "final_approval", owner: "hr_manager" },
    ],
  };

  it("confirms the statement from the Finance row", async () => {
    const props = renderPanel(proc("settlement", settlement, ["confirm_settlement"]));
    expect(rowCodes()).toEqual(["confirm_settlement", "employee_signature", "final_approval"]);
    fireEvent.click(button("confirm") as HTMLElement);
    await waitFor(() => expect(props.decisionActions.confirmSettlement).toHaveBeenCalledWith("7"));
    expect(button("issue")).toBeNull();
    expect(button("complete")).toBeNull();
  });

  it("issues the signing link and gives the final approval from their rows", async () => {
    const props = renderPanel(proc("settlement", settlement, ["issue_signature", "complete"]));
    fireEvent.click(button("issue") as HTMLElement);
    await waitFor(() => expect(props.decisionActions.issueLink).toHaveBeenCalledWith("7"));
    fireEvent.click(button("complete") as HTMLElement);
    expect(props.onTransition).toHaveBeenCalledWith("7", "completed");
  });
});

describe("ExitNowPanel, approval and closed processes", () => {
  const approval = {
    waiting_on: [{ owner: "approver", people: [{ id: 5, name: "Ali Hassan" }] }],
    still_required: [{ code: "approval_step", owner: "approver", label: "Direct Manager", people: [{ id: 5, name: "Ali Hassan" }] }],
  };

  it("names the approver and needs a reason to reject", async () => {
    const props = renderPanel(proc("approval", approval, ["approve", "reject"]));
    expect(document.querySelector("h3 [data-exit-owner]")?.textContent).toBe("Ali Hassan");

    fireEvent.click(button("reject") as HTMLElement);
    const confirm = screen.getAllByText(arabicSource("lifecycle.exit_approval_reject")).at(-1) as HTMLElement;
    expect((confirm.closest("button") as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(document.querySelector("[data-exit-decision-comment]") as HTMLTextAreaElement, { target: { value: "Missing paperwork" } });
    fireEvent.click(confirm);
    await waitFor(() => expect(props.decisionActions.reject).toHaveBeenCalledWith("7", "Missing paperwork"));
  });

  it("shows only the closing date for a completed or cancelled process", () => {
    renderPanel(proc("completed", {}, [], { completed_at: "2026-11-01T09:00:00+03:00" }));
    expect(screen.getByText(arabicSource("lifecycle.exit_progress_completed_on"), { exact: false })).toBeTruthy();
    expect(rowCodes()).toEqual([]);
  });
});
