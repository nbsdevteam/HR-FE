import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import * as odooData from "@/shared/api/odooData";
import type { DeviceStatusDevice } from "@/shared/api/controlPanel";

// ——— Biometric Device Status ———

export interface DbBiometricDevice {
  id: string;
  name: string;
  model: string;
  serial_number: string;
  ip_address: string;
  port: number;
  protocol: string;
  username: string | null;
  location: string | null;
  is_active: boolean;
  last_sync_at: string | null;
  last_heartbeat_at: string | null;
  config: Record<string, unknown>;
  created_at: string;
}

export interface DeviceStatus {
  devices: DbBiometricDevice[];
  totalDevices: number;
  activeDevices: number;
  lastSyncAt: string | null;
  syncAgeMinutes: number; // minutes since last sync
  todayDeviceEvents: number;
  status: "online" | "stale" | "offline" | "no_device";
}

const EMPTY_STATUS: DeviceStatus = {
  devices: [],
  totalDevices: 0,
  activeDevices: 0,
  lastSyncAt: null,
  syncAgeMinutes: 999,
  todayDeviceEvents: 0,
  status: "no_device",
};

const mapDevice = (device: DeviceStatusDevice): DbBiometricDevice => ({
  id: String(device.id),
  name: device.name || "",
  model: device.model_name || device.model || "",
  serial_number: device.serial_number || "",
  ip_address: device.ip_address || "",
  port: device.port || 443,
  protocol: device.use_https ? "https" : "http",
  username: device.username || null,
  location: device.location || null,
  is_active: device.active !== false,
  last_sync_at: device.last_sync_at || null,
  last_heartbeat_at: device.last_heartbeat_at || null,
  config: {},
  created_at: "",
});

const fetchDeviceStatus = async (): Promise<DeviceStatus> => {
  const payload = await odooData.fetchDeviceStatus();
  return {
    devices: (payload.devices ?? []).map(mapDevice),
    totalDevices: payload.total_devices ?? 0,
    activeDevices: payload.active_devices ?? 0,
    lastSyncAt: payload.last_sync_at ?? null,
    syncAgeMinutes: payload.sync_age_minutes ?? 999,
    todayDeviceEvents: payload.today_device_events ?? 0,
    status: payload.status ?? "no_device",
  };
};

/**
 * TopBar device health, from a single `/api/hr/devices/status` call. Live
 * data — the server derives `status`/`sync_age_minutes`/`today_device_events`
 * from what happened today, so it always refetches (`staleTime: 0`) and polls
 * every 2 minutes rather than being served from the shared query cache TTL.
 */
export const useDeviceStatus = () => {
  const query = useQuery<DeviceStatus, Error>({
    queryKey: ["deviceStatus"],
    queryFn: fetchDeviceStatus,
    staleTime: 0,
    refetchInterval: 120_000,
    refetchOnWindowFocus: true,
  });

  const refresh = useCallback(async () => {
    await query.refetch();
  }, [query.refetch]);

  // On a failed poll, keep showing the last-known devices/counts but flip the
  // status the same way the old handler did, instead of blanking the panel.
  const deviceStatus: DeviceStatus = query.data
    ? query.isError
      ? { ...query.data, status: "no_device" }
      : query.data
    : EMPTY_STATUS;

  return { deviceStatus, loading: query.isLoading, refresh };
};
