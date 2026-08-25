import { useCallback, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { arabicSource } from "@/i18n/source";
import { leaveErrorMessage } from "@/features/leave/utils/leaveErrorMessage";
import type { ConfigValue } from "../types";

/** The leave max-hours row has its own validating/audit-logging endpoint (backend §3.2). */
const LEAVE_MAX_HOURS_KEY = "leave.max_hours_per_request";

export const useConfigEdits = (refetchConfigs: () => void, showToast: (message: string) => void) => {
  const [configEdits, setConfigEdits] = useState<Record<string, ConfigValue>>({});

  const setConfigEdit = useCallback((configId: string, value: ConfigValue) => {
    setConfigEdits((prev) => ({ ...prev, [configId]: value }));
  }, []);

  const saveConfigValue = useCallback(async (configId: string, value: ConfigValue, configKey?: string) => {
    try {
      if (configKey === LEAVE_MAX_HOURS_KEY) {
        await odooData.updateLeaveSettingsMaxHours(Number(value));
      } else {
        await odooData.updateConfig(configId, value);
      }
      refetchConfigs();
      showToast(arabicSource("settings.the_setting_was_saved_successfully"));
      setConfigEdits((prev) => {
        const newEdits = { ...prev };
        delete newEdits[configId];
        return newEdits;
      });
    } catch (e) {
      showToast(
        configKey === LEAVE_MAX_HOURS_KEY
          ? leaveErrorMessage(e, arabicSource("settings.error_saving_setting"))
          : arabicSource("settings.error_saving_setting"),
      );
    }
  }, [refetchConfigs, showToast]);

  return { configEdits, setConfigEdit, saveConfigValue };
};
