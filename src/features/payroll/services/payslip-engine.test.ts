import { describe, expect, it } from "vitest";
import { applyLeaveToRecords, buildLeaveDateMap, processAttendanceRecords } from "./payslip-engine";
import type { EmployeePayConfig, ProcessedAttendanceRecord } from "./payslip-engine";

const schedule = {
  sunday: { isWorkingDay: true, startTime: "09:00", endTime: "18:00" },
  monday: { isWorkingDay: true, startTime: "09:00", endTime: "18:00" },
  tuesday: { isWorkingDay: true, startTime: "09:00", endTime: "18:00" },
  wednesday: { isWorkingDay: true, startTime: "09:00", endTime: "18:00" },
  thursday: { isWorkingDay: true, startTime: "09:00", endTime: "18:00" },
  friday: { isWorkingDay: false, startTime: "09:00", endTime: "18:00" },
  saturday: { isWorkingDay: false, startTime: "09:00", endTime: "18:00" },
};

const emp: EmployeePayConfig = {
  id: "1",
  personId: "1",
  name: "Test",
  salarySlots: [{ currency: "IQD", amount: 1000000, overtimeRate: 0 }],
  overtimeEnabled: false,
  schedule,
  allowances: [],
  deductions: [],
};

describe("absence / leave / holiday classification", () => {
  it("marks holiday days and skips absence deduction path", () => {
    const holidays = new Set(["2026-08-03"]); // Monday
    const rows = processAttendanceRecords([], emp, "2026-08", undefined, holidays);
    const day = rows.find((r) => r.date === "2026-08-03");
    expect(day?.status).toBe("holiday");
  });

  it("applies approved paid leave over no-punch absence", () => {
    const rows = processAttendanceRecords([], emp, "2026-08");
    const map = buildLeaveDateMap(
      [
        {
          id: "l1",
          employee_id: "1",
          leave_type: "Annual",
          start_date: "2026-08-03",
          end_date: "2026-08-03",
          days: 1,
          is_half_day: false,
          status: "validate",
        } as any,
      ],
      "1",
      "2026-08",
      [{ code: "AL", name_ar: "Annual", is_paid: true }],
    );
    const applied = applyLeaveToRecords(rows, map);
    const day = applied.find((r) => r.date === "2026-08-03") as ProcessedAttendanceRecord;
    expect(day.status).toBe("leave");
    expect(day.excusedAbsence).toBe(true);
    expect(day.isUnpaidLeave).toBe(false);
  });

  it("keeps unpaid leave as deductible", () => {
    const rows = processAttendanceRecords([], emp, "2026-08");
    const map = buildLeaveDateMap(
      [
        {
          id: "l2",
          employee_id: "1",
          leave_type: "Unpaid",
          start_date: "2026-08-04",
          end_date: "2026-08-04",
          days: 1,
          is_half_day: false,
          status: "approved",
        } as any,
      ],
      "1",
      "2026-08",
      [{ code: "UL", name_ar: "Unpaid", is_paid: false }],
    );
    const day = applyLeaveToRecords(rows, map).find((r) => r.date === "2026-08-04")!;
    expect(day.status).toBe("leave");
    expect(day.isUnpaidLeave).toBe(true);
    expect(day.excusedAbsence).toBe(false);
  });
});
