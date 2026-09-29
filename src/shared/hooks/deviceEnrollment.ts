/** Any of face | card | fingerprint — never a PIN (unsupported today). */
export type DeviceCredentialKind = "face" | "card" | "fingerprint";

export type DeviceEnrollmentState = "pending" | "partial" | "enrolled" | "failed" | "removal_pending";

export type DeviceEnrollmentMode = "create" | "update";

export type DeviceEnrollmentResultValue = "synced" | "failed" | "skipped" | "removed";

/** `hr.employee`'s enrolment snapshot, echoed on create/update/set_status/device_enrollment* (backend §1-§7). */
export interface DeviceEnrollment {
  device_employee_no: string | null;
  /** Widened defensively — an unlisted backend value must not crash the UI. */
  state: DeviceEnrollmentState | (string & {});
  mode: DeviceEnrollmentMode | (string & {});
  requested: DeviceCredentialKind[];
  pending: DeviceCredentialKind[];
  synced: DeviceCredentialKind[];
  failed: DeviceCredentialKind[];
  action: string;
  retry_required: boolean;
  can_enroll: boolean;
  device_sync_paused: boolean;
  last_error: string | null;
  attempts: number;
  updated_at: string | null;
}

export type DeviceEnrollmentReportResults = Partial<
  Record<"person" | DeviceCredentialKind | "removal", DeviceEnrollmentResultValue>
>;

/** `active` | `inactive` | `suspended` | `onboarding` | `exited` (backend §5/§8). */
export type EmployeeStatusCode = "active" | "inactive" | "suspended" | "onboarding" | "exited";
