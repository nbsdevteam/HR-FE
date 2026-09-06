import { useCallback, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { arabicSource } from "@/i18n/source";
import { type DbContractType, useOdooMutation } from "@/shared/hooks";
import { INITIAL_NEW_CONTRACT_TYPE } from "../constants/settings";
import type { NewContractTypeForm } from "../types";

/**
 * `refetchContractTypes` is `useSettingsBootstrap()`'s whole-bundle refetch,
 * not the `"contractTypes"`-keyed query these mutations invalidate, so it stays.
 */
export const useContractTypeManagement = (refetchContractTypes: () => void, showToast: (message: string) => void) => {
  const [showNewContractTypeForm, setShowNewContractTypeForm] = useState(false);
  const [newContractType, setNewContractType] = useState<NewContractTypeForm>({ ...INITIAL_NEW_CONTRACT_TYPE });
  const [pendingDeleteContractTypeId, setPendingDeleteContractTypeId] = useState<string | null>(null);
  const [deletingContractType, setDeletingContractType] = useState(false);

  const createContractTypeMutation = useOdooMutation(
    (payload: Record<string, unknown>) => odooData.createContractType(payload),
    "contractTypes",
  );
  const updateContractTypeMutation = useOdooMutation(
    ({ contractTypeId, patch }: { contractTypeId: string; patch: Record<string, unknown> }) =>
      odooData.updateContractType(contractTypeId, patch),
    "contractTypes",
  );
  const deleteContractTypeMutation = useOdooMutation(
    (contractTypeId: string) => odooData.deleteContractType(contractTypeId),
    "contractTypes",
  );

  const updateNewContractType = useCallback((patch: Partial<NewContractTypeForm>) => {
    setNewContractType((prev) => ({ ...prev, ...patch }));
  }, []);

  const createContractTypeEntry = useCallback(async () => {
    if (!newContractType.name_ar || !newContractType.code) return;
    const payload = {
      name_ar: newContractType.name_ar,
      name_en: newContractType.name_en || null,
      code: newContractType.code,
      description: newContractType.description || null,
      default_duration_months: newContractType.default_duration_months,
      is_renewable: newContractType.is_renewable,
      probation_days: newContractType.probation_days,
      notice_period_days: newContractType.notice_period_days,
      sort_order: newContractType.sort_order,
    };
    await createContractTypeMutation.mutateAsync(payload);
    showToast(arabicSource("settings.contract_type_added"));
    setShowNewContractTypeForm(false);
    setNewContractType({ ...INITIAL_NEW_CONTRACT_TYPE });
    refetchContractTypes();
  }, [createContractTypeMutation, newContractType, refetchContractTypes, showToast]);

  const toggleContractTypeActive = useCallback(async (contractType: DbContractType) => {
    await updateContractTypeMutation.mutateAsync({
      contractTypeId: contractType.id,
      patch: { is_active: !contractType.is_active },
    });
    refetchContractTypes();
  }, [refetchContractTypes, updateContractTypeMutation]);

  const requestDeleteContractType = useCallback((contractTypeId: string) => {
    setPendingDeleteContractTypeId(contractTypeId);
  }, []);

  const cancelDeleteContractType = useCallback(() => {
    setPendingDeleteContractTypeId(null);
  }, []);

  const confirmDeleteContractType = useCallback(async () => {
    if (!pendingDeleteContractTypeId) return;
    setDeletingContractType(true);
    try {
      await deleteContractTypeMutation.mutateAsync(pendingDeleteContractTypeId);
      showToast(arabicSource("settings.contract_type_deleted"));
      refetchContractTypes();
    } finally {
      setDeletingContractType(false);
      setPendingDeleteContractTypeId(null);
    }
  }, [deleteContractTypeMutation, pendingDeleteContractTypeId, refetchContractTypes, showToast]);

  return {
    showNewContractTypeForm, setShowNewContractTypeForm,
    newContractType, updateNewContractType,
    createContractTypeEntry, toggleContractTypeActive,
    pendingDeleteContractTypeId, deletingContractType,
    requestDeleteContractType, cancelDeleteContractType, confirmDeleteContractType,
  };
};
