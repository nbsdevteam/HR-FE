import { useState, useEffect } from "react";
import * as odooData from "@/shared/api/odooData";

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

/** Odoo Datetime fields are UTC-naive ("YYYY-MM-DD HH:MM:SS"). Parse as UTC. */
function odooUtcMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const iso = raw.includes("T") ? raw : raw.replace(" ", "T");
  const hasTz = /([zZ]|[+-]\d{2}:?\d{2})$/.test(iso);
  const d = new Date(hasTz ? iso : `${iso}Z`);
  const ms = d.getTime();
  return Number.isNaN(ms) ? null : ms;
}

/** Combines two fetches into one derived status object, so this doesn't fit useAsyncList's plain-T[] contract. */
export const useDeviceStatus = () => {
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    devices: [], totalDevices: 0, activeDevices: 0,
    lastSyncAt: null, syncAgeMinutes: 999,
    todayDeviceEvents: 0, status: "no_device",
  });
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      let devs: DbBiometricDevice[] = [];
      let todayDeviceEvents = 0;
      const today = new Date().toISOString().slice(0, 10);

      const rows = await odooData.fetchDevices();
      devs = rows.map((d: any) => ({
        id: String(d.id),
        name: d.name || "",
        model: d.model_name || d.model || "",
        serial_number: d.serial_number || "",
        ip_address: d.ip_address || "",
        port: d.port || 443,
        protocol: d.use_https ? "https" : "http",
        username: d.username || null,
        location: d.location || null,
        is_active: d.active !== false,
        last_sync_at: d.last_sync_at || null,
        last_heartbeat_at: d.last_heartbeat_at || null,
        config: {},
        created_at: "",
      }));
      const att = await odooData.fetchAttendance(today);
      todayDeviceEvents = att.filter(a => a.source === "device").length;

      const totalDevices = devs.length;
      const activeDevices = devs.filter(d => d.is_active).length;
      // Use the freshest of last_sync_at / last_heartbeat_at (both Odoo UTC-naive).
      let lastSyncAt: string | null = null;
      let lastMs: number | null = null;
      for (const d of devs) {
        for (const ts of [d.last_sync_at, d.last_heartbeat_at]) {
          const ms = odooUtcMs(ts);
          if (ms != null && (lastMs == null || ms > lastMs)) {
            lastMs = ms;
            lastSyncAt = ts;
          }
        }
      }
      let syncAgeMinutes = 999;
      if (lastMs != null) {
        syncAgeMinutes = Math.max(0, Math.round((Date.now() - lastMs) / 60000));
      }
      let status: DeviceStatus["status"] = "no_device";
      if (totalDevices > 0) {
        if (syncAgeMinutes <= 10) status = "online";
        else if (syncAgeMinutes <= 60) status = "stale";
        else status = "offline";
      }

      setDeviceStatus({
        devices: devs, totalDevices, activeDevices,
        lastSyncAt, syncAgeMinutes, todayDeviceEvents, status,
      });
    } catch {
      setDeviceStatus(prev => ({ ...prev, status: "no_device" }));
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // Auto-refresh every 2 minutes
    const interval = setInterval(refresh, 120000);
    return () => clearInterval(interval);
  }, []);

  return { deviceStatus, loading, refresh };
}
