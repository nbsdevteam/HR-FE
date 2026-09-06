import { useCallback, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { arabicSource } from "@/i18n/source";
import { leaveErrorMessage } from "@/features/leave/utils/leaveErrorMessage";
import { useOdooMutation } from "@/shared/hooks";
import { configErrorMessage } from "../utils/configErrorMessage";
import type { ConfigValue } from "../types";

/** The leave max-hours row has its own validating/audit-logging endpoint (backend §3.2). */
const LEAVE_MAX_HOURS_KEY = "leave.max_hours_per_request";

/**
 * `refetchConfigs` is `useSettingsBootstrap()`'s whole-bundle refetch, not
 * the `"configurations"`-keyed query these mutations invalidate, so it stays.
 */
export const useConfigEdits = (refetchConfigs: () => void, showToast: (message: string) => void) => {
  const [configEdits, setConfigEdits] = useState<Record<string, ConfigValue>>({});

  const updateLeaveMaxHoursMutation = useOdooMutation(
    (maxHoursPerRequest: number) => odooData.updateLeaveSettingsMaxHours(maxHoursPerRequest),
    "configurations",
  );
  const updateConfigMutation = useOdooMutation(
    ({ configId, value }: { configId: string; value: ConfigValue }) => odooData.updateConfig(configId, value),
    "configurations",
  );

  const setConfigEdit = useCallback((configId: string, value: ConfigValue) => {
    setConfigEdits((prev) => ({ ...prev, [configId]: value }));
  }, []);

  const saveConfigValue = useCallback(async (configId: string, value: ConfigValue, configKey?: string) => {
    try {
      if (configKey === LEAVE_MAX_HOURS_KEY) {
        await updateLeaveMaxHoursMutation.mutateAsync(Number(value));
      } else {
        await updateConfigMutation.mutateAsync({ configId, value });
      }
      refetchConfigs();
      showToast(arabicSource("settings.the_setting_was_saved_successfully"));
      setConfigEdits((prev) => {
        const newEdits = { ...prev };
        delete newEdits[configId];
        return newEdits;
      });
    } catch (e) {
      const fallback = arabicSource("settings.error_saving_setting");
      showToast(
        configKey === LEAVE_MAX_HOURS_KEY
          ? leaveErrorMessage(e, fallback)
          : configErrorMessage(e, fallback),
      );
    }
  }, [refetchConfigs, showToast, updateConfigMutation, updateLeaveMaxHoursMutation]);

  return { configEdits, setConfigEdit, saveConfigValue };
};
