import { useState, useEffect, useCallback } from "react";
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

/**
 * TopBar device health, from a single `/api/hr/devices/status` call.
 *
 * This used to fetch the device list *and* a full day of attendance rows every
 * 120 s just to count device punches and derive a freshness bucket. The server
 * computes `status`, `sync_age_minutes` and `today_device_events` now, so the
 * poll costs one small response. Still not `useAsyncList`: the result is a
 * derived object, not a list.
 */
export const useDeviceStatus = () => {
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>(EMPTY_STATUS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const payload = await odooData.fetchDeviceStatus();
      setDeviceStatus({
        devices: (payload.devices ?? []).map(mapDevice),
        totalDevices: payload.total_devices ?? 0,
        activeDevices: payload.active_devices ?? 0,
        lastSyncAt: payload.last_sync_at ?? null,
        syncAgeMinutes: payload.sync_age_minutes ?? 999,
        todayDeviceEvents: payload.today_device_events ?? 0,
        status: payload.status ?? "no_device",
      });
    } catch {
      setDeviceStatus((prev) => ({ ...prev, status: "no_device" }));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    // Auto-refresh every 2 minutes
    const interval = setInterval(refresh, 120000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { deviceStatus, loading, refresh };
};
