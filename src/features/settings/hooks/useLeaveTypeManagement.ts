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
      await odooData.createLeaveType({
        name: newLeaveType.name_en || newLeaveType.name_ar,
        name_ar: newLeaveType.name_ar,
        code: newLeaveType.code,
        is_paid: newLeaveType.is_paid,
        default_days_per_year: newLeaveType.default_days_per_year,
        allow_half_day: newLeaveType.allow_half_day,
        requires_attachment: newLeaveType.requires_attachment,
        allow_hourly: newLeaveType.allow_hourly,
        is_carryover_allowed: newLeaveType.is_carryover_allowed,
        max_carryover_days: newLeaveType.max_carryover_days,
        is_encashable: newLeaveType.is_encashable,
        encashment_percentage: newLeaveType.encashment_percentage,
        accrual_method: newLeaveType.accrual_method === "annual" ? "yearly" : newLeaveType.accrual_method,
        // v1.12.9 accrual policy — `/leave/types/create` accepts these directly.
        accrual_enabled: newLeaveType.accrual_enabled,
        accrual_days_per_month: newLeaveType.accrual_days_per_month,
        probation_blocked: newLeaveType.probation_blocked,
        color: newLeaveType.color,
        sort_order: newLeaveType.sort_order,
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
    createLeaveType, toggleLeaveTypeActive, deleteLeaveTypeEntry,
  };
};
