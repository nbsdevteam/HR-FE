import { useCallback, useMemo } from "react";
import { Briefcase, Save } from "lucide-react";
import { Modal, ModalFooterActions, InputField, Select, type SelectOption } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DbDepartment, DbPosition } from "@/shared/hooks";
import type { DesignationFormData, NameConflict } from "../types";

const FIELD_CLASS = "w-full h-11 px-4 rounded-lg bg-input border border-border/50 text-foreground text-sm";

type DesignationFormModalProps = {
  formData: DesignationFormData;
  editingDesignation: DbPosition | null;
  departments: DbDepartment[];
  designations: DbPosition[];
  saving: boolean;
  nameConflict: NameConflict | null;
  onFieldChange: (patch: Partial<DesignationFormData>) => void;
  onSubmit: () => void;
  onRestoreConflicting: () => void;
  onClose: () => void;
};

const DesignationFormModal = ({
  formData,
  editingDesignation,
  departments,
  designations,
  saving,
  nameConflict,
  onFieldChange,
  onSubmit,
  onRestoreConflicting,
  onClose,
}: DesignationFormModalProps) => {
  const departmentOptions = useMemo<SelectOption[]>(
    () => departments.map((d) => ({ value: d.id, label: d.name_en || d.name })),
    [departments],
  );

  const reportsToOptions = useMemo<SelectOption[]>(
    () => designations
      .filter((d) => d.id !== editingDesignation?.id)
      .map((d) => ({ value: d.id, label: d.title_en || d.title_ar })),
    [designations, editingDesignation],
  );

  const handleNameChange = useCallback((value: string): void => onFieldChange({ name: value }), [onFieldChange]);
  const handleTitleArChange = useCallback((value: string): void => onFieldChange({ title_ar: value }), [onFieldChange]);
  const handleDepartmentChange = useCallback((value: string): void => onFieldChange({ department_id: value }), [onFieldChange]);
  const handleLevelChange = useCallback((value: string): void => onFieldChange({ level: value }), [onFieldChange]);
  const handleReportsToChange = useCallback((value: string): void => onFieldChange({ reports_to_job_id: value }), [onFieldChange]);
  const handleMaxHeadcountChange = useCallback((value: string): void => onFieldChange({ max_headcount: value }), [onFieldChange]);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    onFieldChange({ description: e.target.value });
  }, [onFieldChange]);

  const handleActiveChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange({ active: e.target.checked });
  }, [onFieldChange]);

  return (
    <Modal
      onClose={onClose}
      icon={Briefcase}
      title={editingDesignation ? arabicSource("org_structure.edit_job_title") : arabicSource("org_structure.new_job_title")}
      contentClassName="bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col"
      bodyClassName="p-6 space-y-4 overflow-y-auto"
      footer={
        <ModalFooterActions
          onCancel={onClose}
          onConfirm={onSubmit}
          confirmLabel={arabicSource("common.save")}
          confirmIcon={Save}
          disabled={saving}
          cancelDisabled={saving}
          loading={saving}
        />
      }
    >
      {nameConflict && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 text-sm flex items-center justify-between gap-3">
          <span>{arabicSource("org_structure.name_conflict_message")}</span>
          <button type="button" onClick={onRestoreConflicting} className="underline shrink-0 cursor-pointer">
            {arabicSource("org_structure.restore_that_one_instead")}
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <InputField
          label={arabicSource("org_structure.name_label")}
          value={formData.name}
          onChange={handleNameChange}
          className={FIELD_CLASS}
          dir="ltr"
        />
        <InputField
          label={arabicSource("org_structure.title_ar_label")}
          value={formData.title_ar}
          onChange={handleTitleArChange}
          className={FIELD_CLASS}
          dir="rtl"
        />
        <Select
          label={arabicSource("common.section")}
          value={formData.department_id}
          onChange={handleDepartmentChange}
          options={departmentOptions}
          optionsAreData
          blankLabel={arabicSource("org_structure.none_option")}
          className={FIELD_CLASS}
        />
        <Select
          label={arabicSource("org_structure.reports_to_label")}
          value={formData.reports_to_job_id}
          onChange={handleReportsToChange}
          options={reportsToOptions}
          optionsAreData
          blankLabel={arabicSource("org_structure.none_option")}
          className={FIELD_CLASS}
        />
        <InputField
          label={arabicSource("org_structure.level_label")}
          type="number"
          value={formData.level}
          onChange={handleLevelChange}
          className={FIELD_CLASS}
        />
        <InputField
          label={arabicSource("org_structure.max_headcount_label")}
          type="number"
          value={formData.max_headcount}
          onChange={handleMaxHeadcountChange}
          className={FIELD_CLASS}
        />
        {editingDesignation && (
          <label className="flex items-center gap-2 self-end pb-2.5 text-foreground text-sm">
            <input type="checkbox" checked={formData.active} onChange={handleActiveChange} />
            {arabicSource("org_structure.active_label")}
          </label>
        )}
      </div>

      <div>
        <label className="block text-foreground text-sm mb-2">{arabicSource("org_structure.description_label")}</label>
        <textarea
          value={formData.description}
          onChange={handleDescriptionChange}
          rows={2}
          className="w-full px-4 py-2.5 rounded-lg bg-input border border-border/50 text-foreground text-sm resize-none"
        />
      </div>
    </Modal>
  );
};

export default DesignationFormModal;
