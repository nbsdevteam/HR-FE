import { useCallback, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { arabicSource } from "@/i18n/source";

export const useConfigEdits = (refetchConfigs: () => void, showToast: (message: string) => void) => {
  const [configEdits, setConfigEdits] = useState<Record<string, any>>({});

  const setConfigEdit = useCallback((configId: string, value: any) => {
    setConfigEdits((prev) => ({ ...prev, [configId]: value }));
  }, []);

  const saveConfigValue = useCallback(async (configId: string, value: any) => {
    try {
      await odooData.updateConfig(configId, value);
      refetchConfigs();
      showToast(arabicSource("settings.the_setting_was_saved_successfully"));
      setConfigEdits((prev) => {
        const newEdits = { ...prev };
        delete newEdits[configId];
        return newEdits;
      });
    } catch {
      showToast(arabicSource("settings.error_saving_setting"));
    }
  }, [refetchConfigs, showToast]);

  return { configEdits, setConfigEdit, saveConfigValue };
};
