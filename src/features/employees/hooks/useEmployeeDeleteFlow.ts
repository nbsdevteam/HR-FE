import { useState, useCallback } from "react";
import type { DbEmployee } from "@/shared/hooks";
import * as odooData from "@/shared/api/odooData";
import { SYNC_API } from "@/shared/constants";
import { localizedAlert } from "@/i18n/native";
import { arabicSource } from "@/i18n/source";
import type { DeleteEmployeeTarget } from "../types";
import { errorMessage } from "../utils/errorMessage";

export const useEmployeeDeleteFlow = (dbEmployees: DbEmployee[], refetch: () => void) => {
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteEmployeeTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteEmployee = useCallback(async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const dbEmp = dbEmployees.find(e => e.id === deleteConfirm.id);
      if (dbEmp?.device_employee_no) {
        try {
          await fetch(`${SYNC_API}/device/persons/${dbEmp.device_employee_no}`, { method: "DELETE" });
        } catch {
          // Device removal is best-effort.
        }
      }
      await odooData.setEmployeeStatus(deleteConfirm.id, "suspended");
      refetch();
      setDeleteConfirm(null);
    } catch (error: unknown) {
      const message = errorMessage(error);
      console.error("Delete failed:", message);
      localizedAlert(arabicSource("employees.error_deleting_employee") + " " + message);
    }
    setDeleting(false);
  }, [dbEmployees, deleteConfirm, refetch]);

  const closeDeleteModal = useCallback(() => setDeleteConfirm(null), []);

  return {
    closeDeleteModal,
    deleteConfirm,
    deleting,
    handleDeleteEmployee,
    setDeleteConfirm,
  };
};
