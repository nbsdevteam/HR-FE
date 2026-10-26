import { describe, expect, it } from "vitest";
import { mapEmployeeLifecycle } from "./employeeLifecycle";
import { mapEmployee } from "./core";
import { mapExitProcess } from "./lifecycle";

describe("mapEmployeeLifecycle", () => {
  it("maps the backend summary blocks as sent", () => {
    const summary = mapEmployeeLifecycle({
      employee: { id: 7, name: "Suraj", status: "active" },
      contract: {
        current: { id: 3, contract_number: "C-3", contract_type_name: "Permanent", start_date: "2026-01-01", status: "active" },
        history: [{ id: 2, status: "expired", start_date: "2025-01-01", end_date: "2025-12-31" }],
      },
      documents: { total: 4, with_attachment: 3 },
      custody: { total: 5, outstanding: 2 },
      exit: {
        id: 12, status: "clearance", since: "2026-09-01T09:00:00+03:00", waiting_on: "Clearance teams",
        blockers: { settlement: ["custody_not_returned", "clearance_checklist_incomplete"], completed: ["custody_not_returned"] },
      },
      actions: ["edit_exit"],
      timeline: [{ stage: "in_progress", at: "2026-08-30T09:00:00+03:00" }, { stage: "clearance", at: "2026-09-01T09:00:00+03:00" }],
    });

    expect(summary.employee).toEqual({ id: "7", name: "Suraj", status: "active" });
    expect(summary.contract.current).toMatchObject({ contract_number: "C-3", contract_type_name: "Permanent" });
    expect(summary.contract.history).toHaveLength(1);
    expect(summary.documents).toEqual({ total: 4, with_attachment: 3 });
    expect(summary.custody).toEqual({ total: 5, outstanding: 2 });
    expect(summary.exit).toEqual({
      id: "12",
      stage: "clearance",
      since: "2026-09-01T09:00:00+03:00",
      waiting_on: "Clearance teams",
      blockers: ["custody_not_returned", "clearance_checklist_incomplete"],
    });
    expect(summary.actions).toEqual(["edit_exit"]);
    expect(summary.timeline).toEqual([
      { stage: "in_progress", at: "2026-08-30T09:00:00+03:00" },
      { stage: "clearance", at: "2026-09-01T09:00:00+03:00" },
    ]);
  });

  it("has no exit, no contract and no actions when the backend sends none", () => {
    const summary = mapEmployeeLifecycle({
      employee: { id: 7 }, contract: { current: null, history: [] }, exit: null, actions: [], timeline: [],
    });
    expect(summary.exit).toBeNull();
    expect(summary.contract.current).toBeNull();
    expect(summary.actions).toEqual([]);
    expect(summary.documents).toEqual({ total: 0, with_attachment: 0 });
  });

  it("has no waiting_on once the process is closed", () => {
    const summary = mapEmployeeLifecycle({ exit: { id: 12, status: "completed", waiting_on: null, blockers: {} } });
    expect(summary.exit?.waiting_on).toBeNull();
    expect(summary.exit?.blockers).toEqual([]);
  });
});

describe("list payload exit fields", () => {
  it("reads exit_id and exit_stage for the Leaving chip", () => {
    const leaving = mapEmployee({ id: 5, exit_id: 12, exit_stage: "settlement" });
    expect(leaving.exit_id).toBe("12");
    expect(leaving.exit_stage).toBe("settlement");
    const staying = mapEmployee({ id: 6, exit_id: false, exit_stage: null });
    expect(staying.exit_id).toBeNull();
    expect(staying.exit_stage).toBeNull();
  });
});

describe("exit process warnings", () => {
  it("keeps open loans with the remaining balance per currency", () => {
    const proc = mapExitProcess({
      id: 1, employee_id: 5, warnings: [{ code: "open_loans", count: 2, loan_ids: [4, 9], remaining: { IQD: 500000, USD: 120 } }],
    });
    expect(proc.warnings.open_loans).toEqual({ count: 2, loan_ids: ["4", "9"], remaining: { IQD: 500000, USD: 120 } });
  });

  it("has no open loans block when there are none", () => {
    expect(mapExitProcess({ id: 1, employee_id: 5 }).warnings.open_loans).toBeNull();
    expect(mapExitProcess({ id: 1, employee_id: 5, warnings: [] }).warnings.open_loans).toBeNull();
    expect(mapExitProcess({ id: 1, employee_id: 5, warnings: [{ code: "other" }] }).warnings.open_loans).toBeNull();
  });
});
