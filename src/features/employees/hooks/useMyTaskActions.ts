import { useExitDecisionActions } from "./useExitDecisionActions";
import { useExitProcessActions } from "./useExitProcessActions";
import { useExitNavigation } from "./useExitRedirect";

/** My tasks never opens a process from a duplicate-create prompt, so the opener is a no-op. */
const IGNORE_OPEN = (): void => undefined;

/**
 * Everything a My tasks row can do: the stage moves, ticking a clearance line,
 * the approval and settlement decisions, and opening the record. Each is the
 * same call the End of Service screen makes, so a task and the record always agree.
 */
export const useMyTaskActions = () => {
  const { busy, transition, toggleChecklist } = useExitProcessActions(IGNORE_OPEN);
  const decision = useExitDecisionActions();
  const { openExit } = useExitNavigation();
  return { busy, decision, openExit, toggleChecklist, transition };
};

export type MyTaskActionsBundle = ReturnType<typeof useMyTaskActions>;
