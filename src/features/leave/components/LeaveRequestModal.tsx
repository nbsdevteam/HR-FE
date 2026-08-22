import { useState, useEffect, useMemo, useCallback } from "react";
import { AlertCircle, CalendarDays, FileText, Loader2, Send } from "lucide-react";
import { EmployeeSelect } from "@/features/employees";
import { ModalHeader, ModalOverlay } from "@/shared/components";
import * as odooData from "@/shared/api/odooData";
import {
  empDisplayName,
  type DbLeaveType, type DbLeaveBalance,
} from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { leaveInputClass as inputCls } from "../styles";
import LeaveTypeChipButton from "./LeaveTypeChipButton";
import HalfDayPeriodButton from "./HalfDayPeriodButton";

const HALF_DAY_PERIODS = [
  ["morning", arabicSource("leave.morning")],
  ["afternoon", arabicSource("leave.evening")],
] as const;

const LeaveRequestModal = ({
  employees, leaveTypes, balances, selfOnly, linkError, employeesLoading,
  onClose, onSubmit,
}: {
  employees: any[];
  leaveTypes: DbLeaveType[];
  balances: DbLeaveBalance[];
  selfOnly: boolean;
  linkError: string | null;
  employeesLoading: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
}) => {
  const selfEmployee = selfOnly ? employees[0] || null : null;
  const selfEmployeeId = selfEmployee ? String(selfEmployee.id) : "";
  const [employeeId, setEmployeeId] = useState(selfEmployeeId);
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayPeriod, setHalfDayPeriod] = useState<"morning" | "afternoon">("morning");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedType = leaveTypes.find(t => t.id === leaveTypeId);

  // Calculate working days (excluding Friday & Saturday — Iraqi weekend)
  const days = useMemo(() => {
    if (isHalfDay) return 0.5;
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return 0;
    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const dow = cur.getDay(); // 0=Sun, 5=Fri, 6=Sat
      if (dow !== 5 && dow !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }, [startDate, endDate, isHalfDay]);

  // Remaining balance for selected employee+type
  const remainingBalance = useMemo(() => {
    if (!employeeId || !leaveTypeId) return null;
    const lt = leaveTypes.find(t => t.id === leaveTypeId);
    if (!lt) return null;
    const bal = balances.find(b => b.employee_id === employeeId && (b.leave_type_id === leaveTypeId || b.leave_type === lt.name_ar));
    if (!bal) {
      // No balance record — if the leave type normally allocates days, treat as 0 remaining
      // (unpaid leave with default_days_per_year=30 still needs a balance record to track usage)
      return (lt as any).default_days_per_year > 0 ? 0 : null;
    }
    return bal.total_days + bal.carryover_days + bal.accrued_days - bal.used_days;
  }, [employeeId, leaveTypeId, balances, leaveTypes]);

  const handleSelectLeaveType = useCallback((lt: DbLeaveType) => {
    setLeaveTypeId(lt.id);
    if (!lt.allow_half_day) setIsHalfDay(false);
  }, []);

  useEffect(() => {
    if (selfOnly && selfEmployeeId) {
      setEmployeeId(selfEmployeeId);
    }
  }, [selfOnly, selfEmployeeId]);

  const handleSubmit = async () => {
    if (selfOnly && (linkError || !selfEmployee)) {
      setError(linkError || "Your user account is not linked to an employee. Please contact HR.");
      return;
    }
    if ((!selfOnly && !employeeId) || !leaveTypeId || !startDate) {
      setError(arabicSource("common.please_fill_out_all_required_fields"));
      return;
    }
    const lt = leaveTypes.find(t => t.id === leaveTypeId);
    if (!lt) return;

    // Validate balance
    if (remainingBalance !== null && days > remainingBalance) {
      setError(`${arabicSource("leave.remaining_balance")}${remainingBalance} ${arabicSource("leave.day_is_not_enough_for_the_required_number_of_days")}${days} ${arabicSource("common.days_3")}`);
      return;
    }

    setSaving(true);
    setError("");

    try {
      // Self-only: omit employee_id so backend uses current_employee().
      // List + manage_types: pass selected employee (existing HR behavior).
      // List without manage_types: still pass selection for UI consistency; backend
      // ignores employee_id unless manage_types (unchanged permission model).
      const payload: Parameters<typeof odooData.requestLeave>[0] = {
        leave_type_id: lt.id,
        date_from: startDate,
        date_to: isHalfDay ? startDate : (endDate || startDate),
        reason: reason || null,
        half_day: isHalfDay,
        ...odooData.leaveRequestEmployeeIdField(selfOnly, employeeId),
      };
      await odooData.requestLeave(payload);
      setSaving(false);
      await onSubmit();
    } catch (e: any) {
      setError(e?.message || "فشل إنشاء طلب الإجازة");
      setSaving(false);
    }
  };

  return (
    <ModalOverlay
      onClose={onClose}
      contentClassName="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-lg max-h-[90vh] overflow-y-auto"
    >
        <ModalHeader title={arabicSource("leave.new_leave_request")} onClose={onClose} />

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive" style={{ fontSize: 13 }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Employee Selection */}
          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("common.employee_3")}</label>
            {selfOnly ? (
              employeesLoading ? (
                <div className={`${inputCls} flex items-center text-muted-foreground`} style={{ fontSize: 13 }}>
                  <Loader2 className="w-4 h-4 animate-spin me-2" />
                </div>
              ) : linkError || !selfEmployee ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive" style={{ fontSize: 13 }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {linkError || "Your user account is not linked to an employee. Please contact HR."}
                </div>
              ) : (
                <input
                  type="text"
                  readOnly
                  disabled
                  value={empDisplayName(selfEmployee)}
                  className={`${inputCls} opacity-80 cursor-not-allowed`}
                  style={{ fontSize: 13 }}
                  dir="auto"
                  aria-label="My employee"
                />
              )
            ) : (
              <EmployeeSelect
                employees={employees}
                labels={Object.fromEntries(employees.map((e) => [String(e.id), empDisplayName(e)]))}
                value={employeeId}
                onChange={(id) => setEmployeeId(String(id))}
              />
            )}
          </div>

          {/* Leave Type */}
          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("leave.leave_type_2")}</label>
            <div className="flex flex-wrap gap-2">
              {leaveTypes.map(t => (
                <LeaveTypeChipButton
                  key={t.id}
                  leaveType={t}
                  isSelected={leaveTypeId === t.id}
                  onSelect={handleSelectLeaveType}
                />
              ))}
            </div>
          </div>

          {/* Half Day Toggle */}
          {selectedType?.allow_half_day && (
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox" checked={isHalfDay} onChange={e => setIsHalfDay(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-foreground" style={{ fontSize: 13 }}>{arabicSource("common.half_a_day")}</span>
              </label>
              {isHalfDay && (
                <div className="flex gap-2">
                  {HALF_DAY_PERIODS.map(([val, label]) => (
                    <HalfDayPeriodButton
                      key={val}
                      value={val}
                      label={label}
                      isSelected={halfDayPeriod === val}
                      onSelect={setHalfDayPeriod}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>
                {isHalfDay ? arabicSource("common.date") : arabicSource("common.from_date")} *
              </label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} dir="ltr" />
            </div>
            {!isHalfDay && (
              <div>
                <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("leave.to_date")}</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} dir="ltr" min={startDate} />
              </div>
            )}
          </div>

          {days > 0 && (
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                <span className="text-primary" style={{ fontSize: 13 }}>{arabicSource("common.duration_2")} {days} {isHalfDay ? arabicSource("common.half_a_day") : arabicSource("common.days_2")}</span>
              </div>
              {remainingBalance !== null && (
                <span className={`${days > remainingBalance ? "text-destructive" : "text-emerald-400"}`} style={{ fontSize: 12 }}>
                  {arabicSource("leave.remaining_balance_2")} {remainingBalance} {arabicSource("common.days_2")}
                </span>
              )}
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("common.the_reason")}</label>
            <textarea
              value={reason} onChange={e => setReason(e.target.value)}
              rows={2} placeholder={arabicSource("leave.reason_for_leave")}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none resize-none"
            />
          </div>

          {/* Attachment notice */}
          {selectedType?.requires_attachment && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400" style={{ fontSize: 12 }}>
              <FileText className="w-4 h-4" />
              {arabicSource("leave.this_type_of_leave_requires_an_attachment_medical_report_etc")}
              {selectedType.attachment_after_days && ` ${arabicSource("leave.after")} ${selectedType.attachment_after_days} ${arabicSource("common.days")}`}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={saving || employeesLoading || (selfOnly && (!!linkError || !selfEmployee))}
              className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground hover:bg-gold-dark transition-colors shadow-lg shadow-primary/20 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {arabicSource("leave.send_request")}
            </button>
            <button
              onClick={onClose}
              className="flex-1 h-11 rounded-lg border-2 border-border text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              {arabicSource("common.cancel")}
            </button>
          </div>
        </div>
    </ModalOverlay>
  );
};

export default LeaveRequestModal;

