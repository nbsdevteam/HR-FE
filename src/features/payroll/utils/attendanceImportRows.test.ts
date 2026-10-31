import { describe, expect, it } from "vitest";
import type { DbEmployee } from "@/shared/hooks";
import type { RawAttendanceRecord } from "@/features/payroll";
import { buildAttendanceImportEntries } from "./attendanceImportRows";

const employee = { id: "7", person_id: 101, name: "Ali", arabic_name: "علي" } as DbEmployee;

const punch = (time: string, attendanceStatus: RawAttendanceRecord["attendanceStatus"], personId = "101") =>
  ({ personId, name: "Ali", time, attendanceStatus }) as RawAttendanceRecord;

describe("buildAttendanceImportEntries", () => {
  it("pairs the first check-in with the last check-out for a person and day", () => {
    const [entry] = buildAttendanceImportEntries(
      [
        punch("2026-10-27 08:00:00", "Check-in"),
        punch("2026-10-27 12:00:00", "Check-out"),
        punch("2026-10-27 17:00:00", "Check-out"),
      ],
      [employee],
    );
    expect(entry.employeeName).toBe("Ali");
    expect(entry.row).toEqual({
      employee_id: "7",
      date: "2026-10-27",
      check_in_time: "08:00:00",
      check_out_time: "17:00:00",
      status: "complete",
      source: "manual",
    });
  });

  it("marks a lone check-in as missing its check-out and skips unknown people", () => {
    const entries = buildAttendanceImportEntries(
      [punch("2026-10-27 08:00:00", "Check-in"), punch("2026-10-27 09:00:00", "Check-in", "999")],
      [employee],
    );
    expect(entries).toHaveLength(1);
    expect(entries[0].row.status).toBe("missing_checkout");
    expect(entries[0].row.check_out_time).toBeNull();
  });
});
