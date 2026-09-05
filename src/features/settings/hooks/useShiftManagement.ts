import { useCallback, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { arabicSource } from "@/i18n/source";
import { type DbShift, useOdooMutation } from "@/shared/hooks";
import { createDefaultShiftDays, shiftStateToPayload, shiftToEditState, updateShiftDay } from "../utils/shiftHelpers";
import type { ShiftDaySchedule, ShiftEditState } from "../types";

export const useShiftManagement = (refetchShifts: () => void, showToast: (message: string) => void) => {
  const [expandedShift, setExpandedShift] = useState<string | null>(null);
  const [editingShift, setEditingShift] = useState<ShiftEditState | null>(null);
  const [showNewShiftForm, setShowNewShiftForm] = useState(false);
  const [pendingDeleteShiftId, setPendingDeleteShiftId] = useState<string | null>(null);
  const [deletingShift, setDeletingShift] = useState(false);
  const [newShiftForm, setNewShiftForm] = useState<ShiftEditState>({
    id: "",
    name: "",
    description: "",
    grace_minutes: 5,
    late_to_absent_hours: 3,
    target_hours_per_day: 8,
    days: createDefaultShiftDays(),
  });

  // `refetchShifts` is `useSettingsBootstrap()`'s whole-bundle refetch, not
  // the `"shifts"`-keyed query this mutation invalidates, so it stays.
  const updateShiftMutation = useOdooMutation(
    ({ shiftId, payload }: { shiftId: string; payload: Record<string, unknown> }) =>
      odooData.updateShift(shiftId, payload),
    "shifts",
  );
  const createShiftMutation = useOdooMutation(
    (payload: Record<string, unknown>) => odooData.createShift(payload),
    "shifts",
  );
  const deleteShiftMutation = useOdooMutation(
    (shiftId: string) => odooData.deleteShift(shiftId),
    "shifts",
  );

  const toggleExpandedShift = useCallback((shiftId: string) => {
    setExpandedShift(prev => (prev === shiftId ? null : shiftId));
  }, []);

  const initEditShift = useCallback((shift: DbShift) => setEditingShift(shiftToEditState(shift)), []);
  const cancelEditShift = useCallback(() => setEditingShift(null), []);

  const updateNewShiftForm = useCallback((patch: Partial<ShiftEditState>) => {
    setNewShiftForm(prev => ({ ...prev, ...patch }));
  }, []);
  const updateNewShiftDay = useCallback((dayKey: string, patch: Partial<ShiftDaySchedule>) => {
    setNewShiftForm(prev => updateShiftDay(prev, dayKey, patch));
  }, []);
  const updateEditingShiftForm = useCallback((patch: Partial<ShiftEditState>) => {
    setEditingShift(prev => (prev ? { ...prev, ...patch } : prev));
  }, []);
  const updateEditingShiftDay = useCallback((dayKey: string, patch: Partial<ShiftDaySchedule>) => {
    setEditingShift(prev => (prev ? updateShiftDay(prev, dayKey, patch) : prev));
  }, []);

  const saveShift = useCallback(async (state: ShiftEditState) => {
    if (!state.name.trim()) {
      showToast(arabicSource("common.you_must_enter_the_name_of_the_shift"));
      return;
    }
    try {
      await updateShiftMutation.mutateAsync({ shiftId: state.id, payload: shiftStateToPayload(state) });
      showToast(arabicSource("settings.the_shift_has_been_saved_successfully"));
      setEditingShift(null);
      refetchShifts();
    } catch {
      showToast(arabicSource("settings.error_saving_the_shift"));
    }
  }, [refetchShifts, showToast, updateShiftMutation]);

  const createShift = useCallback(async (state: ShiftEditState) => {
    if (!state.name.trim()) {
      showToast(arabicSource("common.you_must_enter_the_name_of_the_shift"));
      return;
    }
    try {
      await createShiftMutation.mutateAsync({ ...shiftStateToPayload(state), is_default: false });
      showToast(arabicSource("settings.the_shift_was_created_successfully"));
      setShowNewShiftForm(false);
      setNewShiftForm({
        id: "",
        name: "",
        description: "",
        grace_minutes: 5,
        late_to_absent_hours: 3,
        target_hours_per_day: 8,
        days: createDefaultShiftDays(),
      });
      refetchShifts();
    } catch {
      showToast(arabicSource("settings.error_creating_shift"));
    }
  }, [createShiftMutation, refetchShifts, showToast]);

  const requestDeleteShift = useCallback((shiftId: string) => {
    setPendingDeleteShiftId(shiftId);
  }, []);

  const cancelDeleteShift = useCallback(() => {
    setPendingDeleteShiftId(null);
  }, []);

  const confirmDeleteShift = useCallback(async () => {
    if (!pendingDeleteShiftId) return;
    setDeletingShift(true);
    try {
      await deleteShiftMutation.mutateAsync(pendingDeleteShiftId);
      showToast(arabicSource("settings.the_shift_has_been_successfully_deleted"));
      refetchShifts();
    } catch {
      showToast(arabicSource("settings.error_deleting_shift"));
    } finally {
      setDeletingShift(false);
      setPendingDeleteShiftId(null);
    }
  }, [deleteShiftMutation, pendingDeleteShiftId, refetchShifts, showToast]);

  const setAsDefault = useCallback((_shiftId: string) => {
    // Odoo shifts have no is_default flag on model; mark via description is skipped — no-op toast
    showToast("تعيين الافتراضي غير متاح على Odoo بعد — عيّن القسم/الموظف مباشرة");
  }, [showToast]);

  return {
    expandedShift, toggleExpandedShift,
    editingShift, initEditShift, cancelEditShift, updateEditingShiftForm, updateEditingShiftDay,
    showNewShiftForm, setShowNewShiftForm, newShiftForm, updateNewShiftForm, updateNewShiftDay,
    saveShift, createShift, setAsDefault,
    pendingDeleteShiftId, deletingShift, requestDeleteShift, cancelDeleteShift, confirmDeleteShift,
  };
};
