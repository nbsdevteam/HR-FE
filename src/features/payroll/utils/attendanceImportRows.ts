import type { DbEmployee } from "@/shared/hooks";
import type { RawAttendanceRecord } from "@/features/payroll";

/** The shape `/api/hr/attendance/import` takes for each row. */
export type AttendanceImportRow = {
  employee_id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: string;
  source: "manual";
};

/** An import row with what the screen needs to name it if the backend refuses it. */
export type AttendanceImportEntry = {
  row: AttendanceImportRow;
  employeeName: string;
};

/** Rows per `/api/hr/attendance/import` call. */
export const ATTENDANCE_IMPORT_BATCH_SIZE = 100;

const timeOf = (record: RawAttendanceRecord): string => record.time.substring(11, 19);

/**
 * Collapse the parsed punches into one row per person and day: the first and
 * last punch become the check-in and check-out, a lone punch becomes a
 * `missing_checkout` / `missing_checkin` row. People who are not in the system
 * are skipped.
 */
export const buildAttendanceImportEntries = (
  records: RawAttendanceRecord[],
  employees: DbEmployee[],
): AttendanceImportEntry[] => {
  const grouped: Record<string, RawAttendanceRecord[]> = {};
  for (const record of records) {
    const key = `${record.personId}__${record.time.substring(0, 10)}`;
    (grouped[key] ??= []).push(record);
  }

  const entries: AttendanceImportEntry[] = [];
  for (const [key, recs] of Object.entries(grouped)) {
    const [personId, date] = key.split("__");
    const employee = employees.find((e) => String(e.person_id) === personId);
    if (!employee) continue;

    const byTime = (a: RawAttendanceRecord, b: RawAttendanceRecord) => a.time.localeCompare(b.time);
    const checkIns = recs.filter((r) => r.attendanceStatus === "Check-in").sort(byTime);
    const checkOuts = recs.filter((r) => r.attendanceStatus === "Check-out").sort(byTime);

    let checkInTime: string | null = null;
    let checkOutTime: string | null = null;
    let status = "complete";

    if (checkIns.length > 0 && checkOuts.length > 0) {
      checkInTime = timeOf(checkIns[0]);
      checkOutTime = timeOf(checkOuts[checkOuts.length - 1]);
    } else if (checkIns.length >= 2) {
      checkInTime = timeOf(checkIns[0]);
      checkOutTime = timeOf(checkIns[checkIns.length - 1]);
    } else if (checkOuts.length >= 2) {
      checkInTime = timeOf(checkOuts[0]);
      checkOutTime = timeOf(checkOuts[checkOuts.length - 1]);
    } else if (checkIns.length === 1) {
      checkInTime = timeOf(checkIns[0]);
      status = "missing_checkout";
    } else if (checkOuts.length === 1) {
      checkOutTime = timeOf(checkOuts[0]);
      status = "missing_checkin";
    } else {
      status = "absent";
    }

    entries.push({
      employeeName: employee.name || employee.arabic_name,
      row: {
        employee_id: employee.id,
        date,
        check_in_time: checkInTime,
        check_out_time: checkOutTime,
        status,
        source: "manual",
      },
    });
  }
  return entries;
};
