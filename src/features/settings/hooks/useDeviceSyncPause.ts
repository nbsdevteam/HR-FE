import { useState, useCallback, useEffect } from "react";
import * as odooData from "@/shared/api/odooData";
import type { DeviceSyncState } from "@/shared/api/devices";
import { arabicSource } from "@/i18n/source";

export const useDeviceSyncPause = (showToast: (message: string) => void) => {
  const [state, setState] = useState<DeviceSyncState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await odooData.fetchDeviceSyncState(true);
      setState(data);
    } catch {
      setState(null);
    }
    setLoading(false);
  }, []);

  const updatePaused = useCallback(
    async (paused: boolean, reason?: string): Promise<boolean> => {
      setSaving(true);
      try {
        await odooData.setDeviceSyncPaused(paused, reason);
        await refresh();
        showToast(
          paused
            ? arabicSource("settings.device_sync_toast_paused")
            : arabicSource("settings.device_sync_toast_resumed"),
        );
        return true;
      } catch {
        showToast(arabicSource("settings.device_sync_error"));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [refresh, showToast],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { state, loading, saving, refresh, updatePaused };
};
