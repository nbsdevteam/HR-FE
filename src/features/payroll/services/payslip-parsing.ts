/**
 * Attendance file parsing — the only part of the payslip engine that needs
 * the `xlsx` library. Kept in its own module so features that only need
 * calculation/formatting helpers (employees, exit lifecycle) don't pull in
 * xlsx's ~870KB parser through the `@/features/payroll` barrel.
 */

import * as XLSX from "xlsx";
import { arabicSource } from "@/i18n/source";
import type { RawAttendanceRecord } from "./payslip-engine";

const COL_ALIASES: Record<string, string[]> = {
  personId: ["person id", "personid", "id", "person_id", "employee id", "emp id", arabicSource("common.job_number")],
  name: ["name", "employee name", arabicSource("common.name"), arabicSource("common.employee_name")],
  time: ["time", "datetime", "timestamp", "date/time", arabicSource("common.time"), arabicSource("messages.date_and_time")],
  attendanceStatus: ["attendance status", "status", arabicSource("common.status"), arabicSource("common.attendance_status")],
  department: ["department", "dept", arabicSource("common.section")],
};

function findColumn(headers: string[], aliases: string[]): number {
  for (const alias of aliases) {
    const idx = headers.findIndex((h) => h.toLowerCase().trim() === alias.toLowerCase());
    if (idx !== -1) return idx;
  }
  return -1;
}

/** Parse a date-time string into "YYYY-MM-DD HH:MM:SS" */
function parseDateTime(raw: string): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  const spaceIdx = trimmed.indexOf(" ");
  let datePart = spaceIdx > 0 ? trimmed.substring(0, spaceIdx) : trimmed;
  let timePart = spaceIdx > 0 ? trimmed.substring(spaceIdx + 1).trim() : "00:00:00";

  // Normalize time
  if (!timePart.includes(":")) timePart = "00:00:00";
  const timeParts = timePart.split(":");
  const hh = (timeParts[0] || "00").padStart(2, "0");
  const mm = (timeParts[1] || "00").padStart(2, "0");
  const ss = (timeParts[2] || "00").padStart(2, "0");
  timePart = `${hh}:${mm}:${ss}`;

  // Parse date
  let year: number, month: number, day: number;

  if (datePart.includes("-")) {
    const parts = datePart.split("-");
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      year = parseInt(parts[0]);
      month = parseInt(parts[1]);
      day = parseInt(parts[2]);
    } else {
      // DD-MM-YY or DD-MM-YYYY
      day = parseInt(parts[0]);
      month = parseInt(parts[1]);
      year = parseInt(parts[2]);
      if (year < 100) year = year < 50 ? 2000 + year : 1900 + year;
    }
  } else if (datePart.includes("/")) {
    const parts = datePart.split("/");
    const a = parseInt(parts[0]);
    const b = parseInt(parts[1]);
    const c = parseInt(parts[2]);
    if (a > 12) {
      // D/M/YYYY
      day = a;
      month = b;
      year = c;
    } else {
      // M/D/YYYY
      month = a;
      day = b;
      year = c;
    }
    if (year < 100) year = year < 50 ? 2000 + year : 1900 + year;
  } else {
    return null;
  }

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  const yStr = String(year);
  const mStr = String(month).padStart(2, "0");
  const dStr = String(day).padStart(2, "0");
  return `${yStr}-${mStr}-${dStr} ${timePart}`;
}

/** Handle XLSX serial date numbers */
function excelSerialToDateTime(serial: number): string | null {
  if (serial < 1) return null;
  const utcDays = Math.floor(serial) - 25569;
  const utcMs = utcDays * 86400 * 1000;
  const fractional = serial - Math.floor(serial);
  const timeMs = Math.round(fractional * 86400 * 1000);
  const d = new Date(utcMs + timeMs);
  if (isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
}

export const parseAttendanceFile = (file: File): Promise<{
  records: RawAttendanceRecord[];
  errors: string[];
  totalRows: number;
}> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (json.length < 2) {
          resolve({ records: [], errors: [arabicSource("messages.the_file_is_empty_or_contains_no_data")], totalRows: 0 });
          return;
        }

        const headers = json[0].map((h: any) => String(h || "").trim());
        const personIdCol = findColumn(headers, COL_ALIASES.personId);
        const nameCol = findColumn(headers, COL_ALIASES.name);
        const timeCol = findColumn(headers, COL_ALIASES.time);
        const statusCol = findColumn(headers, COL_ALIASES.attendanceStatus);
        const deptCol = findColumn(headers, COL_ALIASES.department);

        const missingCols: string[] = [];
        if (personIdCol === -1) missingCols.push("Person ID");
        if (timeCol === -1) missingCols.push("Time");
        if (statusCol === -1) missingCols.push("Attendance Status");

        if (missingCols.length > 0) {
          resolve({
            records: [],
            errors: [`${arabicSource("messages.missing_columns")} ${missingCols.join(", ")}${arabicSource("messages.existing_columns")} ${headers.join(", ")}`],
            totalRows: json.length - 1,
          });
          return;
        }

        const records: RawAttendanceRecord[] = [];
        const errors: string[] = [];

        for (let i = 1; i < json.length; i++) {
          const row = json[i];
          if (!row || row.length === 0) continue;

          const rawPersonId = String(row[personIdCol] || "").trim();
          const rawName = nameCol >= 0 ? String(row[nameCol] || "").trim() : rawPersonId;
          const rawTime = row[timeCol];
          const rawStatus = String(row[statusCol] || "").trim();
          const rawDept = deptCol >= 0 ? String(row[deptCol] || "").trim() : undefined;

          if (!rawPersonId) continue;

          // Parse time
          let parsedTime: string | null = null;
          if (typeof rawTime === "number") {
            parsedTime = excelSerialToDateTime(rawTime);
          } else {
            parsedTime = parseDateTime(String(rawTime || ""));
          }

          if (!parsedTime) {
            errors.push(`${arabicSource("messages.line")} ${i + 1}${arabicSource("messages.unable_to_parse_date")}${rawTime}"`);
            continue;
          }

          // Parse status
          let status: "Check-in" | "Check-out" | "None" = "None";
          const statusLower = rawStatus.toLowerCase();
          if (statusLower.includes("check-in") || statusLower.includes("checkin") || statusLower === "in" || statusLower === "c/in") {
            status = "Check-in";
          } else if (statusLower.includes("check-out") || statusLower.includes("checkout") || statusLower === "out" || statusLower === "c/out") {
            status = "Check-out";
          }

          records.push({
            personId: rawPersonId,
            name: rawName,
            department: rawDept,
            time: parsedTime,
            attendanceStatus: status,
          });
        }

        resolve({ records, errors, totalRows: json.length - 1 });
      } catch (err: any) {
        resolve({ records: [], errors: [`${arabicSource("messages.error_reading_file")} ${err.message}`], totalRows: 0 });
      }
    };
    reader.onerror = () => resolve({ records: [], errors: [arabicSource("messages.failed_to_read_file")], totalRows: 0 });
    reader.readAsArrayBuffer(file);
  });
}
