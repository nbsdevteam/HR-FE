import { useCallback } from "react";
import { AnimatePresence } from "motion/react";
import { Button, LoadingState } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { useLeaveExcuseReview } from "../hooks/useLeaveExcuseReview";
import LeaveExcuseDecisionModal from "./LeaveExcuseDecisionModal";
import LeaveExcuseQueueTable from "./LeaveExcuseQueueTable";

/**
 * Manager/HR review screen for insufficient-balance excuse requests (backend
 * `lugal_hr` v1.16.0 §4). Visible to every viewer, same as the rest of this
 * app's tabs — the backend, not this screen, enforces `hr.leave.team_approve`/
 * `hr.leave.hr_approve` on each scope.
 */
const ExcusesTab = () => {
  const {
    scope,
    setScope,
    items,
    loading,
    decidingItem,
    decidingAction,
    handleOpenDecision,
    handleCloseDecision,
    handleDecided,
  } = useLeaveExcuseReview();

  const handleSelectTeam = useCallback(() => setScope("team"), [setScope]);
  const handleSelectHr = useCallback(() => setScope("hr"), [setScope]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="toggle" active={scope === "team"} onClick={handleSelectTeam}>
          {arabicSource("leave.excuse_scope_team")}
        </Button>
        <Button variant="toggle" active={scope === "hr"} onClick={handleSelectHr}>
          {arabicSource("leave.excuse_scope_hr")}
        </Button>
      </div>

      {loading ? (
        <LoadingState
          wrapperClassName="flex items-center justify-center h-32"
          iconClassName="w-6 h-6 text-primary animate-spin"
        />
      ) : (
        <LeaveExcuseQueueTable items={items} onDecide={handleOpenDecision} />
      )}

      <AnimatePresence>
        {decidingItem && (
          <LeaveExcuseDecisionModal
            item={decidingItem}
            action={decidingAction}
            scope={scope}
            onClose={handleCloseDecision}
            onDecided={handleDecided}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExcusesTab;
