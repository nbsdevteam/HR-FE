import { deviceSyncHeaders, SYNC_API } from "@/shared/constants";

export type DeviceSyncResult<T = Record<string, unknown>> = {
  success: boolean;
  error?: string;
  error_code?: string;
} & T;

const deviceSyncPost = async <T = Record<string, unknown>>(
  path: string,
  body?: unknown,
): Promise<DeviceSyncResult<T>> => {
  const res = await fetch(`${SYNC_API}${path}`, {
    method: "POST",
    headers: deviceSyncHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return res.json();
};

export type SyncEmployeeToDeviceParams = {
  employeeNo: string;
  mode: "create" | "update";
  name: string;
  gender?: "male" | "female";
  /** base64, no `data:` prefix. */
  facePhoto?: string | null;
};

/** `POST /api/device/sync-employee` — pushes the person + optional face photo (backend §6.1). */
export const syncEmployeeToDevice = (params: SyncEmployeeToDeviceParams) =>
  deviceSyncPost<{ action?: "created" | "updated" }>("/device/sync-employee", {
    ...params,
    facePhoto: params.facePhoto ?? undefined,
  });

/** `POST /api/device/persons/:id/card` — ISAPI `CardInfo/Record` (backend §6.1). */
export const enrolCardOnDevice = (employeeNo: string, cardNo: string) =>
  deviceSyncPost(`/device/persons/${employeeNo}/card`, { cardNo });

/** `POST /api/device/persons/:id/fingerprint` — capture-on-terminal, no client-side biometric data (backend §6.1). */
export const enrolFingerprintOnDevice = (employeeNo: string) =>
  deviceSyncPost(`/device/persons/${employeeNo}/fingerprint`);

export type RemoveCredentialsParams = {
  removeFace?: boolean;
  removeFingerprint?: boolean;
  removePerson?: boolean;
};

/** `POST /api/device/remove-credentials/:id` — the existing termination route, also used for §7 deactivate. */
export const removeCredentialsFromDevice = (employeeNo: string, params: RemoveCredentialsParams) =>
  deviceSyncPost<{ results?: Record<string, string> }>(`/device/remove-credentials/${employeeNo}`, params);
