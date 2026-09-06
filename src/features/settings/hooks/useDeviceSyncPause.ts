import { useState, useCallback, useEffect } from "react";
import * as odooData from "@/shared/api/odooData";
import type { DeviceSyncState } from "@/shared/api/devices";
import { arabicSource } from "@/i18n/source";
import { useOdooMutation } from "@/shared/hooks";

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

  // No cached read hook is keyed on device-sync-pause state (it only lives in
  // the Settings bootstrap bundle and this hook's own local state — unrelated
  // to `useDeviceStatus`'s `["deviceStatus"]` query, which backs the TopBar's
  // biometric device health from a different endpoint), so there is nothing
  // for `useOdooMutation` to invalidate here; `refresh()` below stays the way
  // this hook's own local state gets updated after a pause/resume.
  const setSyncPausedMutation = useOdooMutation(
    ({ paused, reason }: { paused: boolean; reason?: string }) => odooData.setDeviceSyncPaused(paused, reason),
  );

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
        await setSyncPausedMutation.mutateAsync({ paused, reason });
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
    [refresh, setSyncPausedMutation, showToast],
  );

  useEffect(() => {
    if (bootstrapLoading) return;
    setState(bootstrapState);
    setLoading(false);
  }, [bootstrapLoading, bootstrapState]);

  return { state, loading, saving, refresh, updatePaused };
};
