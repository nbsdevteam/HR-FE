import { useState, useCallback } from "react";
import { AnimatePresence } from "motion/react";
import { ConfirmDeleteModal, Toast } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { useDepartments } from "@/shared/hooks";
import type { DepartmentMetadata } from "@/shared/hooks";
import { useDesignationManagementList } from "../hooks/useDesignationManagementList";
import { useDesignationForm } from "../hooks/useDesignationForm";
import { useDesignationDeleteRestore } from "../hooks/useDesignationDeleteRestore";
import OrgStructureListHeader from "./OrgStructureListHeader";
import DesignationManagementTable from "./DesignationManagementTable";
import DesignationFormModal from "./DesignationFormModal";

type DesignationsManagementSectionProps = {
  metadata: DepartmentMetadata | null;
};

const DesignationsManagementSection = ({ metadata }: DesignationsManagementSectionProps) => {
  const [toast, setToast] = useState<string | null>(null);
  const list = useDesignationManagementList();
  const { departments } = useDepartments();
  const form = useDesignationForm({ refetch: list.refetch, setToast });
  const deleteRestore = useDesignationDeleteRestore({ refetch: list.refetch, setToast });

  const handleIncludeArchivedChange = useCallback((includeArchived: boolean): void => {
    list.setIncludeArchived(includeArchived);
  }, [list.setIncludeArchived]);

  const inUseMessage = deleteRestore.pendingDelete?.guard
    ? `${arabicSource("org_structure.designation_in_use_message_prefix")} ${deleteRestore.pendingDelete.guard.employeeCount} ${arabicSource("org_structure.employees_suffix")}, ${deleteRestore.pendingDelete.guard.reportCount} ${arabicSource("org_structure.reporting_positions_suffix")}. ${arabicSource("org_structure.force_delete_hint")}`
    : arabicSource("org_structure.archive_confirm_message");

  return (
    <div className="space-y-4">
      <OrgStructureListHeader
        count={list.total}
        countSuffix={arabicSource("org_structure.job_titles_count_suffix")}
        includeArchived={list.includeArchived}
        onIncludeArchivedChange={handleIncludeArchivedChange}
        canCreate={metadata?.canCreate ?? false}
        onAdd={form.openNewForm}
        addLabel={arabicSource("org_structure.new_job_title")}
      />

      <DesignationManagementTable
        items={list.items}
        canEdit={metadata?.canEdit ?? false}
        canDelete={metadata?.canDelete ?? false}
        onEdit={form.openEditForm}
        onDelete={deleteRestore.requestDelete}
        onRestore={deleteRestore.restoreDesignation}
      />

      <AnimatePresence>
        {form.showForm && (
          <DesignationFormModal
            formData={form.formData}
            editingDesignation={form.editingDesignation}
            departments={departments}
            designations={list.items}
            saving={form.saving}
            nameConflict={form.nameConflict}
            onFieldChange={form.updateField}
            onSubmit={form.submit}
            onRestoreConflicting={form.restoreConflicting}
            onClose={form.closeForm}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteRestore.pendingDelete && (
          <ConfirmDeleteModal
            onClose={deleteRestore.cancelPendingDelete}
            onConfirm={deleteRestore.confirmPendingDelete}
            loading={deleteRestore.working}
            title={arabicSource("org_structure.archive_confirm_title")}
            message={inUseMessage}
            confirmLabel={
              deleteRestore.pendingDelete.guard
                ? arabicSource("org_structure.force_delete_action")
                : arabicSource("org_structure.archive_action")
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

export default DesignationsManagementSection;
