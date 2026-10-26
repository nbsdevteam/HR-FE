import { useCallback, useMemo } from "react";
import * as odooData from "@/shared/api/odooData";
import { useOdooMutation } from "@/shared/hooks/useOdooMutation";
import { localizedAlert } from "@/i18n/native";
import { exitProcessErrorMessage } from "../utils/exitProcessErrorMessage";
import { EXIT_QUERY_KEYS } from "../utils/exitQueryKeys";

/** Each action resolves true when the backend accepted it, so a dialog knows to close. */
export type ExitDecisionActions = {
  approve: (exitId: string, comment: string) => Promise<boolean>;
  reject: (exitId: string, comment: string) => Promise<boolean>;
  recalculate: (exitId: string) => Promise<boolean>;
  confirmSettlement: (exitId: string) => Promise<boolean>;
  reopenSettlement: (exitId: string) => Promise<boolean>;
  issueLink: (exitId: string) => Promise<boolean>;
};

/**
 * The approval decisions, the settlement statement's lifecycle (recalculate,
 * confirm, reopen) and a new signing link. Who may act, and in which order, is
 * enforced by the backend; this only sends the request and reports its
 * `error_code` as a localized alert.
 */
export const useExitDecisionActions = (): ExitDecisionActions => {
  const approveMutation = useOdooMutation(
    (variables: { id: string; comment: string }) => odooData.approveExit(variables.id, variables.comment || undefined),
    EXIT_QUERY_KEYS,
  );
  const rejectMutation = useOdooMutation(
    (variables: { id: string; comment: string }) => odooData.rejectExit(variables.id, variables.comment),
    EXIT_QUERY_KEYS,
  );
  const recalculateMutation = useOdooMutation(
    (id: string) => odooData.fetchExitSettlement(id, { recalculate: true }),
    EXIT_QUERY_KEYS,
  );
  const confirmMutation = useOdooMutation(
    (id: string) => odooData.confirmExitSettlement(id),
    EXIT_QUERY_KEYS,
  );
  const reopenMutation = useOdooMutation(
    (id: string) => odooData.reopenExitSettlement(id),
    EXIT_QUERY_KEYS,
  );
  const issueLinkMutation = useOdooMutation(
    (id: string) => odooData.issueExitSignature(id),
    EXIT_QUERY_KEYS,
  );

  const attempt = useCallback(async (run: () => Promise<unknown>): Promise<boolean> => {
    try {
      await run();
      return true;
    } catch (error: unknown) {
      localizedAlert(exitProcessErrorMessage(error, "lifecycle.exit_error_decision_failed"));
      return false;
    }
  }, []);

  const approve = useCallback(
    (id: string, comment: string) => attempt(() => approveMutation.mutateAsync({ id, comment })),
    [attempt, approveMutation.mutateAsync],
  );
  const reject = useCallback(
    (id: string, comment: string) => attempt(() => rejectMutation.mutateAsync({ id, comment })),
    [attempt, rejectMutation.mutateAsync],
  );
  const recalculate = useCallback(
    (id: string) => attempt(() => recalculateMutation.mutateAsync(id)),
    [attempt, recalculateMutation.mutateAsync],
  );
  const confirmSettlement = useCallback(
    (id: string) => attempt(() => confirmMutation.mutateAsync(id)),
    [attempt, confirmMutation.mutateAsync],
  );
  const reopenSettlement = useCallback(
    (id: string) => attempt(() => reopenMutation.mutateAsync(id)),
    [attempt, reopenMutation.mutateAsync],
  );
  const issueLink = useCallback(
    (id: string) => attempt(() => issueLinkMutation.mutateAsync(id)),
    [attempt, issueLinkMutation.mutateAsync],
  );

  return useMemo(
    () => ({ approve, reject, recalculate, confirmSettlement, reopenSettlement, issueLink }),
    [approve, reject, recalculate, confirmSettlement, reopenSettlement, issueLink],
  );
};
