import { describe, expect, it } from "vitest";
import { mapEmployeeLifecycle, mapLifecycleActions } from "./employeeLifecycle";
import { mapEmployee } from "./core";
import { mapExitProcess } from "./lifecycle";

describe("mapEmployeeLifecycle", () => {
  it("maps the backend summary blocks as sent", () => {
    const summary = mapEmployeeLifecycle({
      employee: { id: 7, name: "Suraj", status: "active" },
      contract: {
        current: { id: 3, contract_number: "C-3", start_date: "2026-01-01", status: "active" },
        history: [{ id: 2, status: "expired", start_date: "2025-01-01", end_date: "2025-12-31" }],
      },
      documents: { total: 4, expiring_soon: 1 },
      custody: { active: 2, returned: 1 },
      exit: { id: 12, stage: "clearance", since: "2026-09-01", waiting_on: "clearance", blockers: ["custody_not_returned"] },
      actions: ["edit_end_of_service"],
      timeline: [{ id: 1, type: "contract", date: "2026-01-01", title: "Contract started" }],
    });

    expect(summary.employee).toEqual({ id: "7", name: "Suraj", status: "active" });
    expect(summary.contract.current?.contract_number).toBe("C-3");
    expect(summary.contract.history).toHaveLength(1);
    expect(summary.documents).toEqual({ total: 4, expiring_soon: 1 });
    expect(summary.exit).toEqual({
      id: "12", stage: "clearance", since: "2026-09-01", waiting_on: "clearance", blockers: ["custody_not_returned"],
    });
    expect(summary.actions).toEqual(["edit_end_of_service"]);
    expect(summary.timeline[0]).toMatchObject({ kind: "contract", at: "2026-01-01", title: "Contract started" });
  });

  it("has no exit and no contract when the backend sends none", () => {
    const summary = mapEmployeeLifecycle({ employee: { id: 7 }, contract: { current: null, history: [] }, exit: null });
    expect(summary.exit).toBeNull();
    expect(summary.contract.current).toBeNull();
    expect(summary.actions).toEqual([]);
  });
});

describe("mapLifecycleActions", () => {
  it("accepts a code list, flagged objects and a code map, keeping only offered actions", () => {
    expect(mapLifecycleActions(["start_end_of_service"])).toEqual(["start_end_of_service"]);
    expect(mapLifecycleActions([{ code: "a", enabled: true }, { code: "b", enabled: false }])).toEqual(["a"]);
    expect(mapLifecycleActions({ start_end_of_service: true, edit_end_of_service: false })).toEqual(["start_end_of_service"]);
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
      id: 1, employee_id: 5, warnings: { open_loans: { count: 2, loan_ids: [4, 9], remaining: { IQD: 500000, USD: 120 } } },
    });
    expect(proc.warnings.open_loans).toEqual({ count: 2, loan_ids: ["4", "9"], remaining: { IQD: 500000, USD: 120 } });
  });

  it("has no open loans block when there are none", () => {
    expect(mapExitProcess({ id: 1, employee_id: 5 }).warnings.open_loans).toBeNull();
    expect(mapExitProcess({ id: 1, employee_id: 5, warnings: { open_loans: { count: 0 } } }).warnings.open_loans).toBeNull();
  });
});
