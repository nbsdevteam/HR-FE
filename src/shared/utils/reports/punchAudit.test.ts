import { describe, expect, it } from "vitest";
import {
  PUNCH_AUDIT_DETAIL_COLUMNS,
  PUNCH_AUDIT_DISPLAY_COLUMNS,
  buildPunchAuditFilters,
  formatPunchAuditCell,
  isPunchAuditReport,
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

describe("punch audit column sets", () => {
  it("keeps the HR table to eight display columns", () => {
    expect(PUNCH_AUDIT_DISPLAY_COLUMNS.map((c) => c.key)).toEqual([
      "employee_no",
      "employee_name",
      "department",
      "event_date",
      "punch_time",
      "punch_role_label",
      "device_name",
      "problem_label",
    ]);
    expect(PUNCH_AUDIT_DETAIL_COLUMNS.some((c) => c.key === "device_event_id")).toBe(true);
    expect(isPunchAuditReport("punch_audit")).toBe(true);
  });
});

describe("formatPunchAuditCell", () => {
  it("formats booleans and empty", () => {
    expect(formatPunchAuditCell("processed", true)).toBe("Yes");
    expect(formatPunchAuditCell("process_error", "")).toBe("—");
  });
});
