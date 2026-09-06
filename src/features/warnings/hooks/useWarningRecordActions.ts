import { useCallback, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { arabicSource } from "@/i18n/source";
import { useOdooMutation } from "@/shared/hooks";
import type { DbWarning } from "@/shared/hooks";
import { statusLabelToKey } from "../utils/warningKeyMapping";

type UseWarningRecordActionsArgs = {
  warningStatuses: string[];
  // No longer called directly: `updateStatusMutation`/`deleteMutation` below
  // invalidate the "warnings" cache key themselves, which this arg's list
  // already reads from — kept in the type so existing callers can keep
  // passing it unchanged.
  refetch: () => void;
  setToast: (message: string | null) => void;
};

export const useWarningRecordActions = ({ warningStatuses, setToast }: UseWarningRecordActionsArgs) => {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const updateStatusMutation = useOdooMutation<DbWarning, { warningId: string; status: string }>(
    ({ warningId, status }) => odooData.updateWarning(warningId, { status }),
    "warnings",
  );
  const deleteMutation = useOdooMutation<unknown, string>(
    (warningId) => odooData.deleteWarning(warningId),
    "warnings",
  );

  const handleStatusChange = useCallback(async (warningId: string, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({ warningId, status: statusLabelToKey(newStatus, warningStatuses) });
      setToast(`${arabicSource("warnings.status_changed_to")}${newStatus}"`);
    } catch (err) {
      setToast(`${arabicSource("common.error_2")} ${err instanceof Error ? err.message : arabicSource("warnings.update_failed")}`);
    }
  }, [setToast, updateStatusMutation, warningStatuses]);

  const requestDelete = useCallback((warningId: string) => {
    setPendingDeleteId(warningId);
  }, []);

  const cancelDelete = useCallback(() => {
    setPendingDeleteId(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!pendingDeleteId) return;
    setDeleting(true);
    try {
      await deleteMutation.mutateAsync(pendingDeleteId);
      setToast(arabicSource("warnings.the_alarm_has_been_successfully_deleted"));
    } catch (err) {
      setToast(`${arabicSource("common.error_2")} ${err instanceof Error ? err.message : arabicSource("warnings.delete_failed")}`);
    } finally {
      setDeleting(false);
      setPendingDeleteId(null);
    }
  }, [deleteMutation, pendingDeleteId, setToast]);

  return {
    handleStatusChange,
    requestDelete,
    cancelDelete,
    confirmDelete,
    pendingDeleteId,
    deleting,
  };
};
