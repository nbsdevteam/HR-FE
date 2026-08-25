import { useState, useCallback } from "react";
import * as odooData from "@/shared/api/odooData";
import { arabicSource } from "@/i18n/source";
import type { DbReportTemplate } from "@/shared/hooks";
import { reportConfigErrorMessage } from "../utils/reportConfigErrorMessage";

type PendingAction = { template: DbReportTemplate; mode: "archive" | "hardDelete" } | null;

type UseReportConfigDeleteRestoreArgs = {
  refetch: () => void | Promise<void>;
  setToast: (message: string | null) => void;
};

/** Archive/hard-delete/restore actions for the report-configuration admin screen (backend §2.6/§2.7). */
export const useReportConfigDeleteRestore = ({ refetch, setToast }: UseReportConfigDeleteRestoreArgs) => {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [working, setWorking] = useState(false);

  const requestArchive = useCallback((template: DbReportTemplate) => {
    setPendingAction({ template, mode: "archive" });
  }, []);

  const requestHardDelete = useCallback((template: DbReportTemplate) => {
    setPendingAction({ template, mode: "hardDelete" });
  }, []);

  const cancelPendingAction = useCallback(() => {
    setPendingAction(null);
  }, []);

  const confirmPendingAction = useCallback(async () => {
    if (!pendingAction) return;
    setWorking(true);
    try {
      const result = await odooData.deleteReportTemplate(pendingAction.template.id, {
        hard: pendingAction.mode === "hardDelete",
      });
      if (pendingAction.mode === "hardDelete") {
        setToast(`${arabicSource("reports.hard_delete_success")} — ${result.history_detached} ${arabicSource("reports.history_detached_suffix")}`);
      } else {
        setToast(arabicSource("reports.archive_success"));
      }
      setPendingAction(null);
      await refetch();
    } catch (err) {
      setToast(`${arabicSource("common.error_2")} ${reportConfigErrorMessage(err, arabicSource("reports.the_operation_failed"))}`);
    } finally {
      setWorking(false);
    }
  }, [pendingAction, refetch, setToast]);

  const restoreTemplate = useCallback(async (template: DbReportTemplate) => {
    setWorking(true);
    try {
      await odooData.restoreReportTemplate(template.id);
      setToast(arabicSource("reports.restore_success"));
      await refetch();
    } catch (err) {
      setToast(`${arabicSource("common.error_2")} ${reportConfigErrorMessage(err, arabicSource("reports.the_operation_failed"))}`);
    } finally {
      setWorking(false);
    }
  }, [refetch, setToast]);

  return {
    pendingAction, requestArchive, requestHardDelete, cancelPendingAction, confirmPendingAction,
    restoreTemplate, working,
  };
};
