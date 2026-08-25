import { useCallback } from "react";
import { FileText, Save } from "lucide-react";
import { Modal, ModalFooterActions, InputField, Select } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DbReportTemplate, ReportTemplateMetadata } from "@/shared/hooks";
import type { ReportConfigColumn, ReportConfigFilterPair, ReportConfigFormData } from "../types";
import ReportConfigColumnsEditor from "./ReportConfigColumnsEditor";
import ReportConfigFiltersEditor from "./ReportConfigFiltersEditor";

const FIELD_CLASS = "w-full h-11 px-4 rounded-lg bg-input border border-border/50 text-foreground text-sm";

type CodeConflict = { existingTemplateId: number; existingActive: boolean };

type ReportConfigFormModalProps = {
  formData: ReportConfigFormData;
  editingTemplate: DbReportTemplate | null;
  metadata: ReportTemplateMetadata | null;
  saving: boolean;
  codeConflict: CodeConflict | null;
  codeChangeWarning: boolean;
  confirmCodeChange: boolean;
  onFieldChange: (patch: Partial<ReportConfigFormData>) => void;
  onColumnsChange: (columns: ReportConfigColumn[]) => void;
  onFilterPairsChange: (filterPairs: ReportConfigFilterPair[]) => void;
  onSubmit: () => void;
  onRestoreConflicting: () => void;
  onClose: () => void;
};

const ReportConfigFormModal = ({
  formData,
  editingTemplate,
  metadata,
  saving,
  codeConflict,
  codeChangeWarning,
  confirmCodeChange,
  onFieldChange,
  onColumnsChange,
  onFilterPairsChange,
  onSubmit,
  onRestoreConflicting,
  onClose,
}: ReportConfigFormModalProps) => {
  const handleNameArChange = useCallback((value: string): void => onFieldChange({ name_ar: value }), [onFieldChange]);
  const handleNameEnChange = useCallback((value: string): void => onFieldChange({ name_en: value }), [onFieldChange]);
  const handleCodeChange = useCallback((value: string): void => onFieldChange({ code: value }), [onFieldChange]);
  const handleDataSourceChange = useCallback((value: string): void => onFieldChange({ data_source: value }), [onFieldChange]);
  const handleSortOrderChange = useCallback((value: string): void => onFieldChange({ sort_order: value }), [onFieldChange]);
  const handleCategoryChange = useCallback((value: string): void => onFieldChange({ category: value }), [onFieldChange]);
  const handleFormatChange = useCallback((value: string): void => onFieldChange({ format: value }), [onFieldChange]);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    onFieldChange({ description: e.target.value });
  }, [onFieldChange]);

  const handleActiveChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange({ active: e.target.checked });
  }, [onFieldChange]);

  return (
    <Modal
      onClose={onClose}
      icon={FileText}
      title={editingTemplate ? arabicSource("reports.edit_configuration") : arabicSource("reports.new_configuration")}
      contentClassName="bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col"
      bodyClassName="p-6 space-y-4 overflow-y-auto"
      footer={
        <ModalFooterActions
          onCancel={onClose}
          onConfirm={onSubmit}
          confirmLabel={confirmCodeChange ? arabicSource("reports.confirm_anyway") : arabicSource("common.save")}
          confirmIcon={Save}
          disabled={saving}
          cancelDisabled={saving}
          loading={saving}
        />
      }
    >
      {codeConflict && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 text-sm flex items-center justify-between gap-3">
          <span>{arabicSource("reports.code_conflict_message")}</span>
          <button type="button" onClick={onRestoreConflicting} className="underline shrink-0 cursor-pointer">
            {arabicSource("reports.restore_that_configuration")}
          </button>
        </div>
      )}

      {codeChangeWarning && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 text-sm">
          {arabicSource("reports.code_change_warning")}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <InputField
          label={arabicSource("reports.name_ar_label")}
          value={formData.name_ar}
          onChange={handleNameArChange}
          className={FIELD_CLASS}
          dir="rtl"
        />
        <InputField
          label={arabicSource("reports.name_en_label")}
          value={formData.name_en}
          onChange={handleNameEnChange}
          className={FIELD_CLASS}
          dir="ltr"
        />
        <InputField
          label={arabicSource("reports.code_label")}
          value={formData.code}
          onChange={handleCodeChange}
          className={FIELD_CLASS}
          dir="ltr"
        />
        <InputField
          label={arabicSource("reports.data_source_label")}
          value={formData.data_source}
          onChange={handleDataSourceChange}
          className={FIELD_CLASS}
          dir="ltr"
        />
        <Select
          label={arabicSource("reports.category_label")}
          value={formData.category}
          onChange={handleCategoryChange}
          options={metadata?.categories || []}
          className={FIELD_CLASS}
        />
        <Select
          label={arabicSource("reports.format_label")}
          value={formData.format}
          onChange={handleFormatChange}
          options={metadata?.formats || []}
          className={FIELD_CLASS}
        />
        <InputField
          label={arabicSource("reports.sort_order_label")}
          type="number"
          value={formData.sort_order}
          onChange={handleSortOrderChange}
          className={FIELD_CLASS}
        />
        {editingTemplate && (
          <label className="flex items-center gap-2 self-end pb-2.5 text-foreground text-sm">
            <input type="checkbox" checked={formData.active} onChange={handleActiveChange} />
            {arabicSource("reports.active_label")}
          </label>
        )}
      </div>

      <div>
        <label className="block text-foreground text-sm mb-2">{arabicSource("reports.description_label")}</label>
        <textarea
          value={formData.description}
          onChange={handleDescriptionChange}
          rows={2}
          className="w-full px-4 py-2.5 rounded-lg bg-input border border-border/50 text-foreground text-sm resize-none"
        />
      </div>

      <ReportConfigColumnsEditor columns={formData.columns} onChange={onColumnsChange} />
      <ReportConfigFiltersEditor filterPairs={formData.filterPairs} onChange={onFilterPairsChange} />
    </Modal>
  );
};

export default ReportConfigFormModal;
