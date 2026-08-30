import { useState, useCallback } from "react";
import { useLeaveExcuseQueue, type DbLeaveExcuseQueueItem, type LeaveExcuseQueueScope } from "@/shared/hooks";

export type LeaveExcuseDecisionAction = "approve" | "reject";

/**
 * Manager/HR excuse review screen state (backend `lugal_hr` v1.16.0 §4) —
 * self-contained (own fetch, own scope toggle, own decision modal) so the
 * Leave page hook doesn't have to grow for a feature most viewers never open.
 */
export const useLeaveExcuseReview = () => {
  const [scope, setScope] = useState<LeaveExcuseQueueScope>("team");
  const [decidingItem, setDecidingItem] = useState<DbLeaveExcuseQueueItem | null>(null);
  const [decidingAction, setDecidingAction] = useState<LeaveExcuseDecisionAction>("approve");

  const { items, loading, refetch } = useLeaveExcuseQueue(scope);

  const handleOpenDecision = useCallback(
    (item: DbLeaveExcuseQueueItem, action: LeaveExcuseDecisionAction) => {
      setDecidingItem(item);
      setDecidingAction(action);
    },
    [],
  );

  const handleCloseDecision = useCallback(() => {
    setDecidingItem(null);
  }, []);

  const handleDecided = useCallback(async () => {
    setDecidingItem(null);
    await refetch();
  }, [refetch]);

  return {
    scope,
    setScope,
    items,
    loading,
    decidingItem,
    decidingAction,
    handleOpenDecision,
    handleCloseDecision,
    handleDecided,
  };
};
