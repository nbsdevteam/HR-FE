import { useCallback, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import type { DbLeaveType } from "@/shared/hooks";
import { INITIAL_NEW_LEAVE_TYPE } from "../constants/settings";
import type { NewLeaveTypeForm } from "../types";

export const useLeaveTypeManagement = (refetchLeaveTypes: () => void, showToast: (message: string) => void) => {
  const [showNewLeaveTypeForm, setShowNewLeaveTypeForm] = useState(false);
  const [newLeaveType, setNewLeaveType] = useState<NewLeaveTypeForm>({ ...INITIAL_NEW_LEAVE_TYPE });

  const updateNewLeaveType = useCallback((patch: Partial<NewLeaveTypeForm>) => {
    setNewLeaveType((prev) => ({ ...prev, ...patch }));
  }, []);

  const createLeaveType = useCallback(async () => {
    try {
      // Every `NewLeaveTypeForm` field now matches its `/leave/types/create`
      // payload key 1:1, so the full form is sent as-is — blank/off fields
      // resolve to the backend's own sensible defaults (§4 of the hand-off).
      await odooData.createLeaveType({
        ...newLeaveType,
        name: newLeaveType.name_en || newLeaveType.name_ar,
      });
      setShowNewLeaveTypeForm(false);
      setNewLeaveType({ ...INITIAL_NEW_LEAVE_TYPE });
      await refetchLeaveTypes();
      showToast("Saved");
    } catch (e: any) {
      showToast(e?.message || "Failed to create leave type");
    }
  }, [newLeaveType, refetchLeaveTypes, showToast]);

  const toggleLeaveTypeActive = useCallback(async (leaveType: DbLeaveType) => {
    try {
      await odooData.updateLeaveType(leaveType.id, { is_active: !leaveType.is_active });
      await refetchLeaveTypes();
    } catch (e: any) {
      showToast(e?.message || "Failed to update leave type");
    }
  }, [refetchLeaveTypes, showToast]);

  // Annual entitlement now lives on the leave type, not a global Settings key
  // (backend hand-off §2) — this is the only field editable after creation so far.
  const updateLeaveTypeDays = useCallback(async (leaveTypeId: string, defaultDaysPerYear: number) => {
    try {
      await odooData.updateLeaveType(leaveTypeId, { default_days_per_year: defaultDaysPerYear });
      await refetchLeaveTypes();
    } catch (e: any) {
      showToast(e?.message || "Failed to update leave type");
    }
  }, [refetchLeaveTypes, showToast]);

  const deleteLeaveTypeEntry = useCallback(async (leaveTypeId: string) => {
    try {
      await odooData.deleteLeaveType(leaveTypeId);
      await refetchLeaveTypes();
    } catch (e: any) {
      showToast(e?.message || "Failed to delete leave type");
    }
  }, [refetchLeaveTypes, showToast]);

  return {
    showNewLeaveTypeForm, setShowNewLeaveTypeForm,
    newLeaveType, updateNewLeaveType,
    createLeaveType, toggleLeaveTypeActive, deleteLeaveTypeEntry, updateLeaveTypeDays,
  };
};
