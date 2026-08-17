import { useCallback, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { localizedConfirm } from "@/i18n/native";
import { arabicSource } from "@/i18n/source";
import type { DbContractType } from "@/shared/hooks";
import { INITIAL_NEW_CONTRACT_TYPE } from "../constants/settings";
import type { NewContractTypeForm } from "../types";

export const useContractTypeManagement = (refetchContractTypes: () => void, showToast: (message: string) => void) => {
  const [showNewContractTypeForm, setShowNewContractTypeForm] = useState(false);
  const [newContractType, setNewContractType] = useState<NewContractTypeForm>({ ...INITIAL_NEW_CONTRACT_TYPE });

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
    await odooData.createContractType(payload);
    showToast(arabicSource("settings.contract_type_added"));
    setShowNewContractTypeForm(false);
    setNewContractType({ ...INITIAL_NEW_CONTRACT_TYPE });
    refetchContractTypes();
  }, [newContractType, refetchContractTypes, showToast]);

  const toggleContractTypeActive = useCallback(async (contractType: DbContractType) => {
    await odooData.updateContractType(contractType.id, { is_active: !contractType.is_active });
    refetchContractTypes();
  }, [refetchContractTypes]);

  const deleteContractTypeEntry = useCallback(async (contractTypeId: string) => {
    if (!localizedConfirm(arabicSource("settings.delete_contract_type"))) return;
    await odooData.deleteContractType(contractTypeId);
    showToast(arabicSource("settings.contract_type_deleted"));
    refetchContractTypes();
  }, [refetchContractTypes, showToast]);

  return {
    showNewContractTypeForm, setShowNewContractTypeForm,
    newContractType, updateNewContractType,
    createContractTypeEntry, toggleContractTypeActive, deleteContractTypeEntry,
  };
};
