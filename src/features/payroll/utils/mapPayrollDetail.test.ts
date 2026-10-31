import { describe, expect, it } from "vitest";
import type { PayrollEmployeeDetailResponse, PayrollRow } from "@/shared/api/payrollTypes";
import { mapPayrollDetailToCalc, mapPayrollDetailToRecords } from "./mapPayrollDetail";
import { generateErrorMessage } from "./generateErrorMessage";

const detail = (overrides: Partial<PayrollRow> = {}): PayrollEmployeeDetailResponse =>
  ({
    month: "2026-10",
    employee: { id: 7, name: "Ali" },
    calculation: { currency: "IQD", ...overrides } as PayrollRow,
    attendance: {
      days_worked: 10,
      scheduled_working_days: 22,
      absence_dates: [],
      total_hours: 80,
      overtime_hours: 0,
      late_days: 0,
      early_days: 0,
      shortfall_hours: 0,
      missing_checkout_days: 1,
      missing_checkin_days: 2,
      not_yet_due_days: 5,
      days: [
        { date: "2026-10-27", status: "present", worked_hours: 8, overtime_hours: 0, late_minutes: 0, shortfall_hours: 0 },
        { date: "2026-10-30", status: "not_yet_due", worked_hours: 0, overtime_hours: 0, late_minutes: 0, shortfall_hours: 0 },
      ],
    },
    allowances: [],
    deductions: [],
  }) as unknown as PayrollEmployeeDetailResponse;

describe("mapPayrollDetailToCalc", () => {
  it("carries the review counters and the missing check-out charge", () => {
    const calc = mapPayrollDetailToCalc(detail({ missing_checkout_deduction: 12500 }));
    expect(calc.missingCheckinDays).toBe(2);
    expect(calc.missingCheckoutDays).toBe(1);
    expect(calc.notYetDueDays).toBe(5);
    expect(calc.salaryByCurrency.IQD.missingCheckoutDeduction).toBe(12500);
  });

  it("reads a response without the new keys as zeros", () => {
    const old = detail();
    delete (old.attendance as { not_yet_due_days?: number }).not_yet_due_days;
    delete (old.attendance as { missing_checkin_days?: number }).missing_checkin_days;
    const calc = mapPayrollDetailToCalc(old);
    expect(calc.notYetDueDays).toBe(0);
    expect(calc.missingCheckinDays).toBe(0);
    expect(calc.salaryByCurrency.IQD.missingCheckoutDeduction).toBe(0);
  });
});

describe("mapPayrollDetailToRecords", () => {
  it("draws a not-yet-due day as a rest day that is not a scheduled working day", () => {
    const [worked, notYetDue] = mapPayrollDetailToRecords(detail());
    expect(worked.isScheduledWorkingDay).toBe(true);
    expect(notYetDue.status).toBe("rest_day");
    expect(notYetDue.isScheduledWorkingDay).toBe(false);
  });
});

describe("generateErrorMessage", () => {
  it("names the day payslips open for a month that has not ended", () => {
    const error = Object.assign(new Error("This month has not ended yet"), {
      code: "month_not_over",
      details: { month_end: "2026-10-31" },
    });
    expect(generateErrorMessage(error)).toContain("2026-11-01");
  });

  it("falls back to the message for any other error", () => {
    expect(generateErrorMessage(new Error("boom"))).toBe("boom");
  });
});
