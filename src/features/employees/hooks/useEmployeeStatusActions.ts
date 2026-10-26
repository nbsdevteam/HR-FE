import { useState, useCallback } from "react";
import * as odooData from "@/shared/api/odooData";
import type { EmployeeRestoreResult, RehireContractInput } from "@/shared/api/odooData";
import type { DbEmployeeContract } from "@/shared/hooks";
import { EMPLOYEE_LIFECYCLE_KEY } from "@/shared/hooks";
import { useOdooMutation } from "@/shared/hooks/useOdooMutation";
import { localizedAlert } from "@/i18n/native";
import { arabicSource } from "@/i18n/source";
import type { Employee, ExitRedirectRequester } from "../types";
import { errorMessage } from "../utils/errorMessage";
import { isRehireRequired } from "../utils/exitRedirect";
import { stripDataUrlPrefix } from "../utils/photoDataUrl";
import { useDeviceEnrollmentSync, useDeviceRemovalSync } from "./useDeviceEnrollmentSync";

/** What the Rehire dialog is showing: the employee being restored, and the contract once it exists. */
export type RehireState = { employee: Employee; contract: DbEmployeeContract | null };

const RESTORE_KEYS = ["employees", EMPLOYEE_LIFECYCLE_KEY, "contracts"];
const DEACTIVATE_KEYS = ["employees", EMPLOYEE_LIFECYCLE_KEY];

/**
 * Deactivate/reactivate are the reversible §5/§7 lifecycle actions — distinct
 * from the hard-terminate dialog (`useEmployeeTermination`) and from the
 * hard-archive `exited` path (`useEmployeeDeleteFlow`). Deactivate removes the
 * employee from the terminal and reports it; reactivate un-archives them and
 * re-enrols whatever the backend reports as still `pending` (fingerprints and
 * cards are wiped by the removal and must be enrolled again — a card number
 * can't be auto-resent since Odoo never stores it, hand-off §7).
 *
 * Two refusals leave the plain flow. An employee with HR history cannot be
 * deactivated here — the backend answers `use_end_of_service` /
 * `exit_process_open` and `requestExitRedirect` sends the user to End of
 * Service. And restoring someone whose End of Service completed answers
 * `use_rehire` until a new contract start date comes with the request, which
 * the Rehire dialog collects.
 */
export const useEmployeeStatusActions = (refetch: () => void, requestExitRedirect: ExitRedirectRequester) => {
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [rehire, setRehire] = useState<RehireState | null>(null);
  const [rehireSaving, setRehireSaving] = useState(false);

  const deactivateMutation = useOdooMutation(
    (employeeId: string) => odooData.setEmployeeStatus(employeeId, "inactive"),
    DEACTIVATE_KEYS,
  );
  const restoreEmployeeMutation = useOdooMutation(
    (variables: { employeeId: string; contract?: RehireContractInput }) =>
      odooData.restoreEmployee(variables.employeeId, { contract: variables.contract }),
    RESTORE_KEYS,
  );
  const { runRemoval } = useDeviceRemovalSync();
  const { runEnrollment } = useDeviceEnrollmentSync();

  const handleDeactivateEmployee = useCallback(async (employee: Employee) => {
    setWorkingId(employee.dbId);
    try {
      await deactivateMutation.mutateAsync(employee.dbId);
      refetch();
      if (employee.deviceEmployeeNo) {
        await runRemoval(employee.dbId, employee.deviceEmployeeNo);
        refetch();
      }
    } catch (error: unknown) {
      if (!requestExitRedirect(error, employee.dbId, employee.name)) {
        localizedAlert(arabicSource("employees.error_deactivating_employee") + " " + errorMessage(error));
      }
    }
    setWorkingId(null);
  }, [deactivateMutation.mutateAsync, refetch, requestExitRedirect, runRemoval]);

  /** The device round trip after a restore: re-enrol whatever the backend reports as still pending. */
  const reenrollRestored = useCallback(async (employee: Employee, restored: EmployeeRestoreResult) => {
    refetch();
    const enrollment = restored.device_enrollment;
    if (employee.deviceEmployeeNo && enrollment && enrollment.pending.length > 0) {
      const credentials = enrollment.pending.filter(c => c !== "card");
      if (credentials.length > 0) {
        await runEnrollment({
          dbId: employee.dbId,
          deviceEmployeeNo: employee.deviceEmployeeNo,
          mode: "create",
          credentials,
          name: employee.name,
          facePhotoBase64: stripDataUrlPrefix(employee.photo),
        });
        refetch();
      }
    }
  }, [refetch, runEnrollment]);

  const handleRestoreEmployee = useCallback(async (employee: Employee) => {
    // Held through the whole sequence (status flip *and* the device round
    // trip) — the backend refuses combining a reactivate with an edit in the
    // same call, and this keeps the Edit button locked out for exactly as
    // long as that refusal would otherwise bite (hand-off §7).
    setWorkingId(employee.dbId);
    try {
      const restored = await restoreEmployeeMutation.mutateAsync({ employeeId: employee.dbId });
      await reenrollRestored(employee, restored);
    } catch (error: unknown) {
      if (isRehireRequired(error)) {
        setRehire({ employee, contract: null });
      } else {
        localizedAlert(arabicSource("employees.error_restoring_employee") + " " + errorMessage(error));
      }
    }
    setWorkingId(null);
  }, [reenrollRestored, restoreEmployeeMutation.mutateAsync]);

  const handleRehireSubmit = useCallback(async (contract: RehireContractInput) => {
    if (!rehire) return;
    const { employee } = rehire;
    setRehireSaving(true);
    try {
      const restored = await restoreEmployeeMutation.mutateAsync({ employeeId: employee.dbId, contract });
      setRehire({ employee, contract: restored.contract });
      await reenrollRestored(employee, restored);
    } catch (error: unknown) {
      localizedAlert(arabicSource("employees.error_restoring_employee") + " " + errorMessage(error));
    }
    setRehireSaving(false);
  }, [reenrollRestored, rehire, restoreEmployeeMutation.mutateAsync]);

  const handleRehireClose = useCallback(() => setRehire(null), []);

  return {
    handleDeactivateEmployee,
    handleRehireClose,
    handleRehireSubmit,
    handleRestoreEmployee,
    rehire,
    rehireSaving,
    workingId,
  };
};
