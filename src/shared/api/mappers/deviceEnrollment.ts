import type { DeviceCredentialKind, DeviceEnrollment } from "../../hooks";
import { bool, num } from "./mapHelpers";

const credentialArray = (v: unknown): DeviceCredentialKind[] =>
  Array.isArray(v) ? v.filter((c): c is DeviceCredentialKind => typeof c === "string") : [];

/** Defensive: an unrecognized/absent enrolment block maps to `null` rather than throwing. */
export const mapDeviceEnrollment = (r: unknown): DeviceEnrollment | null => {
  if (!r || typeof r !== "object") return null;
  const raw = r as Record<string, unknown>;
  return {
    device_employee_no: (raw.device_employee_no as string) ?? null,
    state: (raw.state as string) || "pending",
    mode: raw.mode === "update" ? "update" : "create",
    requested: credentialArray(raw.requested),
    pending: credentialArray(raw.pending),
    synced: credentialArray(raw.synced),
    failed: credentialArray(raw.failed),
    action: (raw.action as string) || "",
    retry_required: bool(raw.retry_required),
    can_enroll: bool(raw.can_enroll),
    device_sync_paused: bool(raw.device_sync_paused),
    last_error: (raw.last_error as string) ?? null,
    attempts: num(raw.attempts),
    updated_at: (raw.updated_at as string) ?? null,
  };
};
