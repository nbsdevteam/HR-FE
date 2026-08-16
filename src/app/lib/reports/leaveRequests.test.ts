import { describe, expect, it } from "vitest";
import {
  buildLeaveRequestsFilters,
  formatLeaveReportCell,
} from "./leaveRequests";

describe("buildLeaveRequestsFilters", () => {
  it("passes date, department, leave type, and status", () => {
    expect(
      buildLeaveRequestsFilters({
        dateFrom: "2026-08-01",
        dateTo: "2026-08-31",
        departmentId: "3",
        leaveTypeId: 7,
        status: "approved",
      }),
    ).toEqual({
      date_from: "2026-08-01",
      date_to: "2026-08-31",
      department_id: 3,
      leave_type_id: 7,
      status: "approved",
    });
  });

  it("omits empty filters", () => {
    expect(buildLeaveRequestsFilters({})).toEqual({});
  });
});

describe("formatLeaveReportCell", () => {
  it("formats booleans and empty", () => {
    expect(formatLeaveReportCell("half_day", true)).toBe("Yes");
    expect(formatLeaveReportCell("reason", "")).toBe("—");
    expect(formatLeaveReportCell("number_of_days", 1.5)).toBe("1.5");
  });
});
