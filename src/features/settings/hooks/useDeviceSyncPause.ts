import { useState, useCallback, useEffect } from "react";
import * as odooData from "@/shared/api/odooData";
import type { DeviceSyncState } from "@/shared/api/devices";
import { arabicSource } from "@/i18n/source";

/**
 * `bootstrapState`/`bootstrapLoading` come from the Settings bootstrap
 * context — this hook seeds from them instead of firing its own mount-time
 * `fetchDeviceSyncState` call. `refresh()`/`updatePaused()` still hit the
 * standalone endpoints directly, unchanged, so a pause/resume stays
 * authoritative even if the bootstrap section is later refetched.
 */
export const useDeviceSyncPause = (
  showToast: (message: string) => void,
  bootstrapState: DeviceSyncState | null,
  bootstrapLoading: boolean,
) => {
  const [state, setState] = useState<DeviceSyncState | null>(bootstrapState);
  const [loading, setLoading] = useState(bootstrapLoading);
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
    if (bootstrapLoading) return;
    setState(bootstrapState);
    setLoading(false);
  }, [bootstrapLoading, bootstrapState]);

  return { state, loading, saving, refresh, updatePaused };
};
