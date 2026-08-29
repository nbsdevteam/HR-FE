import { useState, useCallback } from "react";
import * as odooData from "@/shared/api/odooData";
import { arabicSource } from "@/i18n/source";
import type { HrApiError } from "@/shared/api/client";
import type { DbPosition } from "@/shared/hooks";
import type { PendingDesignationDelete } from "../types";
import { orgStructureErrorMessage } from "../utils/orgStructureErrorMessage";

type UseDesignationDeleteRestoreArgs = {
  refetch: () => void | Promise<void>;
  setToast: (message: string | null) => void;
};

/**
 * Archive/restore for the job-title admin screen (backend §6). A first
 * archive attempt that's refused with `designation_in_use` re-arms the same
 * pending state with the returned counts, so the confirm modal can re-prompt
 * for `force: true` instead of silently failing.
 */
export const useDesignationDeleteRestore = ({ refetch, setToast }: UseDesignationDeleteRestoreArgs) => {
  const [pendingDelete, setPendingDelete] = useState<PendingDesignationDelete | null>(null);
  const [working, setWorking] = useState(false);

  const requestDelete = useCallback((designation: DbPosition) => {
    setPendingDelete({ designation, guard: null });
  }, []);

  const cancelPendingDelete = useCallback(() => {
    setPendingDelete(null);
  }, []);

  const confirmPendingDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setWorking(true);
    try {
      await odooData.deleteDesignation(pendingDelete.designation.id, { force: Boolean(pendingDelete.guard) });
      setToast(arabicSource("org_structure.archive_success"));
      setPendingDelete(null);
      await refetch();
    } catch (err) {
      const apiError = err as HrApiError | undefined;
      if (apiError?.code === "designation_in_use") {
        setPendingDelete({
          designation: pendingDelete.designation,
          guard: {
            employeeCount: Number(apiError.details?.employee_count) || 0,
            reportCount: Number(apiError.details?.report_count) || 0,
          },
        });
      } else {
        setToast(`${arabicSource("common.error_2")} ${orgStructureErrorMessage(err, arabicSource("org_structure.the_operation_failed"))}`);
      }
    } finally {
      setWorking(false);
    }
  }, [pendingDelete, refetch, setToast]);

  const restoreDesignation = useCallback(async (designation: DbPosition) => {
    setWorking(true);
    try {
      await odooData.restoreDesignation(designation.id);
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
    restoreDesignation, working,
  };
};
