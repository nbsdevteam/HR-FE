import { useState, useCallback } from "react";
import * as odooData from "@/shared/api/odooData";
import { useOdooMutation } from "@/shared/hooks/useOdooMutation";
import { arabicSource } from "@/i18n/source";
import type { HrApiError } from "@/shared/api/client";
import type { DbPosition } from "@/shared/hooks";
import type { DesignationFormData, NameConflict } from "../types";
import { orgStructureErrorMessage } from "../utils/orgStructureErrorMessage";

const EMPTY_FORM: DesignationFormData = {
  name: "",
  title_ar: "",
  description: "",
  department_id: "",
  level: "0",
  reports_to_job_id: "",
  max_headcount: "0",
  active: true,
};

const designationToForm = (designation: DbPosition): DesignationFormData => ({
  name: designation.title_en || "",
  title_ar: designation.title_ar,
  description: designation.description || "",
  department_id: designation.department_id || "",
  level: String(designation.level),
  reports_to_job_id: designation.reports_to_position_id || "",
  max_headcount: String(designation.max_headcount),
  active: designation.is_active,
});

type UseDesignationFormArgs = {
  refetch: () => void | Promise<void>;
  setToast: (message: string | null) => void;
};

/**
 * Create/edit form state for the job-title admin screen (backend §4).
 *
 * `refetch` refreshes the admin screen's own (non-cached) filtered list,
 * which the shared `positions` cache invalidation below does not reach —
 * it still has to be called explicitly after each mutation.
 */
export const useDesignationForm = ({ refetch, setToast }: UseDesignationFormArgs) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<DesignationFormData>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<DbPosition | null>(null);
  const [nameConflict, setNameConflict] = useState<NameConflict | null>(null);

  const createDesignationMutation = useOdooMutation(
    (payload: Record<string, unknown>) => odooData.createDesignation(payload),
    "positions",
  );
  const updateDesignationMutation = useOdooMutation(
    ({ id, payload }: { id: string; payload: Record<string, unknown> }) => odooData.updateDesignation(id, payload),
    "positions",
  );
  const restoreDesignationMutation = useOdooMutation(
    (id: number) => odooData.restoreDesignation(id),
    "positions",
  );

  const resetForm = useCallback(() => {
    setFormData({ ...EMPTY_FORM });
    setEditingDesignation(null);
    setNameConflict(null);
  }, []);

  const updateField = useCallback((patch: Partial<DesignationFormData>) => {
    setFormData((prev) => ({ ...prev, ...patch }));
    setNameConflict(null);
  }, []);

  const openNewForm = useCallback(() => {
    resetForm();
    setShowForm(true);
  }, [resetForm]);

  const openEditForm = useCallback((designation: DbPosition) => {
    setEditingDesignation(designation);
    setFormData(designationToForm(designation));
    setNameConflict(null);
    setShowForm(true);
  }, []);

  const closeForm = useCallback(() => {
    setShowForm(false);
    resetForm();
  }, [resetForm]);

  const buildPayload = useCallback((): Record<string, unknown> => {
    return {
      name: formData.name.trim(),
      title_ar: formData.title_ar.trim() || undefined,
      description: formData.description.trim() || undefined,
      department_id: formData.department_id ? Number(formData.department_id) : null,
      level: Number(formData.level) || 0,
      reports_to_job_id: formData.reports_to_job_id ? Number(formData.reports_to_job_id) : null,
      max_headcount: Number(formData.max_headcount) || 0,
      ...(editingDesignation ? { active: formData.active } : {}),
    };
  }, [formData, editingDesignation]);

  const submit = useCallback(async () => {
    if (!formData.name.trim()) {
      setToast(arabicSource("org_structure.please_fill_required_fields"));
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      if (editingDesignation) {
        await updateDesignationMutation.mutateAsync({ id: editingDesignation.id, payload });
        setToast(arabicSource("org_structure.designation_update_success"));
      } else {
        await createDesignationMutation.mutateAsync(payload);
        setToast(arabicSource("org_structure.designation_create_success"));
      }
      closeForm();
      await refetch();
    } catch (err) {
      const code = (err as HrApiError | undefined)?.code;
      if (code === "name_exists") {
        const details = (err as HrApiError | undefined)?.details;
        setNameConflict({
          existingId: Number(details?.existing_job_id),
          existingActive: Boolean(details?.existing_active),
        });
      } else {
        setToast(`${arabicSource("common.error_2")} ${orgStructureErrorMessage(err, arabicSource("org_structure.the_operation_failed"))}`);
      }
    } finally {
      setSaving(false);
    }
  }, [formData, editingDesignation, buildPayload, closeForm, refetch, setToast, updateDesignationMutation.mutateAsync, createDesignationMutation.mutateAsync]);

  const restoreConflicting = useCallback(async () => {
    if (!nameConflict) return;
    setSaving(true);
    try {
      await restoreDesignationMutation.mutateAsync(nameConflict.existingId);
      setToast(arabicSource("org_structure.restore_success"));
      closeForm();
      await refetch();
    } catch (err) {
      setToast(`${arabicSource("common.error_2")} ${orgStructureErrorMessage(err, arabicSource("org_structure.the_operation_failed"))}`);
    } finally {
      setSaving(false);
    }
  }, [nameConflict, closeForm, refetch, setToast, restoreDesignationMutation.mutateAsync]);

  return {
    showForm, openNewForm, openEditForm, closeForm,
    formData, updateField,
    saving, editingDesignation,
    nameConflict, restoreConflicting,
    submit,
  };
};
