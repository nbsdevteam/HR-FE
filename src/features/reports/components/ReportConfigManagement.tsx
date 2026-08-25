import { useCallback } from "react";
import { AnimatePresence } from "motion/react";
import { ArrowRight } from "lucide-react";
import { ConfirmDeleteModal, Toast } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { useReportTemplateMetadata } from "@/shared/hooks";
import type { ReportConfigColumn, ReportConfigFilterPair } from "../types";
import { useReportConfigList } from "../hooks/useReportConfigList";
import { useReportConfigForm } from "../hooks/useReportConfigForm";
import { useReportConfigDeleteRestore } from "../hooks/useReportConfigDeleteRestore";
import { useReportConfigToast } from "../hooks/useReportConfigToast";
import ReportConfigFiltersBar from "./ReportConfigFiltersBar";
import ReportConfigTable from "./ReportConfigTable";
import ReportConfigFormModal from "./ReportConfigFormModal";

type ReportConfigManagementProps = {
  onBack: () => void;
};

const ReportConfigManagement = ({ onBack }: ReportConfigManagementProps) => {
  const { metadata } = useReportTemplateMetadata();
  const list = useReportConfigList();
  const { toast, setToast } = useReportConfigToast();
  const form = useReportConfigForm({ metadata, refetch: list.refetch, setToast });
  const deleteRestore = useReportConfigDeleteRestore({ refetch: list.refetch, setToast });

  const handleColumnsChange = useCallback(
    (columns: ReportConfigColumn[]): void => form.updateField({ columns }),
    [form.updateField],
  );
  const handleFilterPairsChange = useCallback(
    (filterPairs: ReportConfigFilterPair[]): void => form.updateField({ filterPairs }),
    [form.updateField],
  );
  const handleIncludeArchivedToggle = useCallback(
    (): void => list.setIncludeArchived(!list.includeArchived),
    [list.setIncludeArchived, list.includeArchived],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-1 cursor-pointer">
            <ArrowRight className="w-4 h-4" />
            {arabicSource("reports.back_to_reports")}
          </button>
          <h1 className="text-gradient-gold">{arabicSource("reports.configurations_title")}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {list.total} {arabicSource("reports.configurations_count_suffix")}
          </p>
        </div>
      </div>

      <ReportConfigFiltersBar
        search={list.search}
        category={list.category}
        includeArchived={list.includeArchived}
        metadata={metadata}
        onSearchChange={list.setSearch}
        onCategoryChange={list.setCategory}
        onIncludeArchivedToggle={handleIncludeArchivedToggle}
        onNewConfiguration={form.openNewForm}
      />

      <ReportConfigTable
        items={list.items}
        metadata={metadata}
        onEdit={form.openEditForm}
        onArchive={deleteRestore.requestArchive}
        onRestore={deleteRestore.restoreTemplate}
        onHardDelete={deleteRestore.requestHardDelete}
      />

      <AnimatePresence>
        {form.showForm && (
          <ReportConfigFormModal
            formData={form.formData}
            editingTemplate={form.editingTemplate}
            metadata={metadata}
            saving={form.saving}
            codeConflict={form.codeConflict}
            codeChangeWarning={form.codeChangeWarning}
            confirmCodeChange={form.confirmCodeChange}
            onFieldChange={form.updateField}
            onColumnsChange={handleColumnsChange}
            onFilterPairsChange={handleFilterPairsChange}
            onSubmit={form.submit}
            onRestoreConflicting={form.restoreConflicting}
            onClose={form.closeForm}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteRestore.pendingAction && (
          <ConfirmDeleteModal
            onClose={deleteRestore.cancelPendingAction}
            onConfirm={deleteRestore.confirmPendingAction}
            loading={deleteRestore.working}
            title={
              deleteRestore.pendingAction.mode === "hardDelete"
                ? arabicSource("reports.hard_delete_confirm_title")
                : arabicSource("reports.archive_confirm_title")
            }
            message={
              deleteRestore.pendingAction.mode === "hardDelete"
                ? arabicSource("reports.hard_delete_confirm_message")
                : arabicSource("reports.archive_confirm_message")
            }
            confirmLabel={
              deleteRestore.pendingAction.mode === "hardDelete"
                ? arabicSource("reports.delete_permanently")
                : arabicSource("reports.archive_action")
            }
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <Toast
            message={toast}
            shape="card"
            position="bottom-end"
            toneClassName="bg-card border-border"
            textClassName="text-foreground text-sm"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReportConfigManagement;
