import { useCallback, useMemo } from "react";
import { motion } from "motion/react";
import { arabicSource } from "@/i18n/source";
import { useEmployeeLifecycle } from "@/shared/hooks";
import { useExitNavigation } from "../hooks/useExitRedirect";
import { canEditEndOfService, canStartEndOfService } from "../utils/lifecycleActions";
import EmployeeLifecycleContracts from "./EmployeeLifecycleContracts";
import EmployeeLifecycleCounts, { type LifecycleCountRow } from "./EmployeeLifecycleCounts";
import EmployeeLifecycleExitCard from "./EmployeeLifecycleExitCard";
import EmployeeLifecycleTimeline from "./EmployeeLifecycleTimeline";

type EmployeeLifecycleTabProps = {
  employeeId: string;
};

/**
 * The profile's Life cycle tab, built entirely from the backend lifecycle
 * summary: contract state, counts, the End of Service block, the actions the
 * backend offers and the timeline. Nothing here derives contract or exit state
 * in the browser, so a contract expiring or an exit completing only needs the
 * summary refetched.
 */
const EmployeeLifecycleTab = ({ employeeId }: EmployeeLifecycleTabProps) => {
  const { summary, loading, error } = useEmployeeLifecycle(employeeId);
  const { openExit, startExit } = useExitNavigation();

  const documentRows = useMemo<LifecycleCountRow[]>(() => summary ? [
    { key: "total", label: arabicSource("common.total"), value: summary.documents.total },
    { key: "with_attachment", label: arabicSource("employees.lifecycle_with_attachment"), value: summary.documents.with_attachment },
  ] : [], [summary]);

  const custodyRows = useMemo<LifecycleCountRow[]>(() => summary ? [
    { key: "total", label: arabicSource("common.total"), value: summary.custody.total },
    { key: "outstanding", label: arabicSource("employees.lifecycle_custody_outstanding"), value: summary.custody.outstanding },
  ] : [], [summary]);

  const handleStart = useCallback((): void => {
    startExit(employeeId);
  }, [employeeId, startExit]);

  if (loading) {
    return <p className="p-6 text-muted-foreground" style={{ fontSize: 13 }}>{arabicSource("common.loading")}</p>;
  }
  if (error || !summary) {
    return <p className="p-6 text-destructive" style={{ fontSize: 13 }}>{arabicSource("employees.lifecycle_load_failed")}</p>;
  }

  return (
    <motion.div
      key="lifecycle"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-6 space-y-4"
    >
      <EmployeeLifecycleExitCard
        exit={summary.exit}
        canStart={canStartEndOfService(summary.actions)}
        canEdit={canEditEndOfService(summary.actions)}
        onStart={handleStart}
        onOpen={openExit}
      />
      <EmployeeLifecycleContracts current={summary.contract.current} history={summary.contract.history} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EmployeeLifecycleCounts title={arabicSource("lifecycle.documentation")} rows={documentRows} />
        <EmployeeLifecycleCounts title={arabicSource("shared.receivables")} rows={custodyRows} />
      </div>
      <EmployeeLifecycleTimeline entries={summary.timeline} />
    </motion.div>
  );
};

export default EmployeeLifecycleTab;
