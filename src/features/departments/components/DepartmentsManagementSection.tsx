import { useState, useCallback } from "react";
import { AnimatePresence } from "motion/react";
import { ConfirmDeleteModal, Toast } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { useEmployees } from "@/shared/hooks";
import type { DepartmentMetadata } from "@/shared/hooks";
import { useDepartmentManagementList } from "../hooks/useDepartmentManagementList";
import { useDepartmentForm } from "../hooks/useDepartmentForm";
import { useDepartmentDeleteRestore } from "../hooks/useDepartmentDeleteRestore";
import OrgStructureListHeader from "./OrgStructureListHeader";
import DepartmentManagementTable from "./DepartmentManagementTable";
import DepartmentFormModal from "./DepartmentFormModal";

type DepartmentsManagementSectionProps = {
  metadata: DepartmentMetadata | null;
};

const DepartmentsManagementSection = ({ metadata }: DepartmentsManagementSectionProps) => {
  const [toast, setToast] = useState<string | null>(null);
  const list = useDepartmentManagementList();
  const { employees } = useEmployees();
  const form = useDepartmentForm({ refetch: list.refetch, setToast });
  const deleteRestore = useDepartmentDeleteRestore({ refetch: list.refetch, setToast });

  const handleIncludeArchivedChange = useCallback((includeArchived: boolean): void => {
    list.setIncludeArchived(includeArchived);
  }, [list.setIncludeArchived]);

  const inUseMessage = deleteRestore.pendingDelete?.guard
    ? `${arabicSource("org_structure.department_in_use_message_prefix")} ${deleteRestore.pendingDelete.guard.employeeCount} ${arabicSource("org_structure.employees_suffix")}, ${deleteRestore.pendingDelete.guard.childCount} ${arabicSource("org_structure.sub_departments_suffix")}. ${arabicSource("org_structure.force_delete_hint")}`
    : arabicSource("org_structure.archive_confirm_message");

  return (
    <div className="space-y-4">
      <OrgStructureListHeader
        count={list.total}
        countSuffix={arabicSource("org_structure.departments_count_suffix")}
        includeArchived={list.includeArchived}
        onIncludeArchivedChange={handleIncludeArchivedChange}
        canCreate={metadata?.canCreate ?? false}
        onAdd={form.openNewForm}
        addLabel={arabicSource("org_structure.new_department")}
      />

      <DepartmentManagementTable
        items={list.items}
        canEdit={metadata?.canEdit ?? false}
        canDelete={metadata?.canDelete ?? false}
        onEdit={form.openEditForm}
        onDelete={deleteRestore.requestDelete}
        onRestore={deleteRestore.restoreDepartment}
      />

      <AnimatePresence>
        {form.showForm && (
          <DepartmentFormModal
            formData={form.formData}
            editingDepartment={form.editingDepartment}
            departments={list.items}
            employees={employees}
            shifts={metadata?.shifts || []}
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

export default DepartmentsManagementSection;
