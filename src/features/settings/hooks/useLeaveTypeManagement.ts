import { useCallback, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { arabicSource } from "@/i18n/source";
import { type DbLeaveType, type LeaveBalanceResetPolicy, useOdooMutation } from "@/shared/hooks";
import { INITIAL_NEW_LEAVE_TYPE } from "../constants/settings";
import { leaveTypeErrorMessage } from "../utils/leaveTypeErrorMessage";
import { diffLeaveTypeForm, leaveTypeToEditForm } from "../utils/leaveTypeEditForm";
import type { NewLeaveTypeForm } from "../types";

export const useLeaveTypeManagement = (refetchLeaveTypes: () => void, showToast: (message: string) => void) => {
  const [showNewLeaveTypeForm, setShowNewLeaveTypeForm] = useState(false);
  const [newLeaveType, setNewLeaveType] = useState<NewLeaveTypeForm>({ ...INITIAL_NEW_LEAVE_TYPE });
  const [editingLeaveType, setEditingLeaveType] = useState<DbLeaveType | null>(null);
  const [editLeaveType, setEditLeaveType] = useState<NewLeaveTypeForm>({ ...INITIAL_NEW_LEAVE_TYPE });
  const [editLeaveTypeInitial, setEditLeaveTypeInitial] = useState<NewLeaveTypeForm>({ ...INITIAL_NEW_LEAVE_TYPE });
  // accrual_days_per_month always starts at 0 (the read never returns it — see
  // leaveTypeToEditForm), so clearing it back to 0 is invisible to a plain
  // diff. Track the touch separately so a deliberate clear still reaches save.
  const [editAccrualTouched, setEditAccrualTouched] = useState(false);

  const createLeaveTypeMutation = useOdooMutation(
    (payload: Record<string, unknown>) => odooData.createLeaveType(payload),
    "leaveTypes",
  );
  const updateLeaveTypeMutation = useOdooMutation(
    ({ leaveTypeId, patch }: { leaveTypeId: string; patch: Record<string, unknown> }) =>
      odooData.updateLeaveType(leaveTypeId, patch),
    "leaveTypes",
  );
  const deleteLeaveTypeMutation = useOdooMutation(
    (leaveTypeId: string) => odooData.deleteLeaveType(leaveTypeId),
    "leaveTypes",
  );

  const updateNewLeaveType = useCallback((patch: Partial<NewLeaveTypeForm>) => {
    setNewLeaveType((prev) => ({ ...prev, ...patch }));
  }, []);

  const createLeaveType = useCallback(async () => {
    try {
      // Every `NewLeaveTypeForm` field now matches its `/leave/types/create`
      // payload key 1:1, so the full form is sent as-is — blank/off fields
      // resolve to the backend's own sensible defaults (§4 of the hand-off).
      await createLeaveTypeMutation.mutateAsync({
        ...newLeaveType,
        name: newLeaveType.name_en || newLeaveType.name_ar,
      });
      setShowNewLeaveTypeForm(false);
      setNewLeaveType({ ...INITIAL_NEW_LEAVE_TYPE });
      await refetchLeaveTypes();
      showToast("Saved");
    } catch (e: any) {
      showToast(leaveTypeErrorMessage(e, "Failed to create leave type"));
    }
  }, [createLeaveTypeMutation, newLeaveType, refetchLeaveTypes, showToast]);

  const toggleLeaveTypeActive = useCallback(async (leaveType: DbLeaveType) => {
    try {
      await updateLeaveTypeMutation.mutateAsync({
        leaveTypeId: leaveType.id,
        patch: { is_active: !leaveType.is_active },
      });
      await refetchLeaveTypes();
    } catch (e: any) {
      showToast(leaveTypeErrorMessage(e, "Failed to update leave type"));
    }
  }, [refetchLeaveTypes, showToast, updateLeaveTypeMutation]);

  // Annual entitlement now lives on the leave type, not a global Settings key
  // (backend hand-off §2) — this is the only field editable after creation so far.
  const updateLeaveTypeDays = useCallback(async (leaveTypeId: string, defaultDaysPerYear: number) => {
    try {
      await updateLeaveTypeMutation.mutateAsync({
        leaveTypeId,
        patch: { default_days_per_year: defaultDaysPerYear },
      });
      await refetchLeaveTypes();
    } catch (e: any) {
      showToast(leaveTypeErrorMessage(e, "Failed to update leave type"));
    }
  }, [refetchLeaveTypes, showToast, updateLeaveTypeMutation]);

  // The year-end balance policy has to stay changeable AFTER a type exists —
  // it is the setting the client is expected to flip when their leave policy
  // changes, so it cannot be create-time only. The backend re-stamps the
  // affected allocations on write, hence the refetch: the balances the rest of
  // Settings shows have already moved by the time this resolves.
  const updateLeaveTypeResetPolicy = useCallback(async (leaveTypeId: string, policy: LeaveBalanceResetPolicy) => {
    try {
      await updateLeaveTypeMutation.mutateAsync({
        leaveTypeId,
        patch: { balance_reset_policy: policy },
      });
      await refetchLeaveTypes();
    } catch (e: any) {
      showToast(leaveTypeErrorMessage(e, "Failed to update leave type"));
    }
  }, [refetchLeaveTypes, showToast, updateLeaveTypeMutation]);

  const deleteLeaveTypeEntry = useCallback(async (leaveTypeId: string) => {
    try {
      await deleteLeaveTypeMutation.mutateAsync(leaveTypeId);
      await refetchLeaveTypes();
    } catch (e: any) {
      showToast(leaveTypeErrorMessage(e, "Failed to delete leave type"));
    }
  }, [deleteLeaveTypeMutation, refetchLeaveTypes, showToast]);

  // System rows are fully editable here — only Delete/archive are refused
  // (handled above), never Edit (§1 of the Edit-a-leave-type build spec).
  const openEditLeaveType = useCallback((leaveType: DbLeaveType) => {
    const snapshot = leaveTypeToEditForm(leaveType);
    setEditingLeaveType(leaveType);
    setEditLeaveType(snapshot);
    setEditLeaveTypeInitial(snapshot);
    setEditAccrualTouched(false);
  }, []);

  const updateEditLeaveType = useCallback((patch: Partial<NewLeaveTypeForm>) => {
    if ("accrual_days_per_month" in patch) setEditAccrualTouched(true);
    setEditLeaveType((prev) => ({ ...prev, ...patch }));
  }, []);

  const closeEditLeaveType = useCallback(() => {
    setEditingLeaveType(null);
  }, []);

  const saveEditLeaveType = useCallback(async () => {
    if (!editingLeaveType) return;
    // Only the changed keys go out — an omitted key is left alone server-side,
    // so a no-op edit never overwrites something the admin didn't mean to
    // touch. accrual_days_per_month is force-included once touched, since a
    // deliberate clear-back-to-0 would otherwise look like "no change" (§4).
    const forceKeys = editAccrualTouched
      ? new Set<Extract<keyof NewLeaveTypeForm, string>>(["accrual_days_per_month"])
      : undefined;
    const patch = diffLeaveTypeForm(editLeaveTypeInitial, editLeaveType, forceKeys);
    if (Object.keys(patch).length === 0) {
      setEditingLeaveType(null);
      return;
    }
    try {
      await updateLeaveTypeMutation.mutateAsync({ leaveTypeId: editingLeaveType.id, patch });
      setEditingLeaveType(null);
      await refetchLeaveTypes();
      showToast(arabicSource("settings.leave_type_updated"));
    } catch (e: any) {
      showToast(leaveTypeErrorMessage(e, "Failed to update leave type"));
    }
  }, [editAccrualTouched, editingLeaveType, editLeaveType, editLeaveTypeInitial, refetchLeaveTypes, showToast, updateLeaveTypeMutation]);

  return {
    showNewLeaveTypeForm, setShowNewLeaveTypeForm,
    newLeaveType, updateNewLeaveType,
    createLeaveType, toggleLeaveTypeActive, deleteLeaveTypeEntry, updateLeaveTypeDays,
    updateLeaveTypeResetPolicy,
    editingLeaveType, editLeaveType, openEditLeaveType, updateEditLeaveType,
    closeEditLeaveType, saveEditLeaveType,
    savingEditLeaveType: updateLeaveTypeMutation.isPending,
  };
};
