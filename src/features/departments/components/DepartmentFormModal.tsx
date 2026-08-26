import { useCallback, useMemo } from "react";
import { Building2, Save } from "lucide-react";
import { Modal, ModalFooterActions, InputField, Select, type SelectOption } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { empDisplayName } from "@/shared/hooks/core";
import type { DbDepartment, DbEmployee } from "@/shared/hooks";
import { DEPT_COLOR_PALETTE } from "@/features/settings/constants/settings";
import DepartmentColorSwatch from "@/features/settings/components/DepartmentColorSwatch";
import type { DepartmentFormData, NameConflict } from "../types";

const FIELD_CLASS = "w-full h-11 px-4 rounded-lg bg-input border border-border/50 text-foreground text-sm";

type DepartmentFormModalProps = {
  formData: DepartmentFormData;
  editingDepartment: DbDepartment | null;
  departments: DbDepartment[];
  employees: DbEmployee[];
  shifts: { value: string; label: string }[];
  saving: boolean;
  nameConflict: NameConflict | null;
  onFieldChange: (patch: Partial<DepartmentFormData>) => void;
  onSubmit: () => void;
  onRestoreConflicting: () => void;
  onClose: () => void;
};

const DepartmentFormModal = ({
  formData,
  editingDepartment,
  departments,
  employees,
  shifts,
  saving,
  nameConflict,
  onFieldChange,
  onSubmit,
  onRestoreConflicting,
  onClose,
}: DepartmentFormModalProps) => {
  const parentOptions = useMemo<SelectOption[]>(
    () => departments
      .filter((d) => d.id !== editingDepartment?.id)
      .map((d) => ({ value: d.id, label: d.complete_name || d.name })),
    [departments, editingDepartment],
  );

  const managerOptions = useMemo<SelectOption[]>(
    () => employees.map((e) => ({ value: e.id, label: empDisplayName(e) })),
    [employees],
  );

  const shiftOptions = useMemo<SelectOption[]>(
    () => shifts.map((s) => ({ value: s.value, label: s.label })),
    [shifts],
  );

  const usedColors = useMemo(() => {
    const set = new Set<string>();
    departments.forEach((d) => {
      if (d.id !== editingDepartment?.id) set.add(d.color);
    });
    return set;
  }, [departments, editingDepartment]);

  const handleNameChange = useCallback((value: string): void => onFieldChange({ name: value }), [onFieldChange]);
  const handleNameArChange = useCallback((value: string): void => onFieldChange({ name_ar: value }), [onFieldChange]);
  const handleParentChange = useCallback((value: string): void => onFieldChange({ parent_id: value }), [onFieldChange]);
  const handleManagerChange = useCallback((value: string): void => onFieldChange({ manager_id: value }), [onFieldChange]);
  const handleShiftChange = useCallback((value: string): void => onFieldChange({ default_shift_id: value }), [onFieldChange]);
  const handleSortOrderChange = useCallback((value: string): void => onFieldChange({ sort_order: value }), [onFieldChange]);

  const handleColorSelect = useCallback((color: string) => (): void => {
    onFieldChange({ color });
  }, [onFieldChange]);

  const handleCustomColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange({ color: e.target.value });
  }, [onFieldChange]);

  const handleActiveChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange({ active: e.target.checked });
  }, [onFieldChange]);

  return (
    <Modal
      onClose={onClose}
      icon={Building2}
      title={editingDepartment ? arabicSource("org_structure.edit_department") : arabicSource("org_structure.new_department")}
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
          label={arabicSource("org_structure.name_ar_label")}
          value={formData.name_ar}
          onChange={handleNameArChange}
          className={FIELD_CLASS}
          dir="rtl"
        />
        <Select
          label={arabicSource("org_structure.parent_department_label")}
          value={formData.parent_id}
          onChange={handleParentChange}
          options={parentOptions}
          blankLabel={arabicSource("org_structure.none_option")}
          className={FIELD_CLASS}
        />
        <Select
          label={arabicSource("org_structure.manager_label")}
          value={formData.manager_id}
          onChange={handleManagerChange}
          options={managerOptions}
          blankLabel={arabicSource("org_structure.none_option")}
          className={FIELD_CLASS}
        />
        <Select
          label={arabicSource("org_structure.default_shift_label")}
          value={formData.default_shift_id}
          onChange={handleShiftChange}
          options={shiftOptions}
          blankLabel={arabicSource("org_structure.none_option")}
          className={FIELD_CLASS}
        />
        <InputField
          label={arabicSource("org_structure.sort_order_label")}
          type="number"
          value={formData.sort_order}
          onChange={handleSortOrderChange}
          className={FIELD_CLASS}
        />
        {editingDepartment && (
          <label className="flex items-center gap-2 self-end pb-2.5 text-foreground text-sm">
            <input type="checkbox" checked={formData.active} onChange={handleActiveChange} />
            {arabicSource("org_structure.active_label")}
          </label>
        )}
      </div>

      <div>
        <label className="block text-foreground text-sm mb-2">{arabicSource("org_structure.color_label")}</label>
        <div className="flex flex-wrap gap-1.5">
          {DEPT_COLOR_PALETTE.map((color) => (
            <DepartmentColorSwatch
              key={color}
              color={color}
              isUsed={usedColors.has(color) && color !== formData.color}
              isSelected={color === formData.color}
              onClick={handleColorSelect(color)}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2.5">
          <label className="text-muted-foreground shrink-0" style={{ fontSize: 11 }}>
            {arabicSource("org_structure.custom_color_label")}
          </label>
          <input
            type="color"
            value={formData.color}
            onChange={handleCustomColorChange}
            className="w-8 h-8 rounded-lg border border-border/40 cursor-pointer bg-transparent p-0"
          />
          <span className="text-muted-foreground font-mono" style={{ fontSize: 11 }}>{formData.color}</span>
        </div>
      </div>
    </Modal>
  );
};

export default DepartmentFormModal;
