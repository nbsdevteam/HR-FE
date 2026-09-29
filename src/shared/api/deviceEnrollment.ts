import { hrCall } from "./client";
import { mapDeviceEnrollment } from "./mappers";
import { eid } from "./httpHelpers";
import type { DeviceCredentialKind, DeviceEnrollment, DeviceEnrollmentReportResults } from "../hooks";

/**
 * `POST .../device_enrollment` with no body — re-asks only for whatever
 * hasn't synced yet; `mode` becomes `"update"` once the person is already on
 * the terminal (backend §3/§5). The retry endpoint never allocates a number.
 */
export const retryDeviceEnrollment = async (employeeId: string | number): Promise<DeviceEnrollment | null> => {
  const data = await hrCall<unknown>(`/api/hr/employees/${eid(employeeId)}/device_enrollment`, {});
  return mapDeviceEnrollment(data);
}

/**
 * `POST .../device_enrollment {"credentials":[...]}` — add/replace a
 * credential on an already-active employee (backend §4/§6).
 */
export const requestDeviceCredentials = async (
  employeeId: string | number,
  credentials: DeviceCredentialKind[],
): Promise<DeviceEnrollment | null> => {
  const data = await hrCall<unknown>(`/api/hr/employees/${eid(employeeId)}/device_enrollment`, { credentials });
  return mapDeviceEnrollment(data);
}

/**
 * The single outcomes call after any enrol/removal pass — `results` values
 * are `synced`/`failed`/`skipped` (`removed`/`failed` for a `removal` key)
 * (backend §2/§4/§5/§7/§8 error codes table).
 */
export const reportDeviceEnrollment = async (
  employeeId: string | number,
  body: { device_employee_no: string; results: DeviceEnrollmentReportResults; error?: string },
): Promise<DeviceEnrollment | null> => {
  const data = await hrCall<unknown>(`/api/hr/employees/${eid(employeeId)}/device_enrollment/report`, body);
  return mapDeviceEnrollment(data);
}
