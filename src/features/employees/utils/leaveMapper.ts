import type { DbLeaveRequest } from "@/shared/hooks";
import type { LeaveRecord } from "../types";

export const toLeaveRecord = (row: DbLeaveRequest): LeaveRecord => ({
  id: Number(row.id),
  type: row.leave_type || "—",
  from: row.start_date || "—",
  to: row.end_date || "—",
  days: row.days || 0,
  status: row.status,
});

export const toLeaveRecords = (rows: readonly DbLeaveRequest[]): LeaveRecord[] => rows.map(toLeaveRecord);
