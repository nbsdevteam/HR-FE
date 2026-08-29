import { useMemo } from "react";
import { arabicSource } from "@/i18n/source";
import { useIsArabicLanguage } from "@/i18n/useLocalizedName";
import { Modal, ModalFooterActions, MultiSelect, Select } from "@/shared/components";
import type { DbDepartment, DbLeaveType } from "@/shared/hooks";
import type { LeaveLinkFormState } from "../types";
import { inputCls, labelCls } from "../styles";

type LeaveLinkFormModalProps = {
  departments: DbDepartment[];
  form: LeaveLinkFormState;
  isEditing: boolean;
  leaveTypes: DbLeaveType[];
  saving: boolean;
  onCancel: () => void;
  onFieldChange: (patch: Partial<LeaveLinkFormState>) => void;
  onSave: () => void;
};

const VERIFICATION_OPTIONS = [
  { value: "none", labelKey: "settings.leave_links_verification_none" },
  { value: "employee_code", labelKey: "settings.leave_links_verification_employee_code" },
  { value: "birthday", labelKey: "settings.leave_links_verification_birthday" },
  { value: "phone_last4", labelKey: "settings.leave_links_verification_phone_last4" },
] as const;

const LeaveLinkFormModal = ({
  departments,
  form,
  isEditing,
  leaveTypes,
  saving,
  onCancel,
  onFieldChange,
  onSave,
}: LeaveLinkFormModalProps) => {
  const isArabic = useIsArabicLanguage();

  const leaveTypeItems = useMemo(
    () => leaveTypes.map((type) => ({
      value: type.id,
      label: (isArabic ? type.name_ar || type.name_en : type.name_en || type.name_ar) || type.code,
    })),
    [isArabic, leaveTypes],
  );

  const departmentItems = useMemo(
    () => departments.map((department) => ({
      value: department.id,
      label: (isArabic ? department.name_ar || department.name_en : department.name_en || department.name_ar) || department.name,
    })),
    [departments, isArabic],
  );

  const verificationOptions = useMemo(
    () => VERIFICATION_OPTIONS.map((option) => ({ value: option.value, label: arabicSource(option.labelKey) })),
    [],
  );

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange({ name: event.target.value });
  };

  const handleActiveChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange({ active: event.target.checked });
  };

  const handleExpiresOnChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange({ expires_on: event.target.value });
  };

  const handleMaxSubmissionsChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange({ max_submissions: Number(event.target.value) || 0 });
  };

  const handleAllowAttachmentsChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange({ allow_attachments: event.target.checked });
  };

  const handleVerificationChange = (value: string): void => {
    onFieldChange({ require_verification: value as LeaveLinkFormState["require_verification"] });
  };

  const handleLeaveTypeIdsChange = (values: string[]): void => {
    onFieldChange({ leave_type_ids: values });
  };

  const handleDepartmentIdsChange = (values: string[]): void => {
    onFieldChange({ department_ids: values });
  };

  return (
    <Modal
      onClose={onCancel}
      title={arabicSource(isEditing ? "settings.leave_links_form_title_edit" : "settings.leave_links_form_title_create")}
      footer={
        <ModalFooterActions
          onCancel={onCancel}
          onConfirm={onSave}
          confirmLabel={arabicSource("common.save")}
          loading={saving}
          disabled={!form.name.trim()}
        />
      }
    >
      <div>
        <label className={labelCls} style={{ fontSize: 12 }}>{arabicSource("settings.leave_links_name_label")}</label>
        <input
          type="text"
          dir="auto"
          value={form.name}
          onChange={handleNameChange}
          placeholder={arabicSource("settings.leave_links_name_placeholder")}
          className={`${inputCls} w-full`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls} style={{ fontSize: 12 }}>{arabicSource("settings.leave_links_expires_label")}</label>
          <input
            type="date"
            dir="ltr"
            value={form.expires_on}
            onChange={handleExpiresOnChange}
            className={`${inputCls} w-full`}
          />
        </div>
        <div>
          <label className={labelCls} style={{ fontSize: 12 }}>{arabicSource("settings.leave_links_max_submissions_label")}</label>
          <input
            type="number"
            min={0}
            dir="ltr"
            value={form.max_submissions}
            onChange={handleMaxSubmissionsChange}
            className={`${inputCls} w-full`}
          />
        </div>
      </div>

      <Select
        label={arabicSource("settings.leave_links_verification_label")}
        value={form.require_verification}
        onChange={handleVerificationChange}
        options={verificationOptions}
        className={`${inputCls} w-full`}
      />

      <div>
        <label className={labelCls} style={{ fontSize: 12 }}>{arabicSource("settings.leave_links_leave_types_label")}</label>
        <MultiSelect
          items={leaveTypeItems}
          selectedValues={form.leave_type_ids}
          onChange={handleLeaveTypeIdsChange}
          placeholder={arabicSource("settings.leave_links_leave_types_placeholder")}
          className={`${inputCls} w-full`}
        />
      </div>

      <div>
        <label className={labelCls} style={{ fontSize: 12 }}>{arabicSource("settings.leave_links_departments_label")}</label>
        <MultiSelect
          items={departmentItems}
          selectedValues={form.department_ids}
          onChange={handleDepartmentIdsChange}
          placeholder={arabicSource("settings.leave_links_departments_placeholder")}
          className={`${inputCls} w-full`}
        />
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={form.active} onChange={handleActiveChange} className="accent-primary" />
          {arabicSource("settings.leave_links_active_label")}
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={form.allow_attachments} onChange={handleAllowAttachmentsChange} className="accent-primary" />
          {arabicSource("settings.leave_links_allow_attachments_label")}
        </label>
      </div>
    </Modal>
  );
};

export default LeaveLinkFormModal;
