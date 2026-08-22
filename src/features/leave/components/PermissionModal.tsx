import { useState, useMemo } from "react";
import { AlertCircle, Loader2, Send, Timer } from "lucide-react";
import { EmployeeSelect } from "@/features/employees";
import { InputField, ModalHeader, ModalOverlay } from "@/shared/components";
import * as odooData from "@/shared/api/odooData";
import { empDisplayName } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { leaveInputClass as inputCls } from "../styles";

const PermissionModal = ({
  employees, onClose, onSubmit,
}: {
  employees: any[];
  onClose: () => void;
  onSubmit: () => Promise<void>;
}) => {
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const hours = useMemo(() => {
    if (!startTime || !endTime) return 0;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    return Math.max(0, Math.round(((eh * 60 + em) - (sh * 60 + sm)) / 60 * 100) / 100);
  }, [startTime, endTime]);

  const handleSubmit = async () => {
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
  };

  return (
    <ModalOverlay
      onClose={onClose}
      contentClassName="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-lg"
    >
        <ModalHeader title={arabicSource("leave.new_permission_request")} onClose={onClose} />

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive" style={{ fontSize: 13 }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Employee */}
          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("common.employee_3")}</label>
            <EmployeeSelect
              employees={employees}
              labels={Object.fromEntries(employees.map((e) => [String(e.id), empDisplayName(e)]))}
              value={employeeId}
              onChange={(id) => setEmployeeId(String(id))}
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
              value={reason} onChange={e => setReason(e.target.value)}
              rows={2} placeholder={arabicSource("leave.the_reason_for_asking_permission")}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground hover:bg-gold-dark transition-colors shadow-lg shadow-primary/20 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {arabicSource("leave.send")}
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

export default PermissionModal;
