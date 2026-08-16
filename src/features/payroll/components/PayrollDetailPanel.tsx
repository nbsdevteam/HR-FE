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
import { dayNamesAr, payrollCardClass as cardCls, payrollInputClass as inputCls, payrollSelectClass as selectCls } from "../styles";
import { formatIQD } from "../utils/payrollFormat";
import { AbsencePopover } from "./AbsencePopover";
import { CalendarView } from "./CalendarView";
import { ShortfallPopover } from "./ShortfallPopover";

export const PayrollDetailPanel = function PayrollDetailPanel({
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
