import { useCallback, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import type { ExitStatus } from "@/shared/hooks";
import { useOdooMutation } from "@/shared/hooks/useOdooMutation";
import { arabicSource } from "@/i18n/source";
import { localizedAlert, localizedConfirm } from "@/i18n/native";
import type { HrApiError } from "@/shared/api/client";
import type { ExitEditPayload } from "../components/ExitProcessEditPanel";
import { exitErrorCode, exitProcessErrorMessage } from "../utils/exitProcessErrorMessage";

// Completion archives the employee server-side, so the roster refetches too.
const EXIT_KEYS = ["exitProcesses", "exitChecklist"];
const COMPLETION_KEYS = [...EXIT_KEYS, "employees"];

type Variables = { id: string; payload: Record<string, unknown> };

/**
 * The End of Service writes, each reporting its failure through the
 * backend's `error_code`. The state machine and every side effect of a stage
 * (notifications, the employee exit, custody returns) live on the backend; this
 * only sends the request and says what happened.
 */
export const useExitProcessActions = (onOpenProcess: (processId: string) => void) => {
  const [busy, setBusy] = useState(false);

  const createMutation = useOdooMutation(
    (payload: Record<string, unknown>) => odooData.createExitProcess(payload),
    EXIT_KEYS,
  );
  const updateMutation = useOdooMutation(
    (variables: Variables) => odooData.updateExitProcess(variables.id, variables.payload),
    EXIT_KEYS,
  );
  const transitionMutation = useOdooMutation(
    (variables: { id: string; status: ExitStatus }) =>
      odooData.transitionExitProcess(variables.id, variables.status),
    COMPLETION_KEYS,
  );
  const checklistMutation = useOdooMutation(
    (variables: Variables) => odooData.updateExitChecklistLine(variables.id, variables.payload),
    EXIT_KEYS,
  );

  /** Resolves true when created; offers the open process on a duplicate. */
  const createExit = useCallback(async (payload: Record<string, unknown>): Promise<boolean> => {
    setBusy(true);
    try {
      await createMutation.mutateAsync(payload);
      return true;
    } catch (error: unknown) {
      if (exitErrorCode(error) === "open_exit_process_exists") {
        const existing = (error as HrApiError).details?.existing_exit_id;
        if (existing && localizedConfirm(arabicSource("lifecycle.exit_open_existing_confirm"))) {
          onOpenProcess(String(existing));
        }
      } else {
        localizedAlert(exitProcessErrorMessage(error, "lifecycle.exit_error_create_failed"));
      }
      return false;
    } finally {
      setBusy(false);
    }
  }, [createMutation.mutateAsync, onOpenProcess]);

  const transition = useCallback(async (processId: string, status: ExitStatus): Promise<void> => {
    setBusy(true);
    try {
      await transitionMutation.mutateAsync({ id: processId, status });
    } catch (error: unknown) {
      localizedAlert(exitProcessErrorMessage(error, "lifecycle.exit_error_update_failed"));
    } finally {
      setBusy(false);
    }
  }, [transitionMutation.mutateAsync]);

  const saveEdit = useCallback(async (processId: string, payload: ExitEditPayload): Promise<boolean> => {
    setBusy(true);
    try {
      await updateMutation.mutateAsync({ id: processId, payload });
      return true;
    } catch (error: unknown) {
      localizedAlert(exitProcessErrorMessage(error, "lifecycle.exit_error_update_failed"));
      return false;
    } finally {
      setBusy(false);
    }
  }, [updateMutation.mutateAsync]);

  const toggleChecklist = useCallback(async (lineId: string, completed: boolean): Promise<void> => {
    try {
      await checklistMutation.mutateAsync({ id: lineId, payload: { is_completed: completed } });
    } catch (error: unknown) {
      localizedAlert(exitProcessErrorMessage(error, "lifecycle.exit_error_checklist_failed"));
    }
  }, [checklistMutation.mutateAsync]);

  return { busy, createExit, transition, saveEdit, toggleChecklist };
};
