import { useCallback, useMemo } from "react";
import * as odooData from "@/shared/api/odooData";
import { useOdooMutation } from "@/shared/hooks/useOdooMutation";
import { localizedAlert } from "@/i18n/native";
import { exitProcessErrorMessage } from "../utils/exitProcessErrorMessage";

// Every decision can move the section, the process blockers and the e-sign summary.
const CLEARANCE_KEYS = ["exitProcesses", "exitChecklist"];

/** Each action resolves true when the backend accepted it, so a dialog knows to close. */
export type ExitClearanceActions = {
  approve: (sectionId: string) => Promise<boolean>;
  rejectSection: (sectionId: string, comment: string) => Promise<boolean>;
  sign: (signatureId: string, typedName: string, notes: string) => Promise<boolean>;
  rejectSignature: (signatureId: string, reason: string) => Promise<boolean>;
  resend: (signatureId: string) => Promise<boolean>;
};

/**
 * The clearance-section decisions: approving, rejecting, signing and resending.
 * Who may do what, and in which order, is enforced by the backend; this only
 * sends the request and reports the backend's `error_code` as a localized alert.
 */
export const useExitClearanceActions = (): ExitClearanceActions => {
  const approveMutation = useOdooMutation(
    (sectionId: string) => odooData.approveClearanceSection(sectionId),
    CLEARANCE_KEYS,
  );
  const rejectSectionMutation = useOdooMutation(
    (variables: { id: string; comment: string }) =>
      odooData.rejectClearanceSection(variables.id, variables.comment),
    CLEARANCE_KEYS,
  );
  const signMutation = useOdooMutation(
    (variables: { id: string; typedName: string; notes: string }) =>
      odooData.signExitSignature(variables.id, {
        typed_name: variables.typedName,
        notes: variables.notes || undefined,
      }),
    CLEARANCE_KEYS,
  );
  const rejectSignatureMutation = useOdooMutation(
    (variables: { id: string; reason: string }) =>
      odooData.rejectExitSignature(variables.id, variables.reason),
    CLEARANCE_KEYS,
  );
  const resendMutation = useOdooMutation(
    (signatureId: string) => odooData.resendExitSignature(signatureId),
    CLEARANCE_KEYS,
  );

  const attempt = useCallback(async (run: () => Promise<unknown>): Promise<boolean> => {
    try {
      await run();
      return true;
    } catch (error: unknown) {
      localizedAlert(exitProcessErrorMessage(error, "lifecycle.exit_error_clearance_action_failed"));
      return false;
    }
  }, []);

  const approve = useCallback(
    (sectionId: string) => attempt(() => approveMutation.mutateAsync(sectionId)),
    [attempt, approveMutation.mutateAsync],
  );
  const rejectSection = useCallback(
    (id: string, comment: string) => attempt(() => rejectSectionMutation.mutateAsync({ id, comment })),
    [attempt, rejectSectionMutation.mutateAsync],
  );
  const sign = useCallback(
    (id: string, typedName: string, notes: string) =>
      attempt(() => signMutation.mutateAsync({ id, typedName, notes })),
    [attempt, signMutation.mutateAsync],
  );
  const rejectSignature = useCallback(
    (id: string, reason: string) => attempt(() => rejectSignatureMutation.mutateAsync({ id, reason })),
    [attempt, rejectSignatureMutation.mutateAsync],
  );
  const resend = useCallback(
    (signatureId: string) => attempt(() => resendMutation.mutateAsync(signatureId)),
    [attempt, resendMutation.mutateAsync],
  );

  return useMemo(
    () => ({ approve, rejectSection, sign, rejectSignature, resend }),
    [approve, rejectSection, sign, rejectSignature, resend],
  );
};
