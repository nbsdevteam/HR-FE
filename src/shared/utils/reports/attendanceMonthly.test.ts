import { describe, expect, it } from "vitest";
import {
  baghdadYmd,
  buildAttendanceMonthlyFilters,
  columnsForExport,
  defaultMonthRangeBaghdad,
  formatAttendanceReportCell,
  resolveDepartmentId,
} from "./attendanceMonthly";

describe("defaultMonthRangeBaghdad", () => {
  it("returns first and last day of the Baghdad month", () => {
    const range = defaultMonthRangeBaghdad(new Date("2026-08-13T12:00:00Z"));
    expect(range.date_from).toBe("2026-08-01");
    expect(range.date_to).toBe("2026-08-31");
  });
});

describe("baghdadYmd", () => {
  it("formats in Asia/Baghdad", () => {
    expect(baghdadYmd(new Date("2026-08-10T10:00:00Z"))).toBe("2026-08-10");
  });
});

describe("buildAttendanceMonthlyFilters", () => {
  it("defaults to current Baghdad month when dates omitted", () => {
    const f = buildAttendanceMonthlyFilters({
      now: new Date("2026-08-13T12:00:00Z"),
    });
    expect(f.date_from).toBe("2026-08-01");
    expect(f.date_to).toBe("2026-08-31");
  });

  it("passes department, status, and excuse filters", () => {
    const f = buildAttendanceMonthlyFilters({
      dateFrom: "2026-08-10",
      dateTo: "2026-08-14",
      departmentId: "3",
      status: "absent",
      excuseStatus: "excused",
      employeeId: 59,
    });
    expect(f).toEqual({
      date_from: "2026-08-10",
      date_to: "2026-08-14",
      department_id: 3,
      employee_id: 59,
      status: "absent",
      excuse_status: "excused",
    });
  });

  it("omits empty optional filters", () => {
    const f = buildAttendanceMonthlyFilters({
      dateFrom: "2026-08-01",
      dateTo: "2026-08-07",
      status: "",
      excuseStatus: "",
    });
    expect(f).toEqual({
      date_from: "2026-08-01",
      date_to: "2026-08-07",
    });
  });
});

describe("resolveDepartmentId", () => {
  const depts = [
    { id: "10", name: "HR" },
    { id: "11", name: "IT" },
  ];
  it("resolves by id or name", () => {
    expect(resolveDepartmentId(depts, "10")).toBe("10");
    expect(resolveDepartmentId(depts, "IT")).toBe("11");
    expect(resolveDepartmentId(depts, "")).toBeNull();
  });
});

describe("formatAttendanceReportCell / columnsForExport", () => {
  it("uses status_label for status and Yes/No for booleans", () => {
    const row = {
      status: "absent",
      status_label: "Absent",
      expected_working_day: true,
      excused_absence: false,
      worked_hours: 7.5,
    };
    expect(formatAttendanceReportCell("status", row.status, row)).toBe("Absent");
    expect(formatAttendanceReportCell("expected_working_day", true, row)).toBe("Yes");
    expect(formatAttendanceReportCell("excused_absence", false, row)).toBe("No");
    expect(formatAttendanceReportCell("worked_hours", 7.5, row)).toBe("7.5");
    expect(formatAttendanceReportCell("check_in", "", row)).toBe("—");
  });

  it("builds CSV-oriented objects keyed by column labels", () => {
    const cols = [
      { key: "employee_name", label: "Employee" },
      { key: "status", label: "Status" },
      { key: "excused_absence", label: "Excused Absence" },
    ];
    const exported = columnsForExport(cols, [
      {
        employee_name: "Ali",
        status: "absent",
        status_label: "Absent",
        excused_absence: true,
      },
    ]);
    expect(exported).toEqual([
      {
        Employee: "Ali",
        Status: "Absent",
        "Excused Absence": "Yes",
      },
    ]);
  });
});
