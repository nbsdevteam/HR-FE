import { useCallback, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { useOdooMutation, type DbEmployee } from "@/shared/hooks";
import type { RawAttendanceRecord } from "@/features/payroll";
import {
  ATTENDANCE_IMPORT_BATCH_SIZE,
  buildAttendanceImportEntries,
} from "../utils/attendanceImportRows";
import { errorMessage } from "../utils/errorMessage";

/** A row the backend refused, named by who and which day, with the backend's reason. */
export type AttendanceImportFailure = {
  employeeName: string;
  date: string;
  error: string;
};

export type AttendanceImportOutcome = {
  saved: number;
  failed: number;
  /** The refused rows the backend named (it names at most 100 per call). */
  failures: AttendanceImportFailure[];
  /** Set when a call failed as a whole; the rows from that call on were not sent. */
  requestError: string | null;
};

type AttendanceImportApi = {
  saving: boolean;
  outcome: AttendanceImportOutcome | null;
  saveRecords: (records: RawAttendanceRecord[]) => Promise<void>;
  resetOutcome: () => void;
};

/**
 * Upload parsed punches in batches. Each row is saved or refused on its own,
 * so the outcome is a count of both plus the refused rows by name — a refused
 * row no longer disappears behind a "saved" tick.
 */
export const useAttendanceImport = (employees: DbEmployee[]): AttendanceImportApi => {
  const [saving, setSaving] = useState(false);
  const [outcome, setOutcome] = useState<AttendanceImportOutcome | null>(null);

  const importMutation = useOdooMutation(odooData.importAttendance, "attendance");

  const saveRecords = useCallback(async (records: RawAttendanceRecord[]) => {
    const entries = buildAttendanceImportEntries(records, employees);
    if (entries.length === 0) return;
    setSaving(true);
    const result: AttendanceImportOutcome = { saved: 0, failed: 0, failures: [], requestError: null };

    for (let offset = 0; offset < entries.length; offset += ATTENDANCE_IMPORT_BATCH_SIZE) {
      const batch = entries.slice(offset, offset + ATTENDANCE_IMPORT_BATCH_SIZE);
      try {
        const data = await importMutation.mutateAsync(batch.map((entry) => entry.row));
        result.saved += data.processed ?? 0;
        result.failed += data.errors ?? 0;
        for (const failedRow of data.failed_rows ?? []) {
          const entry = batch[failedRow.index];
          if (!entry) continue;
          result.failures.push({
            employeeName: entry.employeeName,
            date: entry.row.date,
            error: failedRow.error,
          });
        }
      } catch (err) {
        result.failed += entries.length - offset;
        result.requestError = errorMessage(err);
        break;
      }
    }

    setOutcome(result);
    setSaving(false);
  }, [employees, importMutation.mutateAsync]);

  const resetOutcome = useCallback(() => setOutcome(null), []);

  return { saving, outcome, saveRecords, resetOutcome };
};
