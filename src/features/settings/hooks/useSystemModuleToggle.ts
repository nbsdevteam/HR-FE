import { useCallback } from "react";
import * as odooData from "@/shared/api/odooData";
import { arabicSource } from "@/i18n/source";
import { type DbSystemModule, useOdooMutation } from "@/shared/hooks";

/**
 * `refetchModules` comes from `useSettingsBootstrap()`, a plain bundle fetch
 * (not a TanStack Query cache) — it stays after the mutation since the
 * `"systemModules"` invalidation below only reaches other pages' `useSystemModules()`
 * reads, not this bootstrap-fed card.
 */
export const useSystemModuleToggle = (refetchModules: () => void, showToast: (message: string) => void) => {
  const updateModuleMutation = useOdooMutation(
    ({ moduleId, isEnabled }: { moduleId: string; isEnabled: boolean }) => odooData.updateModule(moduleId, isEnabled),
    "systemModules",
  );

  const toggleModule = useCallback(async (module: DbSystemModule) => {
    try {
      await updateModuleMutation.mutateAsync({ moduleId: module.id, isEnabled: !module.is_enabled });
      refetchModules();
      showToast(`${arabicSource("common.done")} ${!module.is_enabled ? arabicSource("common.activate") : arabicSource("settings.disabled")} ${arabicSource("settings.feature_successfully")}`);
    } catch {
      showToast(arabicSource("settings.feature_update_error"));
    }
  }, [refetchModules, showToast, updateModuleMutation]);

  return { toggleModule };
};
