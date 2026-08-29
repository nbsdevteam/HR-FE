import { useCallback } from "react";
import * as odooData from "@/shared/api/odooData";
import { arabicSource } from "@/i18n/source";
import type { DbSystemModule } from "@/shared/hooks";

export const useSystemModuleToggle = (refetchModules: () => void, showToast: (message: string) => void) => {
  const toggleModule = useCallback(async (module: DbSystemModule) => {
    try {
      await odooData.updateModule(module.id, !module.is_enabled);
      refetchModules();
      showToast(`${arabicSource("common.done")} ${!module.is_enabled ? arabicSource("common.activate") : arabicSource("settings.disabled")} ${arabicSource("settings.feature_successfully")}`);
    } catch {
      showToast(arabicSource("settings.feature_update_error"));
    }
  }, [refetchModules, showToast]);

  return { toggleModule };
};
