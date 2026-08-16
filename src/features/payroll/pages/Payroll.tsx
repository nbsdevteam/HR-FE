import { useState, useEffect, useMemo, useRef, useCallback, useReducer } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Wallet, Download, TrendingUp, Calculator, Users, FileText, Loader2,
  Upload, FileSpreadsheet, AlertCircle, CheckCircle, X, ChevronDown,
  Clock, CalendarDays, ArrowUpRight, ArrowDownRight, Star, XCircle,
  ShieldCheck, ShieldAlert, DollarSign, BadgeCheck, TriangleAlert,
  ChevronLeft, ChevronRight, Banknote, Receipt, CreditCard, UserCheck,
  FileCheck, Filter, Search, BarChart3, TreePalm, Pencil, Save, Plus, Minus,
} from "lucide-react";
import * as odooData from "@/shared/api/odooData";
import {
  useEmployees, empDisplayName, useShifts, resolveEmployeeShift, shiftToSchedule,
  useHierarchyData, usePublicHolidays, useConfigurations, useAllowanceTypes,
  useEmployeeAllowances, useDeductionTypes, useEmployeeDeductions, useLoans,
  useMonthlyRecords, useMonthlyLedgers, useAttendanceRecords, useLeaveRequests,
  useLeaveTypes,
  type DbShift,
} from "@/shared/hooks";
import { useAppSettings, formatMonthYear } from "@/app/providers";
import { localizedAlert } from "@/i18n/native";
import type { DbEmployee, DbAttendanceRecord, DbMonthlyRecord, DbMonthlyLedger } from "@/shared/hooks";
import {
  parseAttendanceFile,
  processAttendanceRecords,
  calculateSalary,
  formatCurrency,
  formatHoursMinutes,
  getShortfallRecords,
  getAbsenceRecords,
  getLeaveRecords,
  buildLeaveDateMap,
  applyLeaveToRecords,
  buildSettingsFromShift,
  DEFAULT_SETTINGS,
  DEFAULT_SCHEDULE,
  type RawAttendanceRecord,
  type ProcessedAttendanceRecord,
  type SalaryCalculation,
  type EmployeePayConfig,
  type MonthlyLedgerEntry,
  type PayslipSettings,
  type LeaveRequest,
} from "@/features/payroll";
import { CustomBarChart } from "@/shared/components/custom-bar-chart";
import { SortableHeaderRow, toggleSort } from "@/shared/components/SortableHeader";
import { arabicSource } from "@/i18n/source";

// ══════════════════════════ Constants ══════════════════════════

const dayNamesAr: Record<string, string> = {
  sunday: arabicSource("common.sunday_2"), monday: arabicSource("common.monday"), tuesday: arabicSource("common.tuesday"),
  wednesday: arabicSource("common.wednesday"), thursday: arabicSource("common.thursday"), friday: arabicSource("common.friday"), saturday: arabicSource("common.saturday"),
};

const TABS = [
  { id: "overview", label: arabicSource("common.salaries"), icon: Wallet },
  { id: "upload", label: arabicSource("payroll.raising_attendance"), icon: Upload },
] as const;

type TabId = (typeof TABS)[number]["id"];

const cardCls = "bg-card/30 backdrop-blur-md border border-border/40 rounded-xl overflow-hidden shadow-lg";
const inputCls = "w-full h-10 px-3 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none";
const selectCls = inputCls;

function formatIQD(val: number) {
  return formatCurrency(val, "IQD");
}

// displayMonth is now replaced by formatMonthYear from SettingsContext

// ══════════════════════════ Main Component ══════════════════════════

export function Payroll() {
  const { employees, loading: empLoading } = useEmployees();
  const { settings: appSettings } = useAppSettings();
  const { shifts: dbShifts } = useShifts();
  const { departments: dbDepartments } = useHierarchyData();
  const { holidays: dbHolidays } = usePublicHolidays();
  const { getNumber, getValue } = useConfigurations();
  const { types: allowanceTypes } = useAllowanceTypes();
  const { allowances: allEmployeeAllowances } = useEmployeeAllowances();
  const { types: deductionTypes } = useDeductionTypes();
  const { deductions: allEmployeeDeductions } = useEmployeeDeductions();
  const { loans: allLoans } = useLoans();
  const displayMonth = (m: string) => formatMonthYear(m, appSettings.monthFormat);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const { records: monthlyRecords, loading: mrLoading, refetch: refetchMonthly } = useMonthlyRecords();
  const { ledgers, loading: ledLoading, refetch: refetchLedgers } = useMonthlyLedgers();
  const { records: attRecords, loading: attLoading, refetch: refetchAtt } = useAttendanceRecords();
  const { requests: leaveReqRows, loading: lvLoading } = useLeaveRequests({ status: "مقبول" });
  const { types: leaveTypes } = useLeaveTypes();
  const leaveRequests = leaveReqRows as LeaveRequest[];
  const leaveTypeInfos = useMemo(
    () => leaveTypes.map((t) => ({ code: t.code || t.id, name_ar: t.name_ar || t.name_en || "", is_paid: Boolean(t.is_paid) })),
    [leaveTypes],
  );
  const loading = empLoading || mrLoading || ledLoading || attLoading || lvLoading;
  const [selectedMonth, setSelectedMonth] = useState("");

  // Detail panel state
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedMonth) return;
    if (monthlyRecords.length > 0) {
      const months = [...new Set(monthlyRecords.map((r) => r.month_year))].sort().reverse();
      setSelectedMonth(months[0]);
    } else {
      const now = new Date();
      setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    }
  }, [monthlyRecords, selectedMonth]);

  const empMap = useMemo(() => {
    const m: Record<string, DbEmployee> = {};
    employees.forEach((e) => { m[e.id] = e; });
    return m;
  }, [employees]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    monthlyRecords.forEach((r) => months.add(r.month_year));
    attRecords.forEach((r) => {
      const m = r.date?.substring(0, 7);
      if (m) months.add(m);
    });
    // Also add current month
    const now = new Date();
    months.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    return [...months].sort().reverse();
  }, [monthlyRecords, attRecords]);

  // Create holiday set for O(1) lookups
  const holidayDates = useMemo(() => new Set(dbHolidays.map(h => h.date)), [dbHolidays]);

  // Build payroll data for selected month
  const payrollData = useMemo(() => {
    const monthAtt = attRecords.filter((r) => r.date?.startsWith(selectedMonth));
    const monthRecs = monthlyRecords.filter((r) => r.month_year === selectedMonth);

    const empIds = new Set<string>();
    monthAtt.forEach((r) => empIds.add(r.employee_id));
    monthRecs.forEach((r) => empIds.add(r.employee_id));

    const rows: Array<{
      empId: string;
      name: string;
      department: string;
      basicSalary: number;
      currency: string;
      daysWorked: number;
      totalHours: number;
      overtime: number;
      shortfall: number;
      absences: number;
      netSalary: number;
      calc: SalaryCalculation | null;
      records: ProcessedAttendanceRecord[];
    }> = [];

    for (const empId of empIds) {
      const emp = empMap[empId];
      if (!emp) continue;

      // Build employee config with dynamic shift
      const empShift = resolveEmployeeShift(emp, dbDepartments, dbShifts);
      const empSchedule = empShift ? shiftToSchedule(empShift) : DEFAULT_SCHEDULE;
      const empSettings = empShift ? buildSettingsFromShift(empShift) : DEFAULT_SETTINGS;

      // Build allowances for this employee
      const empAllowances = allEmployeeAllowances
        .filter(a => a.employee_id === empId)
        .map(a => {
          const aType = allowanceTypes.find(t => t.id === a.allowance_type_id);
          return { name: aType?.name_ar || arabicSource("common.allowance"), amount: a.amount, currency: a.currency };
        });

      // Build deductions for this employee
      const empDeductions = allEmployeeDeductions
        .filter(d => d.employee_id === empId)
        .map(d => {
          const dType = deductionTypes.find(t => t.id === d.deduction_type_id);
          return {
            name: dType?.name_ar || arabicSource("common.deduction"),
            amount: d.amount,
            percentage: d.percentage,
            calcMethod: d.calc_method || dType?.calc_method || "fixed",
            percentageOf: dType?.percentage_of || "base_salary",
            currency: d.currency,
          };
        });

      // Find active loan for this employee
      const activeLoan = allLoans.find(l => l.employee_id === empId && l.status === "active");

      const config: EmployeePayConfig = {
        id: emp.id,
        personId: String(emp.person_id),
        name: empDisplayName(emp),
        department: emp.department,
        salarySlots: [
          {
            currency: emp.currency || "IQD",
            amount: emp.monthly_salary || 0,
            overtimeRate: emp.overtime_rate || 0,
          },
        ],
        overtimeEnabled: emp.overtime_enabled ?? false,
        schedule: empSchedule,
        allowances: empAllowances,
        deductions: empDeductions,
        activeLoanInstallment: activeLoan?.installment_amount,
        activeLoanCurrency: activeLoan?.currency,
        joinDate: emp.join_date || undefined,
      };

      // Build raw records from DB attendance
      const empAtt = monthAtt.filter((r) => r.employee_id === empId);
      const rawRecs: RawAttendanceRecord[] = empAtt.map((a) => ({
        personId: String(emp.person_id),
        name: empDisplayName(emp),
        department: emp.department,
        time: `${a.date} ${a.check_in_time || a.check_out_time || "00:00:00"}`,
        attendanceStatus: a.check_in_time ? "Check-in" as const : "Check-out" as const,
      }));

      // Build both check-in and check-out records
      const rawRecsAll: RawAttendanceRecord[] = [];
      empAtt.forEach((a) => {
        if (a.check_in_time) {
          rawRecsAll.push({
            personId: String(emp.person_id),
            name: empDisplayName(emp),
            time: `${a.date} ${a.check_in_time}`,
            attendanceStatus: "Check-in",
            excused_late: a.excused_late || false,
            excused_absence: a.excused_absence || false,
            excused_shortfall: a.excused_shortfall || false,
          });
        }
        if (a.check_out_time) {
          rawRecsAll.push({
            personId: String(emp.person_id),
            name: empDisplayName(emp),
            time: `${a.date} ${a.check_out_time}`,
            attendanceStatus: "Check-out",
            excused_late: a.excused_late || false,
            excused_absence: a.excused_absence || false,
            excused_shortfall: a.excused_shortfall || false,
          });
        }
        if (!a.check_in_time && !a.check_out_time) {
          rawRecsAll.push({
            personId: String(emp.person_id),
            name: empDisplayName(emp),
            time: `${a.date} 00:00:00`,
            attendanceStatus: "None",
            excused_late: a.excused_late || false,
            excused_absence: a.excused_absence || false,
            excused_shortfall: a.excused_shortfall || false,
          });
        }
      });

      let processed = processAttendanceRecords(rawRecsAll, config, selectedMonth, empSettings, holidayDates);

      // Align with Odoo day status (absent / holiday / leave / excused) when present.
      const statusByDate = new Map(empAtt.map((a) => [a.date, a]));
      processed = processed.map((rec) => {
        const a = statusByDate.get(rec.date);
        if (!a) return rec;
        const st = String(a.status || "");
        if (st === "holiday" && !rec.checkInTime) {
          return { ...rec, status: "holiday" as const, isScheduledWorkingDay: false, workingHours: 0 };
        }
        if (st === "leave" && !rec.checkInTime) {
          return {
            ...rec,
            status: "leave" as const,
            isLeaveDay: true,
            excusedAbsence: true,
            workingHours: 0,
          };
        }
        if ((st === "absent" || st === "absent_due_to_late_threshold") && !rec.checkInTime) {
          return {
            ...rec,
            status: st as ProcessedAttendanceRecord["status"],
            absenceReason: "no_punches",
            excusedAbsence: Boolean(a.excused_absence) || rec.excusedAbsence,
          };
        }
        if (a.excused_absence) return { ...rec, excusedAbsence: true };
        return rec;
      });

      // Apply approved leave (paid/unpaid) using leave-type is_paid flags.
      const leaveDateMap = buildLeaveDateMap(leaveRequests, empId, selectedMonth, leaveTypeInfos);
      if (Object.keys(leaveDateMap).length > 0) {
        processed = applyLeaveToRecords(processed, leaveDateMap);
      }

      // Get ledger
      const empLedger = ledgers.find(
        (l) => l.employee_id === empId && l.month_year === selectedMonth
      );
      const ledgerEntry: MonthlyLedgerEntry = {
        absenceDays: empLedger?.absence_days || [],
        loanByCurrency: empLedger?.loan_by_currency || {},
        tipByCurrency: empLedger?.tip_by_currency || {},
        penaltyByCurrency: empLedger?.penalty_by_currency || {},
      };

      const calc = calculateSalary(config, processed, selectedMonth, ledgerEntry, empSettings, holidayDates);

      const primaryCurrency = emp.currency || "IQD";
      const primaryCalc = calc.salaryByCurrency[primaryCurrency];

      rows.push({
        empId,
        name: empDisplayName(emp),
        department: emp.department || "—",
        basicSalary: emp.monthly_salary || 0,
        currency: primaryCurrency,
        daysWorked: calc.daysWorked,
        totalHours: calc.totalHours,
        overtime: calc.overtimeHours,
        shortfall: calc.shortfallHours,
        absences: calc.absenceDays.length,
        netSalary: primaryCalc?.netSalary || 0,
        calc,
        records: processed,
      });
    }

    return rows.sort((a, b) => a.name.localeCompare(b.name, "ar"));
  }, [attRecords, monthlyRecords, selectedMonth, empMap, ledgers, leaveRequests, leaveTypeInfos, holidayDates, allEmployeeAllowances, allowanceTypes, allEmployeeDeductions, deductionTypes, allLoans, dbDepartments, dbShifts]);

  // Stats
  const totalBasic = payrollData.reduce((s, r) => s + r.basicSalary, 0);
  const totalNet = payrollData.reduce((s, r) => s + r.netSalary, 0);
  const totalDeductions = totalBasic - totalNet;
  const totalEmployees = payrollData.length;

  // Persist payslips
  const [savingPayslips, setSavingPayslips] = useState(false);
  const [payslipsSaved, setPayslipsSaved] = useState(false);
  const handleSavePayslips = async () => {
    if (payrollData.length === 0) return;
    setSavingPayslips(true);
    try {
      const rows = payrollData.map((row: any) => ({
        employee_id: row.empId,
        month: selectedMonth,
        basic_salary: row.basicSalary,
        currency: row.currency,
        days_worked: row.daysWorked,
        total_hours: row.totalHours,
        overtime_hours: row.overtime,
        shortfall_hours: row.shortfall,
        absence_days: row.absences,
        net_salary: row.netSalary,
        late_deduction: row.calc?.salaryByCurrency?.[row.currency]?.lateDeduction || 0,
        shortfall_deduction: row.calc?.salaryByCurrency?.[row.currency]?.shortfallDeduction || 0,
        absence_deduction: row.calc?.salaryByCurrency?.[row.currency]?.absenceDeduction || 0,
        overtime_payment: row.calc?.salaryByCurrency?.[row.currency]?.overtimePayment || 0,
        generated_at: new Date().toISOString(),
      }));

      await odooData.generatePayslips({
        month: selectedMonth,
        payslips: rows,
        replace_month: true,
      });

      setPayslipsSaved(true);
      setTimeout(() => setPayslipsSaved(false), 3000);
    } catch (e: any) {
      console.error("Failed to save payslips:", e.message);
      localizedAlert(arabicSource("payroll.error_saving_statements") + " " + e.message);
    }
    setSavingPayslips(false);
  };

  /** Server-side compute (attendance/leave/holiday) — same snapshot contract. */
  const handleServerComputePayslips = async () => {
    if (!selectedMonth) return;
    setSavingPayslips(true);
    try {
      await odooData.computePayrollServer(selectedMonth);
      setPayslipsSaved(true);
      setTimeout(() => setPayslipsSaved(false), 3000);
      localizedAlert("Server payroll computed");
    } catch (e: any) {
      console.error("Server payroll compute failed:", e.message);
      localizedAlert(arabicSource("payroll.error_saving_statements") + " " + e.message);
    }
    setSavingPayslips(false);
  };

  if (loading || empLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-muted-foreground ms-3">{arabicSource("payroll.loading_salary_data")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-gradient-gold">{arabicSource("payroll.payroll_and_payroll_management")}</h1>
          <p className="text-muted-foreground mt-1">{arabicSource("payroll.comprehensive_payroll_system")} {displayMonth(selectedMonth)}</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className={selectCls} style={{ width: 180 }}>
            {availableMonths.map((m) => (
              <option key={m} value={m}>{displayMonth(m)}</option>
            ))}
          </select>
          <button
            onClick={handleSavePayslips}
            disabled={savingPayslips || payslipsSaved || payrollData.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg shadow-lg shadow-primary/20 hover:bg-gold-dark transition-colors cursor-pointer disabled:opacity-50"
            style={{ fontSize: 13 }}
          >
            {savingPayslips ? <Loader2 className="w-4 h-4 animate-spin" /> : payslipsSaved ? <CheckCircle className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            {savingPayslips ? arabicSource("common.saving") : payslipsSaved ? arabicSource("payroll.saved") : arabicSource("payroll.save_statements")}
          </button>
          <button
            onClick={handleServerComputePayslips}
            disabled={savingPayslips || !selectedMonth}
            title="Server compute from attendance/leave/holidays"
            className="flex items-center gap-2 px-4 py-2.5 border border-border text-foreground rounded-lg hover:bg-secondary transition-colors cursor-pointer disabled:opacity-50"
            style={{ fontSize: 13 }}
          >
            <Calculator className="w-4 h-4" />
            Server compute
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-card/40 border border-border/30 rounded-xl w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
              style={{ fontSize: 13 }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <OverviewTab
              payrollData={payrollData}
              totalBasic={totalBasic}
              totalNet={totalNet}
              totalDeductions={totalDeductions}
              totalEmployees={totalEmployees}
              selectedMonth={selectedMonth}
              onViewPayslip={setSelectedEmpId}
            />
          </motion.div>
        )}
        {activeTab === "upload" && (
          <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <UploadTab
              employees={employees}
              selectedMonth={selectedMonth}
              onComplete={() => { /* refetch */ }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Panel */}
      <PayrollDetailPanel
        empId={selectedEmpId}
        onClose={() => setSelectedEmpId(null)}
        payrollData={payrollData}
        selectedMonth={selectedMonth}
        employees={employees}
        ledgers={ledgers}
        onLedgerUpdate={async () => {
          await refetchLedgers();
        }}
        dbShifts={dbShifts}
        dbDepartments={dbDepartments}
        dbHolidays={dbHolidays}
        holidayDates={holidayDates}
        allowanceTypes={allowanceTypes}
        allEmployeeAllowances={allEmployeeAllowances}
        deductionTypes={deductionTypes}
        allEmployeeDeductions={allEmployeeDeductions}
        allLoans={allLoans}
        appSettings={appSettings}
      />
    </div>
  );
}

// ══════════════════════════ Overview Tab ══════════════════════════

function OverviewTab({
  payrollData,
  totalBasic,
  totalNet,
  totalDeductions,
  totalEmployees,
  selectedMonth,
  onViewPayslip,
}: {
  payrollData: any[];
  totalBasic: number;
  totalNet: number;
  totalDeductions: number;
  totalEmployees: number;
  selectedMonth: string;
  onViewPayslip: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [paySortBy, setPaySortBy] = useState<"name" | "department" | "basicSalary" | "daysWorked" | "totalHours" | "overtime" | "shortfall" | "absences" | "netSalary">("name");
  const [paySortDir, setPaySortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    const list = payrollData.filter((r: any) =>
      !search || r.name.includes(search) || r.department.includes(search)
    );
    const dir = paySortDir === "asc" ? 1 : -1;
    list.sort((a: any, b: any) => {
      if (paySortBy === "name") return dir * (a.name || "").localeCompare(b.name || "", "ar");
      if (paySortBy === "department") return dir * (a.department || "").localeCompare(b.department || "", "ar");
      return dir * ((a[paySortBy] || 0) - (b[paySortBy] || 0));
    });
    return list;
  }, [payrollData, search, paySortBy, paySortDir]);

  const stats = [
    { label: arabicSource("common.total_basic_salaries"), value: formatIQD(totalBasic), icon: Wallet, color: "text-primary", accent: "from-primary/10" },
    { label: arabicSource("payroll.net_salaries"), value: formatIQD(totalNet), icon: TrendingUp, color: "text-emerald-500", accent: "from-emerald-500/10" },
    { label: arabicSource("common.total_deductions"), value: formatIQD(Math.abs(totalDeductions)), icon: Calculator, color: "text-destructive", accent: "from-destructive/10" },
    { label: arabicSource("common.number_of_employees"), value: String(totalEmployees), icon: Users, color: "text-blue-500", accent: "from-blue-500/10" },
  ];

  const departmentPayroll = useMemo(() => {
    const map: Record<string, number> = {};
    payrollData.forEach((r: any) => { map[r.department] = (map[r.department] || 0) + r.netSalary; });
    return Object.entries(map).map(([name, total]) => ({
      label: name,
      value: Math.round(total / 1000),
    }));
  }, [payrollData]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)" }}
              className="relative bg-card backdrop-blur-sm border border-border rounded-xl p-4 shadow-lg overflow-hidden hover:border-primary/30 transition-colors"
            >
              <div className={`absolute top-0 end-0 w-28 h-28 bg-gradient-to-bl ${stat.accent} to-transparent rounded-bl-full`} />
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-muted-foreground" style={{ fontSize: 12 }}>{stat.label}</p>
                  <span className={`block mt-2 ${stat.color}`} style={{ fontSize: 22 }} dir="ltr">{stat.value}</span>
                </div>
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Chart */}
      {departmentPayroll.length > 0 && (
        <div className={`${cardCls} p-6`}>
          <h3 className="text-foreground mb-3" style={{ fontSize: 15 }}>{arabicSource("payroll.net_salaries_by_department_thousand_iqd")}</h3>
          <CustomBarChart data={departmentPayroll} barLabel={arabicSource("common.amount")} height={180} />
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={arabicSource("common.search_by_name_or_department")}
            className={`${inputCls} ps-10`}
          />
        </div>
      </div>

      {/* Table */}
      <div className={cardCls}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <SortableHeaderRow
                columns={[
                  { label: arabicSource("common.employee"), key: "name" },
                  { label: arabicSource("common.section"), key: "department" },
                  { label: arabicSource("common.basic_salary"), key: "basicSalary" },
                  { label: arabicSource("common.working_days"), key: "daysWorked" },
                  { label: arabicSource("common.working_hours"), key: "totalHours" },
                  { label: arabicSource("common.overtime"), key: "overtime" },
                  { label: arabicSource("common.shortage"), key: "shortfall" },
                  { label: arabicSource("common.absence"), key: "absences" },
                  { label: arabicSource("common.net_salary"), key: "netSalary" },
                ]}
                sortBy={paySortBy}
                sortDir={paySortDir}
                onSort={(key) => toggleSort(key, paySortBy, paySortDir, setPaySortBy, setPaySortDir)}
              />
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((r: any, i: number) => (
                <motion.tr
                  key={r.empId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-border/20 hover:bg-muted/10 transition-colors cursor-pointer"
                  onClick={() => onViewPayslip(r.empId)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary" style={{ fontSize: 12 }}>{r.name.charAt(0)}</span>
                      </div>
                      <span className="text-foreground whitespace-nowrap">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap" style={{ fontSize: 13 }}>{r.department}</td>
                  <td className="px-4 py-3 text-foreground whitespace-nowrap text-center" style={{ fontSize: 13 }} dir="ltr">
                    {formatCurrency(r.basicSalary, r.currency)}
                  </td>
                  <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }}>{r.daysWorked}</td>
                  <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }}>{r.totalHours.toFixed(1)}</td>
                  <td className="px-4 py-3" style={{ fontSize: 13 }}>
                    {r.overtime > 0 ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5" /> {r.overtime.toFixed(1)}h
                      </span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3" style={{ fontSize: 13 }}>
                    {r.shortfall > 0 ? (
                      <span className="text-amber-400 flex items-center gap-1">
                        <ArrowDownRight className="w-3.5 h-3.5" /> {r.shortfall.toFixed(1)}h
                      </span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3" style={{ fontSize: 13 }}>
                    {r.absences > 0 ? (
                      <span className="text-destructive">{r.absences} {arabicSource("common.days_2")}</span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center" style={{ fontSize: 13 }} dir="ltr">
                    <span className="text-gradient-gold">{formatCurrency(r.netSalary, r.currency)}</span>
                  </td>
                </motion.tr>
              )) : (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    {arabicSource("payroll.there_are_no_payroll_records_for_this_month")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Upload tab

function UploadTab({
  employees,
  selectedMonth,
  onComplete,
}: {
  employees: DbEmployee[];
  selectedMonth: string;
  onComplete: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [parseResult, setParseResult] = useState<{
    records: RawAttendanceRecord[];
    errors: string[];
    totalRows: number;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    setSaved(false);
    const result = await parseAttendanceFile(file);
    setParseResult(result);
    setUploading(false);
  };

  // Summary of parsed data
  const summary = useMemo(() => {
    if (!parseResult) return null;
    const { records } = parseResult;
    const uniqueEmployees = new Set(records.map((r) => r.personId));
    const uniqueDates = new Set(records.map((r) => r.time.substring(0, 10)));
    const checkIns = records.filter((r) => r.attendanceStatus === "Check-in").length;
    const checkOuts = records.filter((r) => r.attendanceStatus === "Check-out").length;
    const nones = records.filter((r) => r.attendanceStatus === "None").length;

    // Match with system employees
    const matched: string[] = [];
    const unmatched: string[] = [];
    for (const pid of uniqueEmployees) {
      const found = employees.find((e) => String(e.person_id) === pid);
      if (found) matched.push(pid);
      else unmatched.push(pid);
    }

    return {
      totalRecords: records.length,
      uniqueEmployees: uniqueEmployees.size,
      uniqueDates: uniqueDates.size,
      checkIns,
      checkOuts,
      nones,
      matched,
      unmatched,
      dateRange: [...uniqueDates].sort(),
    };
  }, [parseResult, employees]);

  const handleSaveToSupabase = async () => {
    if (!parseResult || parseResult.records.length === 0) return;
    setSaving(true);

    try {
      const { records } = parseResult;
      // Group by person+date → build processed attendance records
      const grouped: Record<string, RawAttendanceRecord[]> = {};
      for (const r of records) {
        const key = `${r.personId}__${r.time.substring(0, 10)}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(r);
      }

      const attRows: any[] = [];

      for (const [key, recs] of Object.entries(grouped)) {
        const [personId, date] = key.split("__");
        const emp = employees.find((e) => String(e.person_id) === personId);
        if (!emp) continue;

        const checkIns = recs.filter((r) => r.attendanceStatus === "Check-in").sort((a, b) => a.time.localeCompare(b.time));
        const checkOuts = recs.filter((r) => r.attendanceStatus === "Check-out").sort((a, b) => a.time.localeCompare(b.time));

        let checkInTime: string | null = null;
        let checkOutTime: string | null = null;
        let status = "complete";

        if (checkIns.length > 0 && checkOuts.length > 0) {
          checkInTime = checkIns[0].time.substring(11, 19);
          checkOutTime = checkOuts[checkOuts.length - 1].time.substring(11, 19);
        } else if (checkIns.length >= 2) {
          checkInTime = checkIns[0].time.substring(11, 19);
          checkOutTime = checkIns[checkIns.length - 1].time.substring(11, 19);
        } else if (checkOuts.length >= 2) {
          checkInTime = checkOuts[0].time.substring(11, 19);
          checkOutTime = checkOuts[checkOuts.length - 1].time.substring(11, 19);
        } else if (checkIns.length === 1) {
          checkInTime = checkIns[0].time.substring(11, 19);
          status = "missing_checkout";
        } else if (checkOuts.length === 1) {
          checkOutTime = checkOuts[0].time.substring(11, 19);
          status = "missing_checkin";
        } else {
          status = "absent";
        }

        // Calculate working hours
        let workingHours = 0;
        let overtimeHours = 0;
        let isLate = false;
        let lateMinutes = 0;
        let isEarly = false;

        if (checkInTime && checkOutTime) {
          const inParts = checkInTime.split(":").map(Number);
          const outParts = checkOutTime.split(":").map(Number);
          const inMin = inParts[0] * 60 + inParts[1];
          const outMin = outParts[0] * 60 + outParts[1];
          const totalMin = outMin > inMin ? outMin - inMin : 0;
          workingHours = Math.round((totalMin / 60) * 100) / 100;

          // Check late (assuming 7:00 start + 10 min grace)
          if (inMin > 7 * 60 + 10) {
            isLate = true;
            lateMinutes = inMin - 7 * 60;
          }
          // Check overtime (assuming 16:00 end)
          if (outMin > 16 * 60) {
            overtimeHours = Math.round(((outMin - 16 * 60) / 60) * 100) / 100;
          }
          // Check early
          if (outMin < 15 * 60 + 50) {
            isEarly = true;
          }
        }

        const d = new Date(date + "T00:00:00Z");
        const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const dayOfWeek = dayNames[d.getUTCDay()];

        attRows.push({
          employee_id: emp.id,
          date,
          day_of_week: dayOfWeek,
          check_in_time: checkInTime,
          check_out_time: checkOutTime,
          working_hours: workingHours,
          overtime_hours: overtimeHours,
          is_late: isLate,
          late_minutes: lateMinutes,
          is_early: isEarly,
          status,
          auto_checkout_applied: false,
        });
      }

      if (attRows.length > 0) {
        for (let i = 0; i < attRows.length; i += 100) {
          const batch = attRows.slice(i, i + 100).map((r: any) => ({
            employee_id: r.employee_id,
            date: r.date,
            check_in_time: r.check_in_time,
            check_out_time: r.check_out_time,
            status: r.status,
            source: "manual",
          }));
          await odooData.importAttendance(batch);
        }
      }

      setSaved(true);
    } catch (err: any) {
      console.error("Error saving:", err);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className={`${cardCls} p-8`}>
        <div className="text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center mx-auto mb-4">
            <FileSpreadsheet className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-foreground mb-2">{arabicSource("payroll.uploading_the_attendance_and_departure_file")}</h3>
          <p className="text-muted-foreground mb-6" style={{ fontSize: 13 }}>
            {arabicSource("payroll.upload_an_excel_or_csv_file_containing_the_columns_person_id_nam")}
          </p>

          <div
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 transition-colors cursor-pointer ${
              parseResult
                ? "border-emerald-500/40 bg-emerald-500/5"
                : "border-border hover:border-primary/50 hover:bg-primary/5"
            }`}
          >
            {uploading ? (
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <span className="text-foreground">{arabicSource("payroll.analyzing_the_file")}</span>
              </div>
            ) : parseResult ? (
              <div className="flex items-center justify-center gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
                <span className="text-emerald-400">{arabicSource("payroll.the_file_was_successfully_parsed_click_to_upload_another_file")}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-primary/60" />
                <span className="text-foreground" style={{ fontSize: 14 }}>{arabicSource("payroll.click_to_select_a_file_or_drag_it_here")}</span>
                <span className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("payroll.excel_xlsx_xls_or_csv_max_10mb")}</span>
              </div>
            )}
          </div>
          <input
            ref={fileRef} type="file" accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
          />
        </div>
      </div>

      {/* Parse Errors */}
      {parseResult && parseResult.errors.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <span className="text-destructive" style={{ fontSize: 14 }}>{arabicSource("payroll.warnings")}{parseResult.errors.length})</span>
          </div>
          <ul className="space-y-1 max-h-32 overflow-y-auto">
            {parseResult.errors.slice(0, 20).map((err, i) => (
              <li key={i} className="text-destructive/80 ps-4" style={{ fontSize: 12 }}>• {err}</li>
            ))}
            {parseResult.errors.length > 20 && (
              <li className="text-destructive/60 ps-4" style={{ fontSize: 12 }}>{arabicSource("payroll.and")} {parseResult.errors.length - 20} {arabicSource("payroll.another_warning")}</li>
            )}
          </ul>
        </div>
      )}

      {/* Parse Summary */}
      {summary && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: arabicSource("common.total_records"), value: summary.totalRecords, icon: FileText },
              { label: arabicSource("common.number_of_employees"), value: summary.uniqueEmployees, icon: Users },
              { label: arabicSource("payroll.number_of_days"), value: summary.uniqueDates, icon: CalendarDays },
              { label: arabicSource("payroll.are_identical_to_the_system"), value: summary.matched.length, icon: UserCheck },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className={`${cardCls} p-4`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-muted-foreground" style={{ fontSize: 12 }}>{s.label}</p>
                      <span className="text-foreground" style={{ fontSize: 20 }}>{s.value}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Details chips */}
          <div className={`${cardCls} p-5`}>
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" style={{ fontSize: 12 }}>
                Check-in: {summary.checkIns}
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400" style={{ fontSize: 12 }}>
                Check-out: {summary.checkOuts}
              </span>
              {summary.nones > 0 && (
                <span className="px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive" style={{ fontSize: 12 }}>
                  {arabicSource("payroll.none_absence")} {summary.nones}
                </span>
              )}
              {summary.dateRange.length > 0 && (
                <span className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary" style={{ fontSize: 12 }}>
                  {arabicSource("common.from")} {summary.dateRange[0]} {arabicSource("common.to")} {summary.dateRange[summary.dateRange.length - 1]}
                </span>
              )}
            </div>

            {summary.unmatched.length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
                <p className="text-amber-400 mb-1" style={{ fontSize: 13 }}>
                  <TriangleAlert className="w-4 h-4 inline-block me-1" />
                  {summary.unmatched.length} {arabicSource("payroll.an_employee_that_does_not_match_the_system")}
                </p>
                <p className="text-amber-400/70" style={{ fontSize: 12 }}>
                  IDs: {summary.unmatched.join(", ")}
                </p>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSaveToSupabase}
              disabled={saving || saved || summary.matched.length === 0}
              className="flex items-center gap-3 px-8 py-3.5 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20 hover:bg-gold-dark transition-colors cursor-pointer disabled:opacity-50"
              style={{ fontSize: 14 }}
            >
              {saving ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> {arabicSource("payroll.saving_to_database")}</>
              ) : saved ? (
                <><CheckCircle className="w-5 h-5" /> {arabicSource("payroll.saved_successfully")}</>
              ) : (
                <><Download className="w-5 h-5" /> {arabicSource("common.save")} {summary.matched.length} {arabicSource("payroll.database_employee")}</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════ Payroll Detail Panel ══════════════════════════

function PayrollDetailPanel({
  empId,
  onClose,
  payrollData,
  selectedMonth,
  employees,
  ledgers,
  onLedgerUpdate,
  dbShifts,
  dbDepartments,
  dbHolidays,
  holidayDates,
  allowanceTypes,
  allEmployeeAllowances,
  deductionTypes,
  allEmployeeDeductions,
  allLoans,
  appSettings,
}: {
  empId: string | null;
  onClose: () => void;
  payrollData: any[];
  selectedMonth: string;
  employees: DbEmployee[];
  ledgers: DbMonthlyLedger[];
  onLedgerUpdate: () => Promise<void>;
  dbShifts: DbShift[];
  dbDepartments: any[];
  dbHolidays: any[];
  holidayDates: Set<string>;
  allowanceTypes: any[];
  allEmployeeAllowances: any[];
  deductionTypes: any[];
  allEmployeeDeductions: any[];
  allLoans: any[];
  appSettings: any;
}) {
  const displayMonth = (m: string) => formatMonthYear(m, appSettings.monthFormat);
  const [showShortfall, setShowShortfall] = useState(false);
  const [showAbsence, setShowAbsence] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [editingLedger, setEditingLedger] = useState(false);
  const [ledgerSaving, setLedgerSaving] = useState(false);
  const [ledgerLoan, setLedgerLoan] = useState(0);
  const [ledgerTip, setLedgerTip] = useState(0);
  const [ledgerPenalty, setLedgerPenalty] = useState(0);
  const [ledgerCurrency, setLedgerCurrency] = useState<"IQD" | "USD">("IQD");

  // Reset ledger currency to employee's default when employee changes
  useEffect(() => {
    if (!empId) return;
    const empFound = employees.find((e) => e.id === empId);
    setLedgerCurrency((empFound?.currency as "IQD" | "USD") || "IQD");
    setShowShortfall(false);
    setShowAbsence(false);
    setShowCalendar(false);
  }, [empId, employees]);

  // Sync ledger values when employee/month/ledgers/currency change
  useEffect(() => {
    if (!empId) return;
    const cl = ledgers.find((l) => l.employee_id === empId && l.month_year === selectedMonth);
    const c = ledgerCurrency;
    setLedgerLoan(cl?.loan_by_currency?.[c] || 0);
    setLedgerTip(cl?.tip_by_currency?.[c] || 0);
    setLedgerPenalty(cl?.penalty_by_currency?.[c] || 0);
    setEditingLedger(false);
  }, [empId, selectedMonth, ledgers, ledgerCurrency]);

  // Must be declared before any early return (Rules of Hooks)
  const [excuseVersion, bumpExcuseVersion] = useReducer((x: number) => x + 1, 0);

  const selectedData = payrollData.find((r: any) => r.empId === empId);

  // Recalculate salary live (respects excusedShortfall / excusedAbsence mutations)
  const empForCalc = employees.find((e) => e.id === empId);
  const currentLedgerForCalc = ledgers.find(
    (l) => l.employee_id === empId && l.month_year === selectedMonth
  );
  const liveCalc = useMemo(() => {
    if (!selectedData || !empForCalc) return null;
    const recs = selectedData.records as ProcessedAttendanceRecord[];
    const empShift = resolveEmployeeShift(empForCalc, dbDepartments, dbShifts);
    const empSchedule = empShift ? shiftToSchedule(empShift) : DEFAULT_SCHEDULE;
    const empSettings = empShift ? buildSettingsFromShift(empShift) : DEFAULT_SETTINGS;
    const liveEmpAllowances = allEmployeeAllowances
      .filter(a => a.employee_id === empForCalc.id)
      .map(a => {
        const aType = allowanceTypes.find(t => t.id === a.allowance_type_id);
        return { name: aType?.name_ar || arabicSource("common.allowance"), amount: a.amount, currency: a.currency };
      });
    const liveEmpDeductions = allEmployeeDeductions
      .filter(d => d.employee_id === empForCalc.id)
      .map(d => {
        const dType = deductionTypes.find(t => t.id === d.deduction_type_id);
        return {
          name: dType?.name_ar || arabicSource("common.deduction"),
          amount: d.amount,
          percentage: d.percentage,
          calcMethod: d.calc_method || dType?.calc_method || "fixed",
          percentageOf: dType?.percentage_of || "base_salary",
          currency: d.currency,
        };
      });
    const liveActiveLoan = allLoans.find(l => l.employee_id === empForCalc.id && l.status === "active");

    const config: EmployeePayConfig = {
      id: empForCalc.id,
      personId: String(empForCalc.person_id),
      name: empDisplayName(empForCalc),
      department: empForCalc.department,
      salarySlots: [{ currency: empForCalc.currency || "IQD", amount: empForCalc.monthly_salary || 0, overtimeRate: empForCalc.overtime_rate || 0 }],
      overtimeEnabled: empForCalc.overtime_enabled ?? false,
      schedule: empSchedule,
      allowances: liveEmpAllowances,
      deductions: liveEmpDeductions,
      activeLoanInstallment: liveActiveLoan?.installment_amount,
      activeLoanCurrency: liveActiveLoan?.currency,
      joinDate: empForCalc.join_date || undefined,
    };
    const ledgerEntry: MonthlyLedgerEntry = {
      absenceDays: currentLedgerForCalc?.absence_days || [],
      loanByCurrency: currentLedgerForCalc?.loan_by_currency || {},
      tipByCurrency: currentLedgerForCalc?.tip_by_currency || {},
      penaltyByCurrency: currentLedgerForCalc?.penalty_by_currency || {},
    };
    return calculateSalary(config, recs, selectedMonth, ledgerEntry, empSettings, holidayDates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedData, empForCalc, selectedMonth, currentLedgerForCalc, excuseVersion, dbDepartments, dbShifts, holidayDates, allEmployeeAllowances, allowanceTypes, allEmployeeDeductions, deductionTypes, allLoans]);

  const isOpen = !!(empId && selectedData && empForCalc);

  const records = isOpen ? (selectedData!.records as ProcessedAttendanceRecord[]) : [];
  // calc is guaranteed non-null when isOpen is true (all JSX usage is inside isOpen guard)
  const calc = (isOpen ? (liveCalc || selectedData!.calc) : null) as SalaryCalculation;
  const shortfallRecs = isOpen ? getShortfallRecords(records, DEFAULT_SETTINGS.targetWorkingHoursPerDay) : [];
  const absenceRecs = isOpen ? getAbsenceRecords(records) : [];
  const leaveRecs = isOpen ? getLeaveRecords(records) : [];
  const paidLeaveCount = leaveRecs.filter((r) => !r.isUnpaidLeave).length;
  const unpaidLeaveCount = leaveRecs.filter((r) => r.isUnpaidLeave).length;

  const currentLedger = currentLedgerForCalc;

  const handleSaveLedger = async () => {
    if (!empId) return;
    setLedgerSaving(true);
    try {
      const c = ledgerCurrency;
      const existingLoan = currentLedger?.loan_by_currency || {};
      const existingTip = currentLedger?.tip_by_currency || {};
      const existingPenalty = currentLedger?.penalty_by_currency || {};
      const payload = {
        employee_id: empId,
        month_year: selectedMonth,
        loan_by_currency: { ...existingLoan, [c]: ledgerLoan },
        tip_by_currency: { ...existingTip, [c]: ledgerTip },
        penalty_by_currency: { ...existingPenalty, [c]: ledgerPenalty },
      };

      await odooData.upsertMonthlyLedger(payload);
      await onLedgerUpdate();
      setEditingLedger(false);
    } catch (e: any) {
      console.error("Failed to save ledger:", e.message);
      localizedAlert(arabicSource("payroll.error_saving_modifications") + " " + (e.message || arabicSource("payroll.an_unexpected_error_occurred")));
    } finally {
      setLedgerSaving(false);
    }
  };

  const avgHoursPerDay = calc && calc.daysWorked > 0 ? calc.totalHours / calc.daysWorked : 0;

  // Escape key to dismiss panel
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="panel-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="panel-content"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 end-0 z-50 h-full w-full max-w-2xl bg-background border-s border-border shadow-2xl overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label={arabicSource("common.employee_details")}
          >
            <div className="p-6 space-y-6 pb-24">
              {/* Close Button & Employee Header */}
              <div className="flex items-center gap-4">
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                  aria-label={arabicSource("common.close")}
                >
                  <X className="w-5 h-5 text-foreground" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <span className="text-primary" style={{ fontSize: 18 }}>{selectedData.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h2 className="text-foreground">{selectedData.name}</h2>
                    <p className="text-muted-foreground" style={{ fontSize: 13 }}>
                      {selectedData.department} — {displayMonth(selectedMonth)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary Chips */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {
                    label: arabicSource("common.working_days"),
                    value: `${calc.daysWorked} / ${calc.scheduledWorkingDays}`,
                    icon: CalendarDays,
                    color: "text-foreground",
                  },
                  {
                    label: arabicSource("common.working_hours"),
                    value: `${calc.totalHours.toFixed(1)}h`,
                    icon: Clock,
                    color: "text-foreground",
                  },
                  {
                    label: arabicSource("payroll.average_day"),
                    value: `${avgHoursPerDay.toFixed(1)}h`,
                    icon: BarChart3,
                    color: avgHoursPerDay >= DEFAULT_SETTINGS.targetWorkingHoursPerDay ? "text-emerald-400" : "text-amber-400",
                  },
                  {
                    label: arabicSource("common.overtime"),
                    value: calc.overtimeHours > 0 ? formatHoursMinutes(calc.overtimeHours) : "—",
                    icon: ArrowUpRight,
                    color: "text-emerald-400",
                  },
                  {
                    label: arabicSource("common.shortage"),
                    value: calc.shortfallHours > 0 ? formatHoursMinutes(calc.shortfallHours) : "—",
                    icon: ArrowDownRight,
                    color: "text-amber-400",
                    onClick: shortfallRecs.length > 0 ? () => setShowShortfall(true) : undefined,
                  },
                  {
                    label: arabicSource("common.absence"),
                    value: calc.absenceDays.length > 0 ? `${calc.absenceDays.length} ${arabicSource("common.days_2")}` : "—",
                    icon: XCircle,
                    color: "text-destructive",
                    onClick: absenceRecs.length > 0 ? () => setShowAbsence(true) : undefined,
                  },
                  {
                    label: arabicSource("common.vacations"),
                    value: leaveRecs.length > 0 ? `${paidLeaveCount}${unpaidLeaveCount > 0 ? ` + ${unpaidLeaveCount} ${arabicSource("payroll.b_r")}` : ""} ${arabicSource("common.days_2")}` : "—",
                    icon: TreePalm,
                    color: "text-blue-400",
                  },
                  {
                    label: arabicSource("common.calendar"),
                    value: showCalendar ? arabicSource("common.is_open") : arabicSource("common.width"),
                    icon: CalendarDays,
                    color: showCalendar ? "text-primary" : "text-muted-foreground",
                    onClick: () => setShowCalendar(!showCalendar),
                  },
                ].map((chip) => {
                  const Icon = chip.icon;
                  return (
                    <button
                      key={chip.label}
                      onClick={chip.onClick}
                      disabled={!chip.onClick}
                      className={`${cardCls} p-4 text-start ${chip.onClick ? "hover:border-primary/40 cursor-pointer" : ""} ${chip.label === arabicSource("common.calendar") && showCalendar ? "border-primary/40 bg-primary/5" : ""}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${chip.color}`} />
                        <span className="text-muted-foreground" style={{ fontSize: 11 }}>{chip.label}</span>
                      </div>
                      <span className={chip.color} style={{ fontSize: 18 }}>{chip.value}</span>
                    </button>
                  );
                })}
              </div>

              {/* Ledger Editor + Salary Breakdown */}
              <div className="flex flex-col gap-5">
              {/* Ledger Editor (Loan / Tip / Penalty) */}
              <div className={`${cardCls} p-6`}>
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                      <Pencil className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-foreground">{arabicSource("payroll.monthly_adjustments")}</h3>
                      <p className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("payroll.advances_rewards_and_penalties")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 rounded-lg border border-border/40 p-0.5 bg-muted/10">
                      {(["IQD", "USD"] as const).map((cur) => (
                        <button
                          key={cur}
                          onClick={() => setLedgerCurrency(cur)}
                          className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                            ledgerCurrency === cur
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          style={{ fontSize: 12 }}
                        >
                          {cur}
                        </button>
                      ))}
                    </div>
                  {!editingLedger ? (
                    <button
                      onClick={() => setEditingLedger(true)}
                      className="px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors cursor-pointer flex items-center gap-2"
                      style={{ fontSize: 12 }}
                    >
                      <Pencil className="w-3.5 h-3.5" /> {arabicSource("common.edit")}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingLedger(false)}
                        className="px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted/20 transition-colors cursor-pointer"
                        style={{ fontSize: 12 }}
                      >
                        {arabicSource("common.cancel")}
                      </button>
                      <button
                        onClick={handleSaveLedger}
                        disabled={ledgerSaving}
                        className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
                        style={{ fontSize: 12 }}
                      >
                        {ledgerSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        {arabicSource("common.save")}
                      </button>
                    </div>
                  )}
                  </div>
                </div>

                {(() => {
                  const otherCurrency = ledgerCurrency === "IQD" ? "USD" : "IQD";
                  const otherLoan = currentLedger?.loan_by_currency?.[otherCurrency] || 0;
                  const otherTip = currentLedger?.tip_by_currency?.[otherCurrency] || 0;
                  const otherPenalty = currentLedger?.penalty_by_currency?.[otherCurrency] || 0;
                  return (
                    <div className="space-y-3">
                      {[
                        { label: arabicSource("common.advance"), value: ledgerLoan, setter: setLedgerLoan, icon: Minus, color: "text-destructive", otherVal: otherLoan },
                        { label: arabicSource("common.gratuity_tip"), value: ledgerTip, setter: setLedgerTip, icon: Plus, color: "text-emerald-400", otherVal: otherTip },
                        { label: arabicSource("payroll.penalty"), value: ledgerPenalty, setter: setLedgerPenalty, icon: Minus, color: "text-destructive", otherVal: otherPenalty },
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-border/15">
                            <span className={`${item.color} flex items-center gap-2`} style={{ fontSize: 14 }}>
                              <Icon className="w-4 h-4" />
                              {item.label}
                            </span>
                            <div className="flex items-center gap-3">
                              {!editingLedger && item.otherVal > 0 && (
                                <span className="text-muted-foreground/50" style={{ fontSize: 11 }} dir="ltr">
                                  {item.icon === Plus ? "+" : "-"}{formatCurrency(item.otherVal, otherCurrency)}
                                </span>
                              )}
                              {editingLedger ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={item.value || ""}
                                    onChange={(e) => item.setter(Number(e.target.value) || 0)}
                                    className="w-32 h-8 px-3 rounded-lg border border-border bg-input-background text-foreground text-end outline-none focus:ring-2 focus:ring-ring"
                                    style={{ fontSize: 13 }}
                                    dir="ltr"
                                    min={0}
                                    placeholder="0"
                                  />
                                  <span className="text-muted-foreground" style={{ fontSize: 11 }}>{ledgerCurrency}</span>
                                </div>
                              ) : (
                                <span className={item.color} style={{ fontSize: 14 }} dir="ltr">
                                  {item.value > 0 ? `${item.icon === Plus ? "+" : "-"}${formatCurrency(item.value, ledgerCurrency)}` : "—"}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Salary Breakdown Per Currency */}
              {Object.values(calc.salaryByCurrency).map((sc) => (
                <div key={sc.currency} className={`${cardCls} p-6`}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                      <Banknote className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-foreground">{arabicSource("payroll.salary_details")} {sc.currency === "IQD" ? arabicSource("payroll.iraqi_dinar") : sc.currency === "USD" ? arabicSource("payroll.us_dollars") : sc.currency}</h3>
                      <p className="text-muted-foreground" style={{ fontSize: 12 }}>{displayMonth(selectedMonth)}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2.5 border-b border-border/20">
                      <span className="text-foreground" style={{ fontSize: 14 }}>{arabicSource("common.basic_salary")}</span>
                      <span className="text-foreground" style={{ fontSize: 14 }} dir="ltr">{formatCurrency(sc.baseSalary, sc.currency)}</span>
                    </div>

                    {sc.overtimePayment > 0 && (
                      <div className="flex items-center justify-between py-2.5 border-b border-border/20">
                        <span className="text-emerald-400 flex items-center gap-2" style={{ fontSize: 14 }}>
                          <ArrowUpRight className="w-4 h-4" />
                          {arabicSource("payroll.overtime")}{formatHoursMinutes(calc.overtimeHours)})
                        </span>
                        <span className="text-emerald-400" style={{ fontSize: 14 }} dir="ltr">+{formatCurrency(sc.overtimePayment, sc.currency)}</span>
                      </div>
                    )}

                    {sc.allowanceBreakdown.length > 0 && (
                      <>
                        <div className="pt-2">
                          <p className="text-muted-foreground mb-2" style={{ fontSize: 12 }}>{arabicSource("payroll.allowances")}</p>
                        </div>
                        {sc.allowanceBreakdown.map((a, idx) => (
                          <div key={idx} className="flex items-center justify-between py-2 ps-4 border-b border-border/10">
                            <span className="text-emerald-400 flex items-center gap-2" style={{ fontSize: 13 }}>
                              <Plus className="w-3.5 h-3.5" />
                              {a.name}
                            </span>
                            <span className="text-emerald-400" style={{ fontSize: 13 }} dir="ltr">+{formatCurrency(a.amount, sc.currency)}</span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between py-2 ps-4">
                          <span className="text-emerald-400" style={{ fontSize: 13, fontWeight: 500 }}>{arabicSource("common.total_allowances")}</span>
                          <span className="text-emerald-400" style={{ fontSize: 13, fontWeight: 500 }} dir="ltr">+{formatCurrency(sc.totalAllowances, sc.currency)}</span>
                        </div>
                      </>
                    )}

                    <div className="flex items-center justify-between py-2.5 bg-primary/5 rounded-lg px-3 -mx-3">
                      <span className="text-primary" style={{ fontSize: 14 }}>{arabicSource("payroll.gross_salary")}</span>
                      <span className="text-primary" style={{ fontSize: 16 }} dir="ltr">{formatCurrency(sc.grossSalary, sc.currency)}</span>
                    </div>

                    {(sc.lateDeduction > 0 || sc.shortfallDeduction > 0 || sc.absenceDeduction > 0 || sc.loan > 0 || sc.penalty > 0 || sc.tip > 0 || sc.totalStatutoryDeductions > 0 || sc.loanInstallment > 0) && (
                      <div className="pt-2">
                        <p className="text-muted-foreground mb-2" style={{ fontSize: 12 }}>{arabicSource("payroll.deductions_and_adjustments")}</p>
                      </div>
                    )}

                    {sc.lateDeduction > 0 && (
                      <div className="flex items-center justify-between py-2 ps-4 border-b border-border/10">
                        <span className="text-orange-400 flex items-center gap-2" style={{ fontSize: 13 }}>
                          <Clock className="w-3.5 h-3.5" />
                          {arabicSource("payroll.delay")}{calc.lateDays} {arabicSource("common.days_3")}
                        </span>
                        <span className="text-destructive" style={{ fontSize: 13 }} dir="ltr">-{formatCurrency(sc.lateDeduction, sc.currency)}</span>
                      </div>
                    )}

                    {sc.shortfallDeduction > 0 && (
                      <div className="flex items-center justify-between py-2 ps-4 border-b border-border/10">
                        <span className="text-amber-400 flex items-center gap-2" style={{ fontSize: 13 }}>
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          {arabicSource("payroll.shortage_of_hours")}{formatHoursMinutes(calc.shortfallHours)})
                        </span>
                        <span className="text-destructive" style={{ fontSize: 13 }} dir="ltr">-{formatCurrency(sc.shortfallDeduction, sc.currency)}</span>
                      </div>
                    )}

                    {sc.absenceDeduction > 0 && (
                      <div className="flex items-center justify-between py-2 ps-4 border-b border-border/10">
                        <span className="text-destructive flex items-center gap-2" style={{ fontSize: 13 }}>
                          <XCircle className="w-3.5 h-3.5" />
                          {arabicSource("payroll.absence")}{calc.absenceDays.length} {arabicSource("common.days_3")}
                        </span>
                        <span className="text-destructive" style={{ fontSize: 13 }} dir="ltr">-{formatCurrency(sc.absenceDeduction, sc.currency)}</span>
                      </div>
                    )}

                    {sc.loan > 0 && (
                      <div className="flex items-center justify-between py-2 ps-4 border-b border-border/10">
                        <span className="text-muted-foreground" style={{ fontSize: 13 }}>{arabicSource("common.advance")}</span>
                        <span className="text-destructive" style={{ fontSize: 13 }} dir="ltr">-{formatCurrency(sc.loan, sc.currency)}</span>
                      </div>
                    )}

                    {sc.penalty > 0 && (
                      <div className="flex items-center justify-between py-2 ps-4 border-b border-border/10">
                        <span className="text-muted-foreground" style={{ fontSize: 13 }}>{arabicSource("payroll.penalties")}</span>
                        <span className="text-destructive" style={{ fontSize: 13 }} dir="ltr">-{formatCurrency(sc.penalty, sc.currency)}</span>
                      </div>
                    )}

                    {sc.deductionBreakdown.length > 0 && (
                      <>
                        {sc.deductionBreakdown.map((d, idx) => (
                          <div key={idx} className="flex items-center justify-between py-2 ps-4 border-b border-border/10">
                            <span className="text-orange-400 flex items-center gap-2" style={{ fontSize: 13 }}>
                              <Minus className="w-3.5 h-3.5" />
                              {d.name}
                            </span>
                            <span className="text-destructive" style={{ fontSize: 13 }} dir="ltr">-{formatCurrency(d.amount, sc.currency)}</span>
                          </div>
                        ))}
                      </>
                    )}

                    {sc.loanInstallment > 0 && (
                      <div className="flex items-center justify-between py-2 ps-4 border-b border-border/10">
                        <span className="text-orange-400 flex items-center gap-2" style={{ fontSize: 13 }}>
                          <CreditCard className="w-3.5 h-3.5" />
                          {arabicSource("payroll.loan_installment")}
                        </span>
                        <span className="text-destructive" style={{ fontSize: 13 }} dir="ltr">-{formatCurrency(sc.loanInstallment, sc.currency)}</span>
                      </div>
                    )}

                    {sc.tip > 0 && (
                      <div className="flex items-center justify-between py-2 ps-4 border-b border-border/10">
                        <span className="text-emerald-400" style={{ fontSize: 13 }}>{arabicSource("common.gratuity_tip")}</span>
                        <span className="text-emerald-400" style={{ fontSize: 13 }} dir="ltr">+{formatCurrency(sc.tip, sc.currency)}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between py-3 mt-2 bg-gradient-to-l from-primary/10 to-transparent rounded-lg px-3 -mx-3 border border-primary/20">
                      <span className="text-primary flex items-center gap-2" style={{ fontSize: 16 }}>
                        <CreditCard className="w-5 h-5" />
                        {arabicSource("common.net_salary")}
                      </span>
                      <span className="text-gradient-gold" style={{ fontSize: 22 }} dir="ltr">{formatCurrency(sc.netSalary, sc.currency)}</span>
                    </div>
                  </div>
                </div>
              ))}
              </div>

              {/* Leave Days Info */}
              {leaveRecs.length > 0 && (
                <div className={`${cardCls} p-5`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <TreePalm className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-foreground">{arabicSource("payroll.approved_vacation_days")}</h3>
                      <p className="text-muted-foreground" style={{ fontSize: 12 }}>
                        {paidLeaveCount > 0 && `${paidLeaveCount} ${arabicSource("payroll.day_with_salary")}`}
                        {paidLeaveCount > 0 && unpaidLeaveCount > 0 && " — "}
                        {unpaidLeaveCount > 0 && <span className="text-destructive">{unpaidLeaveCount} {arabicSource("payroll.day_without_pay_deducted")}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {leaveRecs.map((rec) => (
                      <div
                        key={rec.id}
                        className={`flex items-center justify-between py-2 px-3 rounded-lg border ${
                          rec.isUnpaidLeave
                            ? "bg-destructive/5 border-destructive/15"
                            : "bg-blue-500/5 border-blue-500/15"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-foreground" style={{ fontSize: 12 }}>{rec.date}</span>
                          <span className="text-muted-foreground" style={{ fontSize: 11 }}>{dayNamesAr[rec.dayOfWeek] || rec.dayOfWeek}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-center ${
                              rec.isUnpaidLeave
                                ? "bg-destructive/10 text-destructive border border-destructive/20"
                                : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            }`}
                            style={{ fontSize: 10 }}
                          >
                            {rec.leaveType}
                          </span>
                          {rec.isUnpaidLeave && (
                            <span className="text-destructive" style={{ fontSize: 10 }}>{arabicSource("common.discounted")}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <AnimatePresence>
                {showCalendar && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <CalendarView
                      records={records}
                      settings={DEFAULT_SETTINGS}
                      monthYear={selectedMonth}
                      onExcuseAbsence={(id) => {
                        const rec = records.find((r) => r.id === id);
                        if (rec) {
                          rec.excusedAbsence = !rec.excusedAbsence; bumpExcuseVersion();
                          if (empId) {
                            odooData.excuseAttendance({ employee_id: empId, date: rec.date, excused_absence: rec.excusedAbsence }).catch(() => {});
                          }
                        }
                      }}
                      onExcuseShortfall={(id) => {
                        const rec = records.find((r) => r.id === id);
                        if (rec) {
                          rec.excusedShortfall = !rec.excusedShortfall; bumpExcuseVersion();
                          if (empId) {
                            odooData.excuseAttendance({ employee_id: empId, date: rec.date, excused_shortfall: rec.excusedShortfall }).catch(() => {});
                          }
                        }
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Shortfall Popover */}
              <AnimatePresence>
                {showShortfall && (
                  <ShortfallPopover
                    records={shortfallRecs}
                    targetHours={DEFAULT_SETTINGS.targetWorkingHoursPerDay}
                    onClose={() => setShowShortfall(false)}
                    onExcuse={(id) => {
                      const rec = records.find((r) => r.id === id);
                      if (rec) {
                        rec.excusedShortfall = !rec.excusedShortfall; bumpExcuseVersion();
                        if (empId) {
                          odooData.excuseAttendance({ employee_id: empId, date: rec.date, excused_shortfall: rec.excusedShortfall }).catch(() => {});
                        }
                      }
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Absence Popover */}
              <AnimatePresence>
                {showAbsence && (
                  <AbsencePopover
                    records={absenceRecs}
                    onClose={() => setShowAbsence(false)}
                    onExcuse={(id) => {
                      const rec = records.find((r) => r.id === id);
                      if (rec) {
                        rec.excusedAbsence = !rec.excusedAbsence; bumpExcuseVersion();
                        if (empId) {
                          odooData.excuseAttendance({ employee_id: empId, date: rec.date, excused_absence: rec.excusedAbsence }).catch(() => {});
                        }
                      }
                    }}
                  />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ══════════════════════════ Calendar View ══════════════════════════

function CalendarView({
  records,
  settings,
  monthYear,
  onExcuseAbsence,
  onExcuseShortfall,
}: {
  records: ProcessedAttendanceRecord[];
  settings: PayslipSettings;
  monthYear: string;
  onExcuseAbsence?: (id: string) => void;
  onExcuseShortfall?: (id: string) => void;
}) {
  const { settings: appSettings } = useAppSettings();
  const displayMonth = (m: string) => formatMonthYear(m, appSettings.monthFormat);
  const [y, m] = monthYear.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const firstDayIdx = new Date(y, m - 1, 1).getDay(); // 0=Sun

  const recordMap: Record<string, ProcessedAttendanceRecord> = {};
  records.forEach((r) => { recordMap[r.date] = r; });

  const cells: Array<{ date: string; day: number; dayOfWeek: number } | null> = [];
  for (let i = 0; i < firstDayIdx; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dow = new Date(y, m - 1, d).getDay();
    cells.push({ date: dateStr, day: d, dayOfWeek: dow });
  }

  const dayHeaders = [
    { label: arabicSource("common.sunday_2"), dow: 0 },
    { label: arabicSource("common.monday"), dow: 1 },
    { label: arabicSource("common.tuesday"), dow: 2 },
    { label: arabicSource("common.wednesday"), dow: 3 },
    { label: arabicSource("common.thursday"), dow: 4 },
    { label: arabicSource("common.friday"), dow: 5 },
    { label: arabicSource("common.saturday"), dow: 6 },
  ];

  // Derive rest days from processed records (each record knows isScheduledWorkingDay)
  const restDowSet = useMemo(() => {
    const dowCounts: Record<number, { working: number; rest: number }> = {};
    for (const rec of records) {
      const d = new Date(rec.date + "T00:00:00Z");
      const dow = d.getUTCDay();
      if (!dowCounts[dow]) dowCounts[dow] = { working: 0, rest: 0 };
      if (rec.isScheduledWorkingDay) dowCounts[dow].working++;
      else dowCounts[dow].rest++;
    }
    const set = new Set<number>();
    for (const [dow, c] of Object.entries(dowCounts)) {
      if (c.rest > c.working) set.add(Number(dow));
    }
    return set;
  }, [records]);
  const isRestDay = (dow: number) => restDowSet.has(dow);
  const isFutureDate = (dateStr: string) => dateStr > new Date().toISOString().slice(0, 10);

  // Compute week row indices for alternating backgrounds
  const weekRows: number[][] = [];
  for (let i = 0; i < cells.length; i += 7) weekRows.push(cells.slice(i, i + 7).map((_, j) => i + j));

  return (
    <div className="bg-card border border-border/30 rounded-xl overflow-hidden shadow-lg">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border/30">
        <CalendarDays className="w-5 h-5 text-primary" />
        <h3 className="text-foreground text-lg">{arabicSource("payroll.calendar")} {displayMonth(monthYear)}</h3>
      </div>

      {/* Day headers — bold band */}
      <div className="grid grid-cols-7 border-b border-border/30 bg-muted/15">
        {dayHeaders.map((d) => (
          <div
            key={d.label}
            className={`text-center py-3 font-semibold ${restDowSet.has(d.dow) ? "text-muted-foreground/50 bg-muted/10" : "text-foreground/60"}`}
            style={{ fontSize: 13 }}
          >
            {d.label}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          // Alternating week backgrounds
          const weekIdx = Math.floor(i / 7);
          const weekBg = weekIdx % 2 === 1 ? "bg-muted/[0.03]" : "";

          if (!cell) return <div key={`empty-${i}`} className={`min-h-[68px] border-b border-e border-border/20 ${weekBg}`} />;

          const rec = recordMap[cell.date];
          const today = new Date().toISOString().slice(0, 10) === cell.date;
          const isRest = isRestDay(cell.dayOfWeek);
          const isFuture = isFutureDate(cell.date);
          const isLeave = rec?.status === "leave";
          const isAbsent = rec?.status === "absent" || rec?.status === "absent_due_to_late_threshold";
          const hasShortfall = rec && !isAbsent && !isLeave && rec.workingHours < settings.targetWorkingHoursPerDay && rec.isScheduledWorkingDay;
          const hasOvertime = rec && rec.overtimeHours > 0;
          const hasData = rec && !isAbsent && !isLeave && rec.checkInTime;

          // Cell background
          let cellBg = weekBg;
          if (isLeave && !rec?.isUnpaidLeave) cellBg = "bg-blue-500/6";
          else if (isLeave && rec?.isUnpaidLeave) cellBg = "bg-orange-500/6";
          else if (isAbsent && !rec?.excusedAbsence) cellBg = "bg-destructive/6";
          else if (isAbsent && rec?.excusedAbsence) cellBg = "bg-emerald-500/6";
          else if (hasShortfall && !rec?.excusedShortfall) cellBg = "bg-amber-500/6";
          else if (hasShortfall && rec?.excusedShortfall) cellBg = "bg-emerald-500/6";
          else if (hasOvertime) cellBg = "bg-emerald-500/4";
          else if (isRest && !rec) cellBg += " bg-muted/5";

          // Dynamic height: data cells are taller, empty/rest cells shorter
          const cellHeight = hasData || isLeave ? "min-h-[100px]" : isAbsent ? "min-h-[80px]" : "min-h-[68px]";

          return (
            <div
              key={cell.date}
              className={`${cellHeight} border-b border-e border-border/20 p-2 flex flex-col transition-all duration-200 ${cellBg} ${today ? "ring-2 ring-inset ring-primary/40" : ""} ${isRest && !rec ? "bg-[repeating-linear-gradient(135deg,transparent,transparent_4px,rgba(128,128,128,0.03)_4px,rgba(128,128,128,0.03)_8px)]" : ""}`}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(212, 175, 55, 0.06)"; e.currentTarget.style.boxShadow = "inset 0 0 0 1px rgba(212, 175, 55, 0.12)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ""; e.currentTarget.style.boxShadow = ""; }}
            >
              {/* Row 1: Day number + status icon */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`w-6 h-6 flex items-center justify-center rounded-full ${
                    today ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                    : isRest && !rec ? "text-muted-foreground/30"
                    : "text-foreground/70"
                  }`}
                  style={{ fontSize: 12, fontWeight: today ? 700 : 500 }}
                >
                  {cell.day}
                </span>
                {isLeave && <TreePalm className="w-3.5 h-3.5 text-blue-400" />}
                {isAbsent && !rec?.excusedAbsence && <XCircle className="w-3.5 h-3.5 text-destructive" />}
                {isAbsent && rec?.excusedAbsence && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                {hasShortfall && !rec?.excusedShortfall && <TriangleAlert className="w-3.5 h-3.5 text-amber-400" />}
                {hasShortfall && rec?.excusedShortfall && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                {hasOvertime && <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />}
              </div>

              {/* Leave */}
              {isLeave && (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div style={{ fontSize: 10 }} className={rec.isUnpaidLeave ? "text-orange-400" : "text-blue-400"}>{rec.leaveType}</div>
                  {rec.isUnpaidLeave && <div style={{ fontSize: 9 }} className="text-destructive mt-0.5">{arabicSource("common.discounted")}</div>}
                </div>
              )}

              {/* Normal attendance — times + hours hero */}
              {hasData && (
                <div className="flex-1 flex flex-col items-center text-center">
                  {/* Times — stacked, no dots */}
                  <div className="space-y-0.5">
                    <div className="text-emerald-500 font-mono" style={{ fontSize: 11 }} dir="ltr">{rec.formattedCheckIn}</div>
                    <div className="text-blue-500 font-mono" style={{ fontSize: 11 }} dir="ltr">{rec.formattedCheckOut || "—"}</div>
                  </div>
                  {/* Hours — hero element at bottom */}
                  <div className="mt-auto pt-1.5">
                    <span className="text-foreground font-mono font-semibold" style={{ fontSize: 12 }}>
                      {rec.workingHours.toFixed(1)}h
                    </span>
                    {hasOvertime && (
                      <span className="text-emerald-500 font-mono ms-1" style={{ fontSize: 10 }}>+{rec.overtimeHours.toFixed(1)}h</span>
                    )}
                    {hasShortfall && (
                      <span className="text-amber-500 font-mono ms-1" style={{ fontSize: 10 }}>
                        -{(settings.targetWorkingHoursPerDay - rec.workingHours).toFixed(1)}h
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Absent */}
              {isAbsent && (
                <div className="flex-1 flex flex-col items-center justify-center gap-0.5">
                  <span className="text-destructive font-medium" style={{ fontSize: 11 }}>{arabicSource("common.absence_2")}</span>
                  {rec?.excusedAbsence && <span className="text-emerald-400" style={{ fontSize: 9 }}>{arabicSource("payroll.sorry")}</span>}
                </div>
              )}

              {/* Rest day */}
              {!rec && isRest && (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <span className="text-muted-foreground/25" style={{ fontSize: 10 }}>{arabicSource("common.leave")}</span>
                </div>
              )}

              {/* Past work day with no record */}
              {!rec && !isRest && !isFuture && (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <span className="text-muted-foreground/15" style={{ fontSize: 14 }}>—</span>
                </div>
              )}

              {/* Excuse buttons */}
              {isAbsent && !isLeave && onExcuseAbsence && (
                <button
                  onClick={() => onExcuseAbsence(rec.id)}
                  className={`mt-1 px-2 py-0.5 rounded text-center border transition-colors cursor-pointer ${
                    rec?.excusedAbsence
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "border-border/30 text-muted-foreground hover:border-emerald-500/40 hover:text-emerald-400"
                  }`}
                  style={{ fontSize: 9 }}
                >
                  {rec?.excusedAbsence ? arabicSource("common.sorry") : arabicSource("common.excuse")}
                </button>
              )}
              {hasShortfall && onExcuseShortfall && (
                <button
                  onClick={() => onExcuseShortfall(rec.id)}
                  className={`mt-1 px-2 py-0.5 rounded text-center border transition-colors cursor-pointer ${
                    rec?.excusedShortfall
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "border-border/30 text-muted-foreground hover:border-amber-500/40 hover:text-amber-400"
                  }`}
                  style={{ fontSize: 9 }}
                >
                  {rec?.excusedShortfall ? arabicSource("common.sorry") : arabicSource("common.excuse")}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend — prominent bar */}
      <div className="flex flex-wrap items-center justify-center gap-5 px-5 py-3.5 border-t border-border/30 bg-muted/10">
        {[
          { label: arabicSource("common.present"), dot: "bg-emerald-500" },
          { label: arabicSource("payroll.shortage_of_hours_2"), dot: "bg-amber-400" },
          { label: arabicSource("common.absence_2"), dot: "bg-destructive" },
          { label: arabicSource("payroll.overtime_2"), dot: "bg-emerald-400" },
          { label: arabicSource("payroll.excuse_me"), dot: "bg-emerald-400" },
          { label: arabicSource("common.leave"), dot: "bg-blue-400" },
          { label: arabicSource("common.without_salary"), dot: "bg-orange-400" },
          { label: arabicSource("common.a_day_of_rest"), dot: "bg-muted-foreground/30" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${l.dot}`} />
            <span className="text-muted-foreground" style={{ fontSize: 12 }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════ Shortfall Popover ══════════════════════════

function ShortfallPopover({
  records,
  targetHours,
  onClose,
  onExcuse,
}: {
  records: ProcessedAttendanceRecord[];
  targetHours: number;
  onClose: () => void;
  onExcuse: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <ArrowDownRight className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-foreground">{arabicSource("payroll.details_of_the_watch_shortage")}</h3>
              <p className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("payroll.days_when_working_hours_are_less_than")} {targetHours} {arabicSource("payroll.hours")}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary cursor-pointer">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/10 border-b border-border/20">
                {[arabicSource("common.date"), arabicSource("common.today"), arabicSource("common.attendance"), arabicSource("common.dismissal"), arabicSource("common.working_hours"), arabicSource("common.shortage"), arabicSource("common.status")].map((h) => (
                  <th key={h} className="text-start px-4 py-2.5 text-muted-foreground whitespace-nowrap" style={{ fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => {
                const shortage = targetHours - rec.workingHours;
                return (
                  <tr key={rec.id} className={`border-b border-border/10 ${rec.excusedShortfall ? "bg-emerald-500/5" : ""}`}>
                    <td className="px-4 py-2.5 text-foreground whitespace-nowrap" style={{ fontSize: 12 }}>{rec.date}</td>
                    <td className="px-4 py-2.5 text-muted-foreground" style={{ fontSize: 12 }}>{dayNamesAr[rec.dayOfWeek] || rec.dayOfWeek}</td>
                    <td className="px-4 py-2.5 text-foreground" style={{ fontSize: 12 }} dir="ltr">{rec.formattedCheckIn || "—"}</td>
                    <td className="px-4 py-2.5 text-foreground" style={{ fontSize: 12 }} dir="ltr">{rec.formattedCheckOut || "—"}</td>
                    <td className="px-4 py-2.5 text-foreground" style={{ fontSize: 12 }}>{rec.workingHours.toFixed(2)}h</td>
                    <td className="px-4 py-2.5 text-amber-400" style={{ fontSize: 12 }}>{shortage.toFixed(2)}h</td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => onExcuse(rec.id)}
                        className={`px-2.5 py-1 rounded-md border cursor-pointer transition-colors ${
                          rec.excusedShortfall
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : "bg-muted/10 border-border text-muted-foreground hover:border-primary/30"
                        }`}
                        style={{ fontSize: 11 }}
                      >
                        {rec.excusedShortfall ? arabicSource("common.sorry") : arabicSource("common.excuse")}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-border/30 flex items-center justify-between">
          <span className="text-muted-foreground" style={{ fontSize: 12 }}>
            {arabicSource("payroll.total_deficiency")} <span className="text-amber-400">{formatHoursMinutes(records.reduce((s, r) => s + Math.max(0, targetHours - r.workingHours), 0))}</span>
          </span>
          <span className="text-muted-foreground" style={{ fontSize: 12 }}>
            {arabicSource("common.excused")} {records.filter((r) => r.excusedShortfall).length} / {records.length}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ══════════════════════════ Absence Popover ══════════════════════════

function AbsencePopover({
  records,
  onClose,
  onExcuse,
}: {
  records: ProcessedAttendanceRecord[];
  onClose: () => void;
  onExcuse: (id: string) => void;
}) {
  const reasonLabels: Record<string, string> = {
    no_punches: arabicSource("payroll.no_fingerprint"),
    late_threshold: arabicSource("payroll.excessive_delay"),
    checkout_without_checkin: arabicSource("payroll.leaving_without_attending"),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <XCircle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h3 className="text-foreground">{arabicSource("payroll.absence_details")}</h3>
              <p className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("payroll.days_of_absence_during_the_month")}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary cursor-pointer">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {records.map((rec) => (
            <div
              key={rec.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                rec.excusedAbsence
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : "bg-destructive/5 border-destructive/15"
              }`}
            >
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-foreground" style={{ fontSize: 13 }}>{rec.date}</p>
                  <p className="text-muted-foreground" style={{ fontSize: 11 }}>
                    {dayNamesAr[rec.dayOfWeek] || rec.dayOfWeek} — {reasonLabels[rec.absenceReason || ""] || arabicSource("common.absence_2")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onExcuse(rec.id)}
                className={`px-3 py-1.5 rounded-md border cursor-pointer transition-colors ${
                  rec.excusedAbsence
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-muted/10 border-border text-muted-foreground hover:border-primary/30"
                }`}
                style={{ fontSize: 11 }}
              >
                {rec.excusedAbsence ? arabicSource("common.sorry") : arabicSource("common.excuse")}
              </button>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-t border-border/30 flex items-center justify-between">
          <span className="text-destructive" style={{ fontSize: 12 }}>
            {arabicSource("payroll.total")} {records.length} {arabicSource("common.days_2")}
          </span>
          <span className="text-emerald-400" style={{ fontSize: 12 }}>
            {arabicSource("common.excused")} {records.filter((r) => r.excusedAbsence).length}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
