import { useState, useCallback } from "react";
import * as odooData from "@/shared/api/odooData";
import { useOdooMutation } from "@/shared/hooks/useOdooMutation";
import { localizedAlert } from "@/i18n/native";
import { arabicSource } from "@/i18n/source";
import type { Employee } from "../types";
import { errorMessage } from "../utils/errorMessage";
import { stripDataUrlPrefix } from "../utils/photoDataUrl";
import { useDeviceEnrollmentSync, useDeviceRemovalSync } from "./useDeviceEnrollmentSync";

/**
 * Deactivate/reactivate are the reversible §5/§7 lifecycle actions — distinct
 * from the hard-terminate dialog (`useEmployeeTermination`) and from the
 * hard-archive `exited` path (`useEmployeeDeleteFlow`). Deactivate removes the
 * employee from the terminal and reports it; reactivate un-archives them and
 * re-enrols whatever the backend reports as still `pending` (fingerprints and
 * cards are wiped by the removal and must be enrolled again — a card number
 * can't be auto-resent since Odoo never stores it, hand-off §7).
 */
export const useEmployeeStatusActions = (refetch: () => void) => {
  const [workingId, setWorkingId] = useState<string | null>(null);

  const deactivateMutation = useOdooMutation(
    (employeeId: string) => odooData.setEmployeeStatus(employeeId, "inactive"),
    "employees",
  );
  const restoreEmployeeMutation = useOdooMutation(
    (employeeId: string) => odooData.restoreEmployee(employeeId),
    "employees",
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
      localizedAlert(arabicSource("employees.error_deactivating_employee") + " " + errorMessage(error));
    }
    setWorkingId(null);
  }, [deactivateMutation.mutateAsync, refetch, runRemoval]);

  const handleRestoreEmployee = useCallback(async (employee: Employee) => {
    // Held through the whole sequence (status flip *and* the device round
    // trip) — the backend refuses combining a reactivate with an edit in the
    // same call, and this keeps the Edit button locked out for exactly as
    // long as that refusal would otherwise bite (hand-off §7).
    setWorkingId(employee.dbId);
    try {
      const restored = await restoreEmployeeMutation.mutateAsync(employee.dbId);
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
    } catch (error: unknown) {
      localizedAlert(arabicSource("employees.error_restoring_employee") + " " + errorMessage(error));
    }
    setWorkingId(null);
  }, [refetch, restoreEmployeeMutation.mutateAsync, runEnrollment]);

  return { handleDeactivateEmployee, handleRestoreEmployee, workingId };
};
