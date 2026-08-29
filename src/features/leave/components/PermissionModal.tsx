import { useState, useMemo, useCallback } from "react";
import { Timer } from "lucide-react";
import {
  getEmployeeDescription,
  getEmployeeId,
  getEmployeeSearchText,
} from "@/shared/utils/employeeTypeAhead";
import { InputField, ModalHeader, ModalOverlay, TypeAhead } from "@/shared/components";
import * as odooData from "@/shared/api/odooData";
import { arabicSource } from "@/i18n/source";
import { localizedEmployeeName, useIsArabicLanguage } from "@/i18n/useLocalizedName";
import { leaveInputClass as inputCls } from "../styles";
import LeaveFormError from "./LeaveFormError";
import LeaveModalActions from "./LeaveModalActions";

type PermissionModalProps = {
  employees: any[];
  onClose: () => void;
  onSubmit: () => Promise<void>;
};

const PermissionModal = ({ employees, onClose, onSubmit }: PermissionModalProps) => {
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isArabic = useIsArabicLanguage();

  const hours = useMemo(() => {
    if (!startTime || !endTime) return 0;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    return Math.max(0, Math.round(((eh * 60 + em) - (sh * 60 + sm)) / 60 * 100) / 100);
  }, [startTime, endTime]);

  const employeeFallbackLabels = useMemo(
    () => Object.fromEntries(
      employees.map((e) => [String(e.id), localizedEmployeeName(e, isArabic)]),
    ),
    [employees, isArabic],
  );

  const getEmployeeLabel = useCallback(
    (employee: any): string => localizedEmployeeName(employee, isArabic),
    [isArabic],
  );

  const handleEmployeeChange = useCallback((id: string): void => {
    setEmployeeId(String(id));
  }, []);

  const handleReasonChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setReason(e.target.value);
  }, []);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!employeeId || !date || !startTime || !endTime) {
      setError(arabicSource("common.please_fill_out_all_required_fields"));
      return;
    }
    setSaving(true);
    setError("");

    try {
      await odooData.createLeavePermission({
        employee_id: employeeId,
        date,
        start_time: startTime,
        end_time: endTime,
        hours,
        reason: reason || null,
      });
      setSaving(false);
      await onSubmit();
    } catch (e: any) {
      setError(e?.message || "فشل إنشاء الإذن");
      setSaving(false);
    }
  }, [date, employeeId, endTime, hours, onSubmit, reason, startTime]);

  return (
    <ModalOverlay
      onClose={onClose}
      contentClassName="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-lg"
    >
        <ModalHeader title={arabicSource("leave.new_permission_request")} onClose={onClose} />

        <LeaveFormError message={error} />

        <div className="space-y-4">
          {/* Employee */}
          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("common.employee_3")}</label>
            <TypeAhead
              items={employees}
              getId={getEmployeeId}
              getLabel={getEmployeeLabel}
              getDescription={getEmployeeDescription}
              getSearchText={getEmployeeSearchText}
              fallbackLabels={employeeFallbackLabels}
              value={employeeId}
              onChange={handleEmployeeChange}
              optionsAreData
            />
          </div>

          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("common.date_2")}</label>
            <InputField type="date" value={date} onChange={setDate} className={inputCls} dir="ltr" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("leave.of_the_hour")}</label>
              <InputField type="time" value={startTime} onChange={setStartTime} className={inputCls} dir="ltr" />
            </div>
            <div>
              <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("leave.to_the_hour")}</label>
              <InputField type="time" value={endTime} onChange={setEndTime} className={inputCls} dir="ltr" />
            </div>
          </div>

          {hours > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
              <Timer className="w-4 h-4 text-primary" />
              <span className="text-primary" style={{ fontSize: 13 }}>{arabicSource("common.duration_2")} {hours} {arabicSource("common.hours")}</span>
            </div>
          )}

          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("common.the_reason")}</label>
            <textarea
              value={reason} onChange={handleReasonChange}
              rows={2} placeholder={arabicSource("leave.the_reason_for_asking_permission")}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none resize-none"
            />
          </div>

          <LeaveModalActions
            submitLabel={arabicSource("leave.send")}
            saving={saving}
            onSubmit={handleSubmit}
            onClose={onClose}
          />
        </div>
    </ModalOverlay>
  );
};

export default PermissionModal;
