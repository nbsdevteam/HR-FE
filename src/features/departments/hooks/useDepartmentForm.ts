import { useState, useCallback } from "react";
import * as odooData from "@/shared/api/odooData";
import { useOdooMutation } from "@/shared/hooks/useOdooMutation";
import { arabicSource } from "@/i18n/source";
import type { HrApiError } from "@/shared/api/client";
import type { DbDepartment } from "@/shared/hooks";
import type { DepartmentFormData, NameConflict } from "../types";
import { orgStructureErrorMessage } from "../utils/orgStructureErrorMessage";

const EMPTY_FORM: DepartmentFormData = {
  name: "",
  name_ar: "",
  parent_id: "",
  manager_id: "",
  default_shift_id: "",
  color: "#8B5CF6",
  sort_order: "0",
  active: true,
};

const departmentToForm = (department: DbDepartment): DepartmentFormData => ({
  name: department.name_en,
  name_ar: department.name_ar || "",
  parent_id: department.parent_id || "",
  manager_id: department.manager_id || "",
  default_shift_id: department.default_shift_id || "",
  color: department.color,
  sort_order: String(department.sort_order),
  active: department.is_active,
});

type UseDepartmentFormArgs = {
  refetch: () => void | Promise<void>;
  setToast: (message: string | null) => void;
};

/**
 * Create/edit form state for the department admin screen (backend §4).
 *
 * `refetch` refreshes the admin screen's own (non-cached) filtered list,
 * which the shared `departments`/`departmentMetadata` cache invalidation
 * below does not reach — it still has to be called explicitly after each
 * mutation.
 */
export const useDepartmentForm = ({ refetch, setToast }: UseDepartmentFormArgs) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<DepartmentFormData>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<DbDepartment | null>(null);
  const [nameConflict, setNameConflict] = useState<NameConflict | null>(null);

  const createDepartmentMutation = useOdooMutation(
    (payload: Record<string, unknown>) => odooData.createDepartment(payload),
    ["departments", "departmentMetadata"],
  );
  const updateDepartmentMutation = useOdooMutation(
    ({ id, payload }: { id: string; payload: Record<string, unknown> }) => odooData.updateDepartment(id, payload),
    ["departments", "departmentMetadata"],
  );
  const restoreDepartmentMutation = useOdooMutation(
    (id: number) => odooData.restoreDepartment(id),
    ["departments", "departmentMetadata"],
  );

  const resetForm = useCallback(() => {
    setFormData({ ...EMPTY_FORM });
    setEditingDepartment(null);
    setNameConflict(null);
  }, []);

  const updateField = useCallback((patch: Partial<DepartmentFormData>) => {
    setFormData((prev) => ({ ...prev, ...patch }));
    setNameConflict(null);
  }, []);

  const openNewForm = useCallback(() => {
    resetForm();
    setShowForm(true);
  }, [resetForm]);

  const openEditForm = useCallback((department: DbDepartment) => {
    setEditingDepartment(department);
    setFormData(departmentToForm(department));
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
      name_ar: formData.name_ar.trim() || undefined,
      parent_id: formData.parent_id ? Number(formData.parent_id) : null,
      manager_id: formData.manager_id ? Number(formData.manager_id) : null,
      default_shift_id: formData.default_shift_id ? Number(formData.default_shift_id) : null,
      color: formData.color || undefined,
      sort_order: Number(formData.sort_order) || 0,
      ...(editingDepartment ? { active: formData.active } : {}),
    };
  }, [formData, editingDepartment]);

  const submit = useCallback(async () => {
    if (!formData.name.trim()) {
      setToast(arabicSource("org_structure.please_fill_required_fields"));
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      if (editingDepartment) {
        await updateDepartmentMutation.mutateAsync({ id: editingDepartment.id, payload });
        setToast(arabicSource("org_structure.department_update_success"));
      } else {
        await createDepartmentMutation.mutateAsync(payload);
        setToast(arabicSource("org_structure.department_create_success"));
      }
      closeForm();
      await refetch();
    } catch (err) {
      const code = (err as HrApiError | undefined)?.code;
      if (code === "name_exists") {
        const details = (err as HrApiError | undefined)?.details;
        setNameConflict({
          existingId: Number(details?.existing_department_id),
          existingActive: Boolean(details?.existing_active),
        });
      } else {
        setToast(`${arabicSource("common.error_2")} ${orgStructureErrorMessage(err, arabicSource("org_structure.the_operation_failed"))}`);
      }
    } finally {
      setSaving(false);
    }
  }, [formData, editingDepartment, buildPayload, closeForm, refetch, setToast, updateDepartmentMutation.mutateAsync, createDepartmentMutation.mutateAsync]);

  const restoreConflicting = useCallback(async () => {
    if (!nameConflict) return;
    setSaving(true);
    try {
      await restoreDepartmentMutation.mutateAsync(nameConflict.existingId);
      setToast(arabicSource("org_structure.restore_success"));
      closeForm();
      await refetch();
    } catch (err) {
      setToast(`${arabicSource("common.error_2")} ${orgStructureErrorMessage(err, arabicSource("org_structure.the_operation_failed"))}`);
    } finally {
      setSaving(false);
    }
  }, [nameConflict, closeForm, refetch, setToast, restoreDepartmentMutation.mutateAsync]);

  return {
    showForm, openNewForm, openEditForm, closeForm,
    formData, updateField,
    saving, editingDepartment,
    nameConflict, restoreConflicting,
    submit,
  };
};
