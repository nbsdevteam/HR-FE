import { describe, expect, it } from "vitest";
import {
  buildPunchAuditFilters,
  formatPunchAuditCell,
} from "./punchAudit";

describe("buildPunchAuditFilters", () => {
  it("defaults to current Baghdad month and passes filters", () => {
    const filters = buildPunchAuditFilters({
      departmentId: "4",
      status: "problems",
      employeeNo: "PA-100",
      now: new Date("2026-08-16T08:00:00Z"),
    });
    expect(filters).toEqual({
      date_from: "2026-08-01",
      date_to: "2026-08-31",
      department_id: 4,
      employee_no: "PA-100",
      status: "problems",
    });
  });

  it("keeps explicit date range", () => {
    expect(
      buildPunchAuditFilters({
        dateFrom: "2026-07-01",
        dateTo: "2026-07-15",
        deviceId: 9,
      }),
    ).toEqual({
      date_from: "2026-07-01",
      date_to: "2026-07-15",
      device_id: 9,
    });
  });
});

describe("formatPunchAuditCell", () => {
  it("formats booleans and empty", () => {
    expect(formatPunchAuditCell("processed", true)).toBe("Yes");
    expect(formatPunchAuditCell("process_error", "")).toBe("—");
  });
});
