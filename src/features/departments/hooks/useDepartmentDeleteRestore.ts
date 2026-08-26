import { useState, useCallback } from "react";
import * as odooData from "@/shared/api/odooData";
import { arabicSource } from "@/i18n/source";
import type { HrApiError } from "@/shared/api/client";
import type { DbDepartment } from "@/shared/hooks";
import type { PendingDepartmentDelete } from "../types";
import { orgStructureErrorMessage } from "../utils/orgStructureErrorMessage";

type UseDepartmentDeleteRestoreArgs = {
  refetch: () => void | Promise<void>;
  setToast: (message: string | null) => void;
};

/**
 * Archive/restore for the department admin screen (backend §6). A first
 * archive attempt that's refused with `department_in_use` re-arms the same
 * pending state with the returned counts, so the confirm modal can re-prompt
 * for `force: true` instead of silently failing.
 */
export const useDepartmentDeleteRestore = ({ refetch, setToast }: UseDepartmentDeleteRestoreArgs) => {
  const [pendingDelete, setPendingDelete] = useState<PendingDepartmentDelete | null>(null);
  const [working, setWorking] = useState(false);

  const requestDelete = useCallback((department: DbDepartment) => {
    setPendingDelete({ department, guard: null });
  }, []);

  const cancelPendingDelete = useCallback(() => {
    setPendingDelete(null);
  }, []);

  const confirmPendingDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setWorking(true);
    try {
      await odooData.deleteDepartment(pendingDelete.department.id, { force: Boolean(pendingDelete.guard) });
      setToast(arabicSource("org_structure.archive_success"));
      setPendingDelete(null);
      await refetch();
    } catch (err) {
      const apiError = err as HrApiError | undefined;
      if (apiError?.code === "department_in_use") {
        setPendingDelete({
          department: pendingDelete.department,
          guard: {
            employeeCount: Number(apiError.details?.employee_count) || 0,
            childCount: Number(apiError.details?.child_count) || 0,
          },
        });
      } else {
        setToast(`${arabicSource("common.error_2")} ${orgStructureErrorMessage(err, arabicSource("org_structure.the_operation_failed"))}`);
      }
    } finally {
      setWorking(false);
    }
  }, [pendingDelete, refetch, setToast]);

  const restoreDepartment = useCallback(async (department: DbDepartment) => {
    setWorking(true);
    try {
      await odooData.restoreDepartment(department.id);
      setToast(arabicSource("org_structure.restore_success"));
      await refetch();
    } catch (err) {
      setToast(`${arabicSource("common.error_2")} ${orgStructureErrorMessage(err, arabicSource("org_structure.the_operation_failed"))}`);
    } finally {
      setWorking(false);
    }
  }, [refetch, setToast]);

  return {
    pendingDelete, requestDelete, cancelPendingDelete, confirmPendingDelete,
    restoreDepartment, working,
  };
};
