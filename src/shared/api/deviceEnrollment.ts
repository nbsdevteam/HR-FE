import { hrCall } from "./client";
import { mapDeviceEnrollment, mapEmployee } from "./mappers";
import { num } from "./mappers/mapHelpers";
import { eid } from "./httpHelpers";
import type { DbEmployee, DeviceCredentialKind, DeviceEnrollment, DeviceEnrollmentReportResults } from "../hooks";

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

/**
 * `POST .../update {"hr_info_complete": true}` — HR confirms a device-origin
 * record is complete. The flag also clears on its own once department,
 * position and joining date are all set (backend lugal_hr ≥ 1.24.0).
 */
export const markHrInfoComplete = async (employeeId: string | number): Promise<DbEmployee> => {
  const data = await hrCall<unknown>(`/api/hr/employees/${eid(employeeId)}/update`, { hr_info_complete: true });
  return mapEmployee(data);
}

export type DeviceMappingResult = {
  /** The HR employee that now holds the terminal identity. */
  employee: DbEmployee;
  /** The device-origin record, now archived and read-only. */
  mappedFrom: string;
  moved: { punches: number; deviceEvents: number };
};

/**
 * `POST .../device_mapping {"target_employee_id"}` — moves the terminal number
 * and the punches that arrived under it from a device-origin record to the
 * existing employee HR chose. Never matched by name; the target must be
 * active with no device number of its own (backend lugal_hr ≥ 1.24.0).
 */
export const mapDevicePersonToEmployee = async (
  employeeId: string | number,
  targetEmployeeId: string | number,
): Promise<DeviceMappingResult> => {
  const data = await hrCall<Record<string, unknown>>(`/api/hr/employees/${eid(employeeId)}/device_mapping`, {
    target_employee_id: eid(targetEmployeeId),
  });
  const moved = (data?.moved ?? {}) as Record<string, unknown>;
  return {
    employee: mapEmployee(data),
    mappedFrom: String(data?.mapped_from ?? employeeId),
    moved: { punches: num(moved.punches), deviceEvents: num(moved.device_events) },
  };
}
