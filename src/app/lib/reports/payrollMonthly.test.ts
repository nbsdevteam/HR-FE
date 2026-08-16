import { describe, expect, it } from "vitest";
import {
  buildPayrollMonthlyFilters,
  formatPayrollReportCell,
} from "./payrollMonthly";

describe("buildPayrollMonthlyFilters", () => {
  it("defaults month and dates from Baghdad calendar month", () => {
    const f = buildPayrollMonthlyFilters({
      now: new Date("2026-08-13T12:00:00Z"),
    });
    expect(f.month).toBe("2026-08");
    expect(f.date_from).toBe("2026-08-01");
    expect(f.date_to).toBe("2026-08-31");
  });

  it("passes department and employee", () => {
    const f = buildPayrollMonthlyFilters({
      dateFrom: "2026-08-01",
      dateTo: "2026-08-31",
      departmentId: "4",
      employeeId: 59,
    });
    expect(f).toEqual({
      month: "2026-08",
      date_from: "2026-08-01",
      date_to: "2026-08-31",
      department_id: 4,
      employee_id: 59,
    });
  });
});

describe("formatPayrollReportCell", () => {
  it("formats money and hours", () => {
    expect(formatPayrollReportCell("basic_salary", 900000)).toMatch(/900/);
    expect(formatPayrollReportCell("worked_hours", 7.5)).toBe("7.5");
    expect(formatPayrollReportCell("department", "")).toBe("—");
  });
});
