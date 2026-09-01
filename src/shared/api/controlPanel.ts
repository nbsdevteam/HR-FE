/**
 * Control Panel aggregate endpoints (lugal_hr 1.18.0).
 *
 * These three routes replace the 19 list endpoints the dashboard used to fan
 * out to on mount. Every number the screen renders is computed server-side, so
 * nothing here is re-derived from raw rows in the browser. The payload shapes
 * live in `./controlPanelTypes` and are re-exported from here.
 */
import { hrCall } from "./client";
import type {
  ControlPanelOverview,
  ControlPanelSection,
  ControlPanelSectionPayload,
  DeviceStatusPayload,
} from "./controlPanelTypes";

export * from "./controlPanelTypes";

/** Everything the Control Panel needs on mount, in one request. */
export const fetchControlPanelOverview = (params?: {
  departmentId?: number;
  newJoinerDays?: number;
}): Promise<ControlPanelOverview> =>
  hrCall<ControlPanelOverview>("/api/hr/control-panel/overview", {
    ...(params?.departmentId != null ? { department_id: params.departmentId } : {}),
    ...(params?.newJoinerDays != null ? { new_joiner_days: params.newJoinerDays } : {}),
  });

/** One KPI tab's numbers — called when the user opens that tab. */
export const fetchControlPanelSection = (
  section: ControlPanelSection,
  departmentId?: number,
): Promise<ControlPanelSectionPayload> =>
  hrCall<ControlPanelSectionPayload>("/api/hr/control-panel/section", {
    section,
    ...(departmentId != null ? { department_id: departmentId } : {}),
  });

/**
 * Device health for the TopBar. Replaces the old devices/list plus a full
 * attendance download: `status`, `sync_age_minutes` and `today_device_events`
 * are all computed server-side now.
 */
export const fetchDeviceStatus = (): Promise<DeviceStatusPayload> =>
  hrCall<DeviceStatusPayload>("/api/hr/devices/status", {});
