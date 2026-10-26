import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { arabicSource } from "@/i18n/source";
import { mapExitProcess } from "@/shared/api/mappers/lifecycle";
import type { DbExitProcess, MyTask } from "@/shared/hooks";
import { progressAt } from "../utils/exitProgress.fixtures";
import ExitProcessTableRow from "./ExitProcessTableRow";

const clearance = {
  waiting_on: [{ owner: "it", people: [] }, { owner: "hr", people: [] }],
  still_required: [
    { code: "clearance_item", owner: "it", label: "Laptop returned", label_ar: "Laptop returned", line_id: 812 },
    { code: "clearance_item", owner: "hr", label: "Hand over files", label_ar: "Hand over files", line_id: 813 },
    { code: "move_to_settlement", owner: "hr" },
  ],
};

const row = (status: string, progress: Record<string, unknown>): DbExitProcess =>
  mapExitProcess({
    id: 7, employee_id: 12, employee_name: "Ahmed Ali", exit_type: "resignation", exit_date: "2026-10-14", status,
    progress: progressAt(status, { ...progress, next: (progress.still_required as unknown[] | undefined)?.[0] ?? null }),
  });

const renderRow = (process: DbExitProcess, task: MyTask | null = null) => {
  const onView = vi.fn();
  render(
    <table>
      <tbody>
        <ExitProcessTableRow
          process={process}
          index={0}
          emp={undefined}
          exitTypeLabels={{ resignation: "Resignation" }}
          statusLabels={{ clearance: "Clearance" }}
          statusColors={{}}
          categoryLabels={{ it: "IT", hr: "HR" }}
          task={task}
          onView={onView}
        />
      </tbody>
    </table>,
  );
  return onView;
};

describe("ExitProcessTableRow", () => {
  it("shows the stage, who it waits on, the next step with +N, and the days in stage", () => {
    renderRow(row("clearance", clearance));
    expect(screen.getByText("Ahmed Ali")).toBeTruthy();
    expect(document.querySelector('[data-exit-stepper="sm"]')).toBeTruthy();
    expect([...document.querySelectorAll("[data-exit-owner]")].map(o => o.textContent)).toEqual(["IT", "HR"]);
    expect(document.querySelector("[data-exit-next]")?.textContent).toContain("Laptop returned");
    expect(document.querySelector("[data-exit-next]")?.textContent).toContain("+2");
    expect(document.querySelector("[data-exit-days-tone]")?.getAttribute("data-exit-days-tone")).toBe("normal");
  });

  it("opens the record from the whole row, by click or Enter / Space, with no eye icon", () => {
    const onView = renderRow(row("clearance", clearance));
    const tr = document.querySelector("[data-exit-row]") as HTMLElement;
    expect(tr.getAttribute("role")).toBe("button");
    expect(document.querySelector("svg.lucide-eye")).toBeNull();

    fireEvent.click(tr);
    fireEvent.keyDown(tr, { key: "Enter" });
    fireEvent.keyDown(tr, { key: " " });
    fireEvent.keyDown(tr, { key: "a" });
    expect(onView).toHaveBeenCalledTimes(3);
    expect(onView).toHaveBeenCalledWith("7");
  });

  it("badges Your turn with the task's action when My tasks lists the process", () => {
    renderRow(row("clearance", clearance), { action: "clear_items", exit_id: "7" } as MyTask);
    expect(document.querySelector('[data-exit-your-turn="clear_items"]')).toBeTruthy();
    expect(screen.getByText(arabicSource("lifecycle.exit_progress_your_turn"))).toBeTruthy();
    expect(screen.getByText(arabicSource("lifecycle.task_title_clear_items"))).toBeTruthy();
  });

  it("turns the days amber from 3 and red from 7", () => {
    renderRow(row("clearance", { ...clearance, days_in_stage: 3 }));
    expect(document.querySelector("[data-exit-days-tone]")?.getAttribute("data-exit-days-tone")).toBe("warn");
  });

  it("leaves the days empty for a completed process", () => {
    renderRow(row("completed", { days_in_stage: 12 }));
    expect(document.querySelector("[data-exit-days-tone]")).toBeNull();
  });
});
