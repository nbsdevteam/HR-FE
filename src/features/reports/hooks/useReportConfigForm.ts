import { useState, useCallback } from "react";
import * as odooData from "@/shared/api/odooData";
import { arabicSource } from "@/i18n/source";
import type { HrApiError } from "@/shared/api/client";
import { useOdooMutation, type DbReportTemplate, type ReportTemplateMetadata } from "@/shared/hooks";
import { reportConfigErrorMessage } from "../utils/reportConfigErrorMessage";
import type { ReportConfigFormData } from "../types";

const EMPTY_FORM: ReportConfigFormData = {
  name_ar: "",
  name_en: "",
  code: "",
  description: "",
  data_source: "",
  category: "custom",
  format: "table",
  sort_order: "0",
  active: true,
  columns: [],
  filterPairs: [],
};

const templateToForm = (template: DbReportTemplate): ReportConfigFormData => ({
  name_ar: template.name_ar,
  name_en: template.name_en || "",
  code: template.code,
  description: template.description || "",
  data_source: template.data_source,
  category: template.category,
  format: template.format,
  sort_order: String(template.sort_order),
  active: template.is_active,
  columns: template.columns.map((c) => ({ ...c })),
  filterPairs: Object.entries(template.default_filters).map(([key, value]) => ({
    key,
    value: typeof value === "string" ? value : JSON.stringify(value),
  })),
});

/** Round-trips numbers/booleans/objects through their real type; keeps plain text as a string. */
const parseFilterValue = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

const isGeneratable = (metadata: ReportTemplateMetadata | null, code: string): boolean => {
  if (!metadata) return true;
  const resolved = metadata.codeAliases[code] || code;
  return metadata.generatableCodes.includes(resolved);
};

type CodeConflict = { existingTemplateId: number; existingActive: boolean };

type UseReportConfigFormArgs = {
  metadata: ReportTemplateMetadata | null;
  refetch: () => void | Promise<void>;
  setToast: (message: string | null) => void;
};

export const useReportConfigForm = ({ metadata, refetch, setToast }: UseReportConfigFormArgs) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<ReportConfigFormData>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DbReportTemplate | null>(null);
  const [codeConflict, setCodeConflict] = useState<CodeConflict | null>(null);
  const [confirmCodeChange, setConfirmCodeChange] = useState(false);

  const updateTemplateMutation = useOdooMutation(
    ({ id, payload }: { id: string; payload: Record<string, unknown> }) => odooData.updateReportTemplate(id, payload),
    "reportTemplates",
  );
  const createTemplateMutation = useOdooMutation(odooData.createReportTemplate, "reportTemplates");
  const restoreTemplateMutation = useOdooMutation(odooData.restoreReportTemplate, "reportTemplates");

  const codeChangeWarning = Boolean(
    editingTemplate &&
    editingTemplate.can_generate &&
    formData.code !== editingTemplate.code &&
    !isGeneratable(metadata, formData.code),
  );

  const resetForm = useCallback(() => {
    setFormData({ ...EMPTY_FORM });
    setEditingTemplate(null);
    setCodeConflict(null);
    setConfirmCodeChange(false);
  }, []);

  const updateField = useCallback((patch: Partial<ReportConfigFormData>) => {
    setFormData((prev) => ({ ...prev, ...patch }));
    setCodeConflict(null);
    if (patch.code !== undefined) setConfirmCodeChange(false);
  }, []);

  const openNewForm = useCallback(() => {
    resetForm();
    setShowForm(true);
  }, [resetForm]);

  const openEditForm = useCallback((template: DbReportTemplate) => {
    setEditingTemplate(template);
    setFormData(templateToForm(template));
    setCodeConflict(null);
    setConfirmCodeChange(false);
    setShowForm(true);
  }, []);

  const closeForm = useCallback(() => {
    setShowForm(false);
    resetForm();
  }, [resetForm]);

  const buildPayload = useCallback((): Record<string, unknown> => {
    const default_filters: Record<string, unknown> = {};
    formData.filterPairs.forEach((pair) => {
      if (pair.key.trim()) default_filters[pair.key.trim()] = parseFilterValue(pair.value);
    });
    return {
      name_ar: formData.name_ar.trim(),
      name_en: formData.name_en.trim() || undefined,
      code: formData.code.trim(),
      description: formData.description.trim() || undefined,
      data_source: formData.data_source.trim() || undefined,
      category: formData.category,
      format: formData.format,
      columns: formData.columns
        .filter((c) => c.key.trim())
        .map((c) => ({ key: c.key.trim(), label: c.label.trim() })),
      default_filters,
      sort_order: Number(formData.sort_order) || 0,
      ...(editingTemplate ? { active: formData.active } : {}),
    };
  }, [formData, editingTemplate]);

  const submit = useCallback(async () => {
    if (!formData.name_ar.trim() || (!editingTemplate && !formData.code.trim())) {
      setToast(arabicSource("reports.please_fill_required_fields"));
      return;
    }
    if (codeChangeWarning && !confirmCodeChange) {
      setConfirmCodeChange(true);
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      if (editingTemplate) {
        await updateTemplateMutation.mutateAsync({ id: editingTemplate.id, payload });
        setToast(arabicSource("reports.update_success"));
      } else {
        await createTemplateMutation.mutateAsync(payload);
        setToast(arabicSource("reports.create_success"));
      }
      closeForm();
      await refetch();
    } catch (err) {
      const code = (err as HrApiError | undefined)?.code;
      if (code === "code_exists") {
        const details = (err as HrApiError | undefined)?.details;
        setCodeConflict({
          existingTemplateId: Number(details?.existing_template_id),
          existingActive: Boolean(details?.existing_active),
        });
      } else {
        setToast(`${arabicSource("common.error_2")} ${reportConfigErrorMessage(err, arabicSource("reports.the_operation_failed"))}`);
      }
    } finally {
      setSaving(false);
    }
  }, [
    formData, editingTemplate, codeChangeWarning, confirmCodeChange, buildPayload, closeForm, refetch, setToast,
    updateTemplateMutation.mutateAsync, createTemplateMutation.mutateAsync,
  ]);

  const restoreConflicting = useCallback(async () => {
    if (!codeConflict) return;
    setSaving(true);
    try {
      await restoreTemplateMutation.mutateAsync(codeConflict.existingTemplateId);
      setToast(arabicSource("reports.restore_success"));
      closeForm();
      await refetch();
    } catch (err) {
      setToast(`${arabicSource("common.error_2")} ${reportConfigErrorMessage(err, arabicSource("reports.the_operation_failed"))}`);
    } finally {
      setSaving(false);
    }
  }, [codeConflict, closeForm, refetch, setToast, restoreTemplateMutation.mutateAsync]);

  return {
    showForm, openNewForm, openEditForm, closeForm,
    formData, updateField,
    saving, editingTemplate,
    codeConflict, restoreConflicting,
    codeChangeWarning, confirmCodeChange,
    submit,
  };
};
