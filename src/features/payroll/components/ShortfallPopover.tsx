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

export const ShortfallPopover = function ShortfallPopover({
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
