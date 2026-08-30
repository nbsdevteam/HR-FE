import { useState, useCallback } from "react";
import { Gift } from "lucide-react";
import { InputField, ModalHeader, ModalOverlay } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import * as odooData from "@/shared/api/odooData";
import type { DbLeaveType } from "@/shared/hooks";
import { leaveInputClass as inputCls } from "../styles";
import { leaveErrorMessage } from "../utils/leaveErrorMessage";
import LeaveFormError from "./LeaveFormError";
import LeaveModalActions from "./LeaveModalActions";
import LeaveTypeChipButton from "./LeaveTypeChipButton";

type AdditionalLeaveGrantModalProps = {
  employeeId: string;
  leaveTypes: DbLeaveType[];
  onClose: () => void;
  onCreated: () => Promise<void>;
};

/** HR/Admin "Grant additional leave" form (backend v1.17.0 §3, §4). */
const AdditionalLeaveGrantModal = ({
  employeeId,
  leaveTypes,
  onClose,
  onCreated,
}: AdditionalLeaveGrantModalProps) => {
  const [leaveTypeId, setLeaveTypeId] = useState(leaveTypes[0]?.id ?? "");
  const [additionalDays, setAdditionalDays] = useState("");
  const [reason, setReason] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSelectLeaveType = useCallback((leaveType: DbLeaveType): void => {
    setLeaveTypeId(leaveType.id);
  }, []);

  const handleReasonChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setReason(e.target.value);
  }, []);

  const handleSubmit = useCallback(async (): Promise<void> => {
    const days = Number(additionalDays);
    if (!leaveTypeId || !reason.trim()) {
      setError(arabicSource("common.please_fill_out_all_required_fields"));
      return;
    }
    if (!(days > 0)) {
      setError(arabicSource("leave.error_invalid_additional_days"));
      return;
    }
    setSaving(true);
    setError("");

    try {
      await odooData.createLeaveEntitlementAdjustment({
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        additional_days: days,
        reason: reason.trim(),
        effective_date: effectiveDate || undefined,
      });
      setSaving(false);
      await onCreated();
    } catch (e: unknown) {
      setError(leaveErrorMessage(e, arabicSource("leave.error_grant_additional_leave_failed")));
      setSaving(false);
    }
  }, [additionalDays, effectiveDate, employeeId, leaveTypeId, onCreated, reason]);

  return (
    <ModalOverlay
      onClose={onClose}
      contentClassName="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-lg"
    >
      <ModalHeader title={arabicSource("leave.grant_additional_leave")} icon={Gift} onClose={onClose} />

      <LeaveFormError message={error} />

      <div className="space-y-4">
        <div>
          <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>
            {arabicSource("leave.leave_type_2")}
          </label>
          <div className="flex flex-wrap gap-2">
            {leaveTypes.map((leaveType) => (
              <LeaveTypeChipButton
                key={leaveType.id}
                leaveType={leaveType}
                isSelected={leaveTypeId === leaveType.id}
                onSelect={handleSelectLeaveType}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>
            {arabicSource("leave.additional_days_label")}
          </label>
          <InputField
            type="number"
            value={additionalDays}
            onChange={setAdditionalDays}
            className={inputCls}
            min={0}
            step="0.25"
            dir="ltr"
          />
        </div>

        <div>
          <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>
            {arabicSource("leave.effective_date")}
          </label>
          <InputField type="date" value={effectiveDate} onChange={setEffectiveDate} className={inputCls} dir="ltr" />
        </div>

        <div>
          <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>
            {arabicSource("leave.grant_reason_label")}
          </label>
          <textarea
            value={reason}
            onChange={handleReasonChange}
            rows={2}
            placeholder={arabicSource("leave.grant_reason_placeholder")}
            className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none resize-none"
          />
        </div>

        <LeaveModalActions
          submitLabel={arabicSource("leave.grant_additional_leave")}
          saving={saving}
          onSubmit={handleSubmit}
          onClose={onClose}
        />
      </div>
    </ModalOverlay>
  );
};

export default AdditionalLeaveGrantModal;
