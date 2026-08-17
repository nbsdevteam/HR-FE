import { useCallback, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { arabicSource } from "@/i18n/source";
import { typeLabelToKey } from "../utils/warningKeyMapping";
import type { FormData, WarningWithEmployee } from "../types";

const EMPTY_FORM: FormData = {
  employeeId: "",
  type: "",
  reason: "",
  details: "",
  expiryDate: "",
};

type UseWarningFormArgs = {
  warningTypes: string[];
  refetch: () => void;
  setToast: (message: string | null) => void;
};

export const useWarningForm = ({ warningTypes, refetch, setToast }: UseWarningFormArgs) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setFormData({ ...EMPTY_FORM });
    setEditingId(null);
  }, []);

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

  const handleEditWarning = useCallback((warning: WarningWithEmployee) => {
    setEditingId(warning.id);
    setFormData({
      employeeId: warning.employee_id,
      type: warning.type,
      reason: warning.reason,
      details: warning.details || "",
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
      if (editingId) {
        await odooData.updateWarning(editingId, {
          employee_id: formData.employeeId,
          type: typeLabelToKey(formData.type, warningTypes),
          reason: formData.reason,
          details: formData.details || null,
          expiry_date: formData.expiryDate || null,
        });
        setToast(arabicSource("warnings.alarm_updated_successfully"));
      } else {
        await odooData.createWarning({
          employee_id: formData.employeeId,
          type: typeLabelToKey(formData.type, warningTypes),
          reason: formData.reason,
          details: formData.details || null,
          date: new Date().toISOString().split("T")[0],
          expiry_date: formData.expiryDate || null,
        });
        setToast(arabicSource("warnings.alarm_issued_successfully"));
      }

      resetForm();
      setShowForm(false);
      refetch();
    } catch (err) {
      setToast(`${arabicSource("common.error_2")} ${err instanceof Error ? err.message : arabicSource("warnings.the_operation_failed")}`);
    } finally {
      setSaving(false);
    }
  }, [editingId, formData, refetch, resetForm, setToast, warningTypes]);

  return {
    showForm, openNewForm, closeForm,
    formData, updateFormField,
    saving, editingId,
    handleCreateWarning, handleEditWarning,
  };
};
