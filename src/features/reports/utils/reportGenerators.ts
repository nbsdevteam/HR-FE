import { formatCurrency } from "@/i18n/format";
import { arabicSource } from "@/i18n/source";
import type {
  DbAttendanceRecord, DbContractType, DbDocumentType, DbEmployee,
  DbEmployeeContract, DbEmployeeDocument, DbLeaveBalance, DbLeaveRequest,
  DbLeaveType, DbMonthlyRecord, DbReportTemplate,
} from "@/shared/hooks";
import type { ReportFilters, ReportRow } from "../types";

const formatIQD = (val: number) => formatCurrency(val, "IQD", { maximumFractionDigits: 0 });

export type ReportDataContext = {
  attendanceRecords: DbAttendanceRecord[];
  monthlyRecords: DbMonthlyRecord[];
  leaveRequests: DbLeaveRequest[];
  leaveTypes: DbLeaveType[];
  leaveBalances: DbLeaveBalance[];
  employees: DbEmployee[];
  contracts: DbEmployeeContract[];
  contractTypes: DbContractType[];
  empDocuments: DbEmployeeDocument[];
  documentTypes: DbDocumentType[];
  empMap: Record<string, string>;
  empDeptMap: Record<string, string>;
  filters: ReportFilters;
};

type ReportGenerator = (ctx: ReportDataContext) => ReportRow[];

const filterByDept = <T,>(records: T[], filterDept: string, getDept: (record: T) => string): T[] =>
  filterDept ? records.filter(r => getDept(r) === filterDept) : records;

const generateAttendanceMonthly: ReportGenerator = (ctx) => {
  const { dateFrom, dateTo, filterDept } = ctx.filters;
  let filtered = ctx.attendanceRecords;
  if (dateFrom) filtered = filtered.filter(r => r.date >= dateFrom);
  if (dateTo) filtered = filtered.filter(r => r.date <= dateTo);
  filtered = filterByDept(filtered, filterDept, r => ctx.empDeptMap[r.employee_id]);
  return filtered.map(r => {
    let statusLabel = r.status || "—";
    if (r.status === "complete" || r.status === "missing_checkout") {
      statusLabel = r.is_late ? arabicSource("common.late") : arabicSource("common.present");
    } else if (r.status === "absent" || r.status === "absent_due_to_late_threshold") {
      statusLabel = arabicSource("common.absent");
    } else if (r.status === "leave") {
      statusLabel = arabicSource("common.vacations_2") || "Leave";
    } else if (r.status === "holiday") {
      statusLabel = "Holiday";
    }
    return {
      employee_name: ctx.empMap[r.employee_id] || r.employee_id,
      date: r.date,
      // check_in/out already converted to Asia/Baghdad in mapAttendance
      check_in: r.check_in_time || "—",
      check_out: r.check_out_time || "—",
      status: statusLabel,
      delay_minutes: r.late_minutes || 0,
      overtime_hours: r.overtime_hours ? r.overtime_hours.toFixed(1) : "0",
    };
  });
};

const generateLeaveRequests: ReportGenerator = (ctx) => {
  const { dateFrom, dateTo, filterDept } = ctx.filters;
  let filtered = ctx.leaveRequests;
  if (dateFrom) filtered = filtered.filter(r => r.start_date >= dateFrom);
  if (dateTo) filtered = filtered.filter(r => r.start_date <= dateTo);
  filtered = filterByDept(filtered, filterDept, r => ctx.empDeptMap[r.employee_id]);
  return filtered.map(r => ({
    employee_name: ctx.empMap[r.employee_id] || r.employee_id,
    leave_type: r.leave_type || "—",
    start_date: r.start_date,
    end_date: r.end_date,
    days: r.days,
    status: r.status,
    reason: r.reason || "—",
  }));
};

const generatePayrollMonthly: ReportGenerator = (ctx) => {
  const { filterDept } = ctx.filters;
  const filtered = filterByDept(ctx.monthlyRecords, filterDept, r => ctx.empDeptMap[r.employee_id]);
  return filtered.map(r => {
    const calc = (r.salary_calculation || {}) as any;
    return {
      employee_name: ctx.empMap[r.employee_id] || r.employee_id,
      department: ctx.empDeptMap[r.employee_id] || "—",
      basic_salary: formatIQD(calc.baseSalary || 0),
      allowances: formatIQD((calc.allowances || []).reduce((s: number, a: any) => s + (a.amount || 0), 0)),
      deductions: formatIQD((calc.deductions || []).reduce((s: number, d: any) => s + (d.amount || 0), 0)),
      net_salary: formatIQD(calc.netSalary || 0),
    };
  });
};

const generateLeaveBalances: ReportGenerator = (ctx) => {
  const { filterDept } = ctx.filters;
  const balances = filterByDept(ctx.leaveBalances, filterDept, b => ctx.empDeptMap[b.employee_id]);
  return balances.map(b => {
    const lt = ctx.leaveTypes.find(t => t.id === b.leave_type_id);
    return {
      employee_name: ctx.empMap[b.employee_id] || b.employee_id,
      leave_type: lt?.name_ar || "—",
      entitlement: b.total_days,
      used: b.used_days,
      remaining: b.total_days - b.used_days,
      carryover: b.carryover_days || 0,
    };
  });
};

const generateEmployeeMaster: ReportGenerator = (ctx) => {
  const { filterDept } = ctx.filters;
  const filtered = filterByDept(ctx.employees, filterDept, e => e.department || "");
  return filtered.map(e => ({
    name: e.name || "—",
    arabic_name: e.arabic_name || "—",
    department: e.department || "—",
    position: e.position || "—",
    join_date: e.join_date || "—",
    monthly_salary: formatIQD(e.monthly_salary || 0),
    status: e.status || arabicSource("common.is_active"),
  }));
};

const generateContractsStatus: ReportGenerator = (ctx) => {
  const { filterDept } = ctx.filters;
  const filtered = filterByDept(ctx.contracts, filterDept, c => ctx.empDeptMap[c.employee_id]);
  return filtered.map(c => {
    const ct = ctx.contractTypes.find(t => t.id === c.contract_type_id);
    return {
      employee_name: ctx.empMap[c.employee_id] || c.employee_id,
      contract_type: ct?.name_ar || "—",
      start_date: c.start_date,
      end_date: c.end_date || arabicSource("common.not_specified"),
      status: c.status === "active" ? arabicSource("common.is_active") : c.status === "expired" ? arabicSource("common.finished") : c.status === "terminated" ? arabicSource("common.canceled") : c.status,
      probation_status: c.probation_status === "in_progress" ? arabicSource("reports.underway") : c.probation_status === "passed" ? arabicSource("common.successful") : c.probation_status === "failed" ? arabicSource("common.failed") : c.probation_status === "not_applicable" ? "—" : c.probation_status,
    };
  });
};

const generateDocumentsExpiry: ReportGenerator = (ctx) => {
  const { filterDept } = ctx.filters;
  const now = new Date();
  const filtered = filterByDept(ctx.empDocuments, filterDept, d => ctx.empDeptMap[d.employee_id]);
  return filtered.filter(d => d.expiry_date).map(d => {
    const dt = ctx.documentTypes.find(t => t.id === d.document_type_id);
    const expiry = new Date(d.expiry_date!);
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    let status = arabicSource("reports.mast");
    if (daysLeft < 0) status = arabicSource("reports.finished");
    else if (daysLeft <= (dt?.expiry_warning_days || 30)) status = arabicSource("reports.nearly_completed");
    return {
      employee_name: ctx.empMap[d.employee_id] || d.employee_id,
      document_type: dt?.name_ar || "—",
      document_number: d.document_number || "—",
      expiry_date: d.expiry_date,
      status,
    };
  });
};

const REPORT_GENERATORS: Record<string, ReportGenerator> = {
  attendance_monthly: generateAttendanceMonthly,
  leave_requests: generateLeaveRequests,
  leave_monthly: generateLeaveRequests,
  payroll_monthly: generatePayrollMonthly,
  leave_balances: generateLeaveBalances,
  employee_master: generateEmployeeMaster,
  contracts_status: generateContractsStatus,
  documents_expiry: generateDocumentsExpiry,
};

export const generateReportRows = (template: DbReportTemplate, ctx: ReportDataContext): ReportRow[] => {
  const generator = REPORT_GENERATORS[template.code];
  if (!generator) {
    return [{ info: arabicSource("reports.there_is_currently_no_data_available_for_this_report") }];
  }
  return generator(ctx);
};
