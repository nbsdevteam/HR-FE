import { hrCall } from "./client";
import { mapAttendance, mapMonthlyRecord, mapMonthlyLedger } from "./mappers";
import type {
  DbAttendanceRecord,
  DbMonthlyRecord,
  DbMonthlyLedger,
} from "../hooks";
import { items, eid } from "./httpHelpers";

export type AttendanceFetchOpts = {
  date?: string;
  date_from?: string;
  date_to?: string;
  employee_id?: string | number;
  limit?: number;
};

/** data.pagination from /api/hr/attendance/list — everything needed for Previous / Next / page buttons. */
export type AttendancePagination = {
  total: number;
  count: number;
  limit: number;
  offset: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
  next_offset: number | null;
  prev_offset: number | null;
};

export type AttendanceListData = {
  items: any[];
  total: number;
  limit: number;
  offset: number;
  page: number;
  per_page: number;
  pagination: AttendancePagination;
};

export type AttendanceListParams = {
  employee_id?: number | string;
  employee_ids?: number[];
  date_from?: string;
  date_to?: string;
  status?: string;
  source?: string;
  search?: string;
  /** 1–100; omit for the server default of 20. */
  limit?: number;
  /** (page - 1) * limit */
  offset?: number;
  /** 1-based; alternative to offset. Wins over offset if both are sent. */
  page?: number;
};

/** Server-enforced cap on `/api/hr/attendance/list` — a larger `limit` is silently clamped to this. */
const ATTENDANCE_PAGE_MAX_LIMIT = 100;

/** Fetch a single page, returning the full pagination envelope alongside the mapped rows. */
export const fetchAttendancePage = async (
  params: AttendanceListParams,
): Promise<{ rows: DbAttendanceRecord[]; pagination: AttendancePagination }> => {
  const data = await hrCall<AttendanceListData>("/api/hr/attendance/list", params);
  return { rows: data.items.map(mapAttendance), pagination: data.pagination };
};

/** Walk every page (100 rows at a time) until `has_next` is false. */
const fetchAllAttendance = async (
  params: AttendanceListParams,
): Promise<DbAttendanceRecord[]> => {
  const all: DbAttendanceRecord[] = [];
  let offset = 0;
  for (;;) {
    const { rows, pagination } = await fetchAttendancePage({
      ...params,
      limit: ATTENDANCE_PAGE_MAX_LIMIT,
      offset,
    });
    all.push(...rows);
    if (!pagination.has_next) break;
    offset = pagination.next_offset ?? offset + ATTENDANCE_PAGE_MAX_LIMIT;
  }
  return all;
};

export const fetchAttendance = async (
  dateOrOpts?: string | AttendanceFetchOpts,
): Promise<DbAttendanceRecord[]> => {
  const opts: AttendanceFetchOpts =
    typeof dateOrOpts === "string" || dateOrOpts === undefined
      ? { date: dateOrOpts }
      : dateOrOpts;
  const params: AttendanceListParams = {};
  if (opts?.date) {
    params.date_from = opts?.date;
    params.date_to = opts?.date;
  }
  if (opts?.date_from) params.date_from = opts?.date_from;
  if (opts?.date_to) params.date_to = opts?.date_to;
  if (opts?.employee_id != null && opts?.employee_id !== "") {
    params.employee_id = Number(opts?.employee_id) || opts?.employee_id;
  }

  // A caller asking for a page-sized slice gets exactly that; anyone else
  // (no limit, or a legacy `limit: 500/5000`) gets every matching row via
  // an offset walk — the server caps a single request at 100 regardless.
  if (opts?.limit != null && opts.limit <= ATTENDANCE_PAGE_MAX_LIMIT) {
    const { rows } = await fetchAttendancePage({ ...params, limit: opts.limit, offset: 0 });
    return rows;
  }
  return fetchAllAttendance(params);
};

export const fetchMonthlyRecords = async (
  monthYear?: string,
): Promise<DbMonthlyRecord[]> => {
  const params: Record<string, unknown> = { limit: 500 };
  if (monthYear) params.month_year = monthYear;
  const rows = await items<any>("/api/hr/payroll/monthly_records/list", params);
  return rows.map(mapMonthlyRecord);
};

export const fetchMonthlyLedgers = async (
  monthYear?: string,
): Promise<DbMonthlyLedger[]> => {
  const params: Record<string, unknown> = { limit: 500 };
  if (monthYear) params.month_year = monthYear;
  const rows = await items<any>("/api/hr/payroll/ledgers/list", params);
  return rows.map(mapMonthlyLedger);
};

/** Convert "HH:MM" or "HH:MM:SS" → float hours for Odoo. */
export const timeToFloat = (t: string | number | null | undefined): number => {
  if (typeof t === "number") return t;
  if (!t) return 0;
  const [h, m] = String(t).split(":").map(Number);
  return (h || 0) + (m || 0) / 60;
};

export const excuseAttendance = async (payload: {
  attendance_id?: string | number;
  employee_id?: string | number;
  date?: string;
  excused_late?: boolean;
  excused_absence?: boolean;
  excused_shortfall?: boolean;
  excuse_note?: string | null;
}) => {
  const params: Record<string, unknown> = { ...payload };
  if (payload.attendance_id != null)
    params.attendance_id = eid(payload.attendance_id);
  if (payload.employee_id != null)
    params.employee_id = eid(payload.employee_id);
  return hrCall("/api/hr/attendance/excuse", params);
};

export const upsertAttendance = async (payload: Record<string, unknown>) => {
  const params = { ...payload };
  if (params.employee_id != null)
    params.employee_id = eid(params.employee_id as string | number);
  return hrCall("/api/hr/attendance/upsert", params);
};

export const importAttendance = async (records: Record<string, unknown>[]) => {
  return hrCall("/api/hr/attendance/import", { records });
};

export const upsertMonthlyRecord = async (payload: {
  employee_id: string | number;
  month_year: string;
  salary_calculation?: unknown;
}) => {
  return hrCall("/api/hr/payroll/monthly_records/upsert", {
    employee_id: eid(payload.employee_id),
    month_year: payload.month_year,
    salary_calculation: payload.salary_calculation || {},
  });
};

export const upsertMonthlyLedger = async (payload: Record<string, unknown>) => {
  const params = { ...payload };
  if (params?.employee_id != null || undefined)
    params.employee_id = eid(params.employee_id as string | number);
  return hrCall("/api/hr/payroll/ledgers/upsert", params);
};

export const fetchAttendanceTrends = async (params?: {
  employeeId?: string | number;
  dateFrom?: string;
  dateTo?: string;
}) => {
  const body: Record<string, unknown> = {};
  if (params?.employeeId != null) body.employee_id = eid(params.employeeId);
  if (params?.dateFrom) body.date_from = params.dateFrom;
  if (params?.dateTo) body.date_to = params.dateTo;
  return hrCall("/api/hr/attendance/trends", body);
};
