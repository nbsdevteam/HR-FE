import { useCallback } from "react";
import * as odooData from "@/shared/api/odooData";
import { localizedConfirm } from "@/i18n/native";
import { arabicSource } from "@/i18n/source";
import { statusLabelToKey } from "../utils/warningKeyMapping";

type UseWarningRecordActionsArgs = {
  warningStatuses: string[];
  refetch: () => void;
  setToast: (message: string | null) => void;
};

export const useWarningRecordActions = ({ warningStatuses, refetch, setToast }: UseWarningRecordActionsArgs) => {
  const handleStatusChange = useCallback(async (warningId: string, newStatus: string) => {
    try {
      await odooData.updateWarning(warningId, { status: statusLabelToKey(newStatus, warningStatuses) });
      setToast(`${arabicSource("warnings.status_changed_to")}${newStatus}"`);
      refetch();
    } catch (err) {
      setToast(`${arabicSource("common.error_2")} ${err instanceof Error ? err.message : arabicSource("warnings.update_failed")}`);
    }
  }, [refetch, setToast, warningStatuses]);

  const handleDelete = useCallback(async (warningId: string) => {
    if (!localizedConfirm(arabicSource("warnings.are_you_sure_you_want_to_delete_this_alarm"))) return;

    try {
      await odooData.deleteWarning(warningId);
      setToast(arabicSource("warnings.the_alarm_has_been_successfully_deleted"));
      refetch();
    } catch (err) {
      setToast(`${arabicSource("common.error_2")} ${err instanceof Error ? err.message : arabicSource("warnings.delete_failed")}`);
    }
  }, [refetch, setToast]);

  return { handleStatusChange, handleDelete };
};
