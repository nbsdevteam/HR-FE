import { useState, useCallback } from "react";
import * as odooData from "@/shared/api/odooData";
import { useOdooMutation } from "@/shared/hooks/useOdooMutation";
import { localizedAlert } from "@/i18n/native";
import { arabicSource } from "@/i18n/source";
import { errorMessage } from "../utils/errorMessage";

/**
 * Suspend and restore are now distinct row actions from the delete/archive
 * flow (FE hand-off §4.2) — suspend flags an employee on hold who is expected
 * back, restore un-archives one the archive flow already removed from every
 * list. Both are simple enough not to need a confirm modal of their own.
 */
export const useEmployeeStatusActions = (refetch: () => void) => {
  const [workingId, setWorkingId] = useState<string | null>(null);

  const suspendEmployeeMutation = useOdooMutation(
    (employeeId: string) => odooData.setEmployeeStatus(employeeId, "suspended"),
    "employees",
  );
  const restoreEmployeeMutation = useOdooMutation(
    (employeeId: string) => odooData.restoreEmployee(employeeId),
    "employees",
  );

  const handleSuspendEmployee = useCallback(async (employeeId: string) => {
    setWorkingId(employeeId);
    try {
      await suspendEmployeeMutation.mutateAsync(employeeId);
      refetch();
    } catch (error: unknown) {
      localizedAlert(arabicSource("employees.error_suspending_employee") + " " + errorMessage(error));
    }
    setWorkingId(null);
  }, [refetch, suspendEmployeeMutation.mutateAsync]);

  const handleRestoreEmployee = useCallback(async (employeeId: string) => {
    setWorkingId(employeeId);
    try {
      await restoreEmployeeMutation.mutateAsync(employeeId);
      refetch();
    } catch (error: unknown) {
      localizedAlert(arabicSource("employees.error_restoring_employee") + " " + errorMessage(error));
    }
    setWorkingId(null);
  }, [refetch, restoreEmployeeMutation.mutateAsync]);

  return { handleRestoreEmployee, handleSuspendEmployee, workingId };
};
