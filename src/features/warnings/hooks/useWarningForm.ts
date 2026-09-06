import { useCallback, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { arabicSource } from "@/i18n/source";
import { useOdooMutation } from "@/shared/hooks";
import type { DbWarning, DbWarningAttachmentSettings } from "@/shared/hooks";
import { WARNING_EXPIRY_CUSTOM } from "../constants/warnings";
import { typeLabelToKey } from "../utils/warningKeyMapping";
import { warningErrorMessage } from "../utils/warningErrorMessage";
import { useWarningAttachmentPicker } from "./useWarningAttachmentPicker";
import type { FormData, WarningWithEmployee } from "../types";

const EMPTY_FORM: FormData = {
  employeeId: "",
  type: "",
  reason: "",
  details: "",
  durationMonths: "",
  expiryDate: "",
};

type UseWarningFormArgs = {
  warningTypes: string[];
  attachmentSettings: DbWarningAttachmentSettings | null;
  // No longer called directly: the create/update mutations below invalidate
  // the "warnings" cache key themselves — kept in the type so existing
  // callers can keep passing it unchanged.
  refetch: () => void;
  setToast: (message: string | null) => void;
};

/**
 * Expiry travels as `duration_months` *or* `expiry_date`, never both: sending
 * an explicit date on update clears the stored month count (backend §3/§4).
 */
const expiryFields = (form: FormData): Record<string, unknown> => {
  if (form.durationMonths === WARNING_EXPIRY_CUSTOM) {
    return { expiry_date: form.expiryDate || null };
  }
  if (form.durationMonths) return { duration_months: Number(form.durationMonths) };
  return { expiry_date: null };
};

/** Confirm the term with the date the backend actually stored, never a local calculation. */
const savedMessage = (saved: DbWarning, baseKey: "warnings.alarm_issued_successfully" | "warnings.alarm_updated_successfully"): string => {
  const base = arabicSource(baseKey);
  if (!saved.expiry_date) return base;
  return `${base} — ${arabicSource("warnings.completion_date")} ${saved.expiry_date}`;
};

export const useWarningForm = ({ warningTypes, attachmentSettings, setToast }: UseWarningFormArgs) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const attachments = useWarningAttachmentPicker({ settings: attachmentSettings });
  const { buildAttachmentFields, reset: resetAttachments } = attachments;

  const updateWarningMutation = useOdooMutation<DbWarning, { id: string; payload: Record<string, unknown> }>(
    ({ id, payload }) => odooData.updateWarning(id, payload),
    "warnings",
  );
  const createWarningMutation = useOdooMutation<DbWarning, Record<string, unknown>>(
    (payload) => odooData.createWarning(payload),
    "warnings",
  );

  const resetForm = useCallback(() => {
    setFormData({ ...EMPTY_FORM });
    setEditingId(null);
    resetAttachments();
  }, [resetAttachments]);

  const updateFormField = useCallback((patch: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...patch }));
  }, []);

  const openNewForm = useCallback(() => {
    resetForm();
    setShowForm(true);
  }, [resetForm]);

  const closeForm = useCallback(() => {
    setShowForm(false);
    resetForm();
  }, [resetForm]);

  /** `duration_months` comes back on read so the edit form can pre-select the original term (backend §4). */
  const handleEditWarning = useCallback((warning: WarningWithEmployee) => {
    setEditingId(warning.id);
    setFormData({
      employeeId: warning.employee_id,
      type: warning.type,
      reason: warning.reason,
      details: warning.details || "",
      durationMonths: warning.duration_months
        ? String(warning.duration_months)
        : warning.expiry_date
          ? WARNING_EXPIRY_CUSTOM
          : "",
      expiryDate: warning.expiry_date || "",
    });
    setShowForm(true);
  }, []);

  const handleCreateWarning = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.type || !formData.reason) {
      setToast(arabicSource("warnings.please_fill_out_all_required_fields"));
      return;
    }

    setSaving(true);
    try {
      const base = {
        employee_id: formData.employeeId,
        type: typeLabelToKey(formData.type, warningTypes),
        reason: formData.reason,
        details: formData.details || null,
        ...expiryFields(formData),
      };

      if (editingId) {
        const saved = await updateWarningMutation.mutateAsync({ id: editingId, payload: base });
        setToast(savedMessage(saved, "warnings.alarm_updated_successfully"));
      } else {
        // Files ride along with the create call, so a rejected attachment
        // fails the whole request and leaves nothing to clean up (backend §5).
        const saved = await createWarningMutation.mutateAsync({
          ...base,
          date: new Date().toISOString().split("T")[0],
          ...(await buildAttachmentFields()),
        });
        setToast(savedMessage(saved, "warnings.alarm_issued_successfully"));
      }

      resetForm();
      setShowForm(false);
    } catch (err) {
      // The form stays open with the user's input intact on failure (backend §5).
      setToast(`${arabicSource("common.error_2")} ${warningErrorMessage(err, arabicSource("warnings.the_operation_failed"))}`);
    } finally {
      setSaving(false);
    }
  }, [buildAttachmentFields, createWarningMutation, editingId, formData, resetForm, setToast, updateWarningMutation, warningTypes]);

  return {
    showForm, openNewForm, closeForm,
    formData, updateFormField,
    saving, editingId,
    attachments,
    handleCreateWarning, handleEditWarning,
  };
};
