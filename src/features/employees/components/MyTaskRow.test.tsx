import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { arabicSource } from "@/i18n/source";
import { mapMyTask } from "@/shared/api/mappers/exitApproval";
import type { MyTaskActionsBundle } from "../hooks/useMyTaskActions";
import MyTaskRow from "./MyTaskRow";

const bundle = (): MyTaskActionsBundle => ({
  busy: false,
  decision: {
    approve: vi.fn().mockResolvedValue(true),
    reject: vi.fn().mockResolvedValue(true),
    recalculate: vi.fn().mockResolvedValue(true),
    confirmSettlement: vi.fn().mockResolvedValue(true),
    reopenSettlement: vi.fn().mockResolvedValue(true),
    issueLink: vi.fn().mockResolvedValue(true),
  },
  openExit: vi.fn(),
  toggleChecklist: vi.fn().mockResolvedValue(undefined),
  transition: vi.fn().mockResolvedValue(undefined),
});

const renderTask = (raw: Record<string, unknown>, actions = bundle()) => {
  const task = mapMyTask({ exit_id: 12, employee_id: 5, employee_name: "Suraj", exit_type: "resignation", stage: "clearance", ...raw });
  render(<ul><MyTaskRow task={task} actions={actions} cardCls="" /></ul>);
  return actions;
};

const clickByAttr = (selector: string): void => {
  fireEvent.click(document.querySelector(selector) as HTMLElement);
};

describe("MyTaskRow", () => {
  it("submits an End of Service for approval with the backend's own transition", () => {
    const actions = renderTask({ action: "submit_exit", stage: "in_progress", detail: "Wrong exit date" });
    expect(screen.getByText("Wrong exit date")).toBeTruthy();
    fireEvent.click(screen.getByText(arabicSource("lifecycle.exit_submit_for_approval")));
    expect(actions.transition).toHaveBeenCalledWith("12", "approval");
  });

  it("ticks each clearance line the user's team owns", () => {
    const actions = renderTask({ action: "clear_items", items: [{ line_id: 31, item: "Laptop", category: "it" }, { line_id: 32, item: "Badge", category: "admin" }] });
    clickByAttr('[data-task-tick="32"]');
    expect(actions.toggleChecklist).toHaveBeenCalledWith("32", true);
    expect(document.querySelectorAll("[data-task-tick]")).toHaveLength(2);
  });

  it("approves with an optional comment", async () => {
    const actions = renderTask({ action: "approve_exit", stage: "approval", detail: "Direct Manager" });
    fireEvent.click(screen.getByText(arabicSource("lifecycle.exit_approval_approve")));
    fireEvent.click(screen.getAllByText(arabicSource("lifecycle.exit_approval_approve")).at(-1) as HTMLElement);
    await waitFor(() => expect(actions.decision.approve).toHaveBeenCalledWith("12", ""));
  });

  it("moves to settlement, completes, and opens the record", () => {
    const start = renderTask({ action: "start_settlement" });
    fireEvent.click(document.querySelector('[data-task-action="start_settlement"] button') as HTMLElement);
    expect(start.transition).toHaveBeenCalledWith("12", "settlement");
  });

  it("completes on final approval and opens the record from any task", () => {
    const actions = renderTask({ action: "final_approval", stage: "settlement" });
    fireEvent.click(screen.getByText(arabicSource("lifecycle.exit_complete_process")));
    expect(actions.transition).toHaveBeenCalledWith("12", "completed");
    fireEvent.click(screen.getByText(arabicSource("lifecycle.task_open")));
    expect(actions.openExit).toHaveBeenCalledWith("12");
  });

  it("sends a settlement to review rather than confirming it blind", () => {
    const actions = renderTask({ action: "confirm_settlement", stage: "settlement" });
    fireEvent.click(screen.getByText(arabicSource("lifecycle.task_review_statement")));
    expect(actions.openExit).toHaveBeenCalledWith("12");
    expect(actions.decision.confirmSettlement).not.toHaveBeenCalled();
  });
});
