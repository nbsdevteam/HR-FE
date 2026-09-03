import { useState, useCallback } from "react";
import type { DbEmployee } from "@/shared/hooks";
import * as odooData from "@/shared/api/odooData";
import { SYNC_API } from "@/shared/constants";
import { useOdooMutation } from "@/shared/hooks/useOdooMutation";
import { localizedAlert } from "@/i18n/native";
import { arabicSource } from "@/i18n/source";
import type { HrApiError } from "@/shared/api/client";
import type { DeleteEmployeeTarget, EmployeeInUseGuard } from "../types";
import { errorMessage } from "../utils/errorMessage";

/**
 * Archive flow for the employee list/kanban delete button (backend §3). The
 * button now sends `deleteEmployee` (archive, not `set_status: "suspended"` —
 * see FE hand-off §1/§4.2), so the employee disappears from every list and
 * picker instead of quietly staying active. An `employee_in_use` refusal
 * re-arms the same target with the returned counts so the confirm modal can
 * re-prompt for `force: true`; `me.id` never reaches this flow at all, since
 * the caller is expected to withhold the action for their own row.
 */
export const useEmployeeDeleteFlow = (
  dbEmployees: DbEmployee[],
  refetch: () => void,
  currentEmployeeId?: string | null,
) => {
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteEmployeeTarget | null>(null);
  const [deleteGuard, setDeleteGuard] = useState<EmployeeInUseGuard | null>(null);
  const [deleting, setDeleting] = useState(false);

  const deleteEmployeeMutation = useOdooMutation(
    (variables: { id: string; force: boolean }) =>
      odooData.deleteEmployee(variables.id, { force: variables.force }),
    "employees",
  );

  const requestDeleteEmployee = useCallback((target: DeleteEmployeeTarget) => {
    if (currentEmployeeId && target.id === currentEmployeeId) return;
    setDeleteGuard(null);
    setDeleteConfirm(target);
  }, [currentEmployeeId]);

  const handleDeleteEmployee = useCallback(async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const dbEmp = dbEmployees.find(e => e.id === deleteConfirm.id);
      if (dbEmp?.device_employee_no) {
        try {
          await fetch(`${SYNC_API}/device/persons/${dbEmp.device_employee_no}`, { method: "DELETE" });
        } catch {
          // Device removal is best-effort.
        }
      }
      await deleteEmployeeMutation.mutateAsync({ id: deleteConfirm.id, force: Boolean(deleteGuard) });
      refetch();
      setDeleteConfirm(null);
      setDeleteGuard(null);
    } catch (error: unknown) {
      const apiError = error as HrApiError | undefined;
      if (apiError?.code === "employee_in_use") {
        setDeleteGuard({
          reportCount: Number(apiError.details?.report_count) || 0,
          departmentCount: Number(apiError.details?.department_count) || 0,
        });
      } else {
        const message = errorMessage(error);
        console.error("Delete failed:", message);
        localizedAlert(arabicSource("employees.error_deleting_employee") + " " + message);
      }
    }
    setDeleting(false);
  }, [dbEmployees, deleteConfirm, deleteEmployeeMutation.mutateAsync, deleteGuard, refetch]);

  const closeDeleteModal = useCallback(() => {
    setDeleteConfirm(null);
    setDeleteGuard(null);
  }, []);

  return {
    closeDeleteModal,
    deleteConfirm,
    deleteGuard,
    deleting,
    handleDeleteEmployee,
    requestDeleteEmployee,
  };
};
