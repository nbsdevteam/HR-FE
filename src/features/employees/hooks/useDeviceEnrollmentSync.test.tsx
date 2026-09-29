import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

const syncEmployeeToDevice = vi.fn();
const removeCredentialsFromDevice = vi.fn();
const reportDeviceEnrollment = vi.fn();

vi.mock("@/shared/api/deviceSync", () => ({
  syncEmployeeToDevice: (...args: unknown[]) => syncEmployeeToDevice(...args),
  enrolCardOnDevice: vi.fn(),
  enrolFingerprintOnDevice: vi.fn(),
  removeCredentialsFromDevice: (...args: unknown[]) => removeCredentialsFromDevice(...args),
}));
vi.mock("@/shared/api/odooData", () => ({
  reportDeviceEnrollment: (...args: unknown[]) => reportDeviceEnrollment(...args),
}));

const { useDeviceEnrollmentSync, useDeviceRemovalSync } = await import("./useDeviceEnrollmentSync");

const INPUT = {
  dbId: "12",
  deviceEmployeeNo: "1042",
  mode: "create" as const,
  credentials: ["face" as const],
  name: "New Hire",
};

describe("device-sync failures reported to Odoo", () => {
  beforeEach(() => {
    syncEmployeeToDevice.mockReset();
    removeCredentialsFromDevice.mockReset();
    reportDeviceEnrollment.mockReset();
    reportDeviceEnrollment.mockResolvedValue(null);
  });

  it("reports a taken terminal number as its code with the name the terminal has", async () => {
    syncEmployeeToDevice.mockResolvedValue({ success: false, error_code: "device_number_taken", existing_name: "Ali" });
    const { result } = renderHook(() => useDeviceEnrollmentSync());

    await act(async () => { await result.current.runEnrollment(INPUT); });

    expect(reportDeviceEnrollment).toHaveBeenCalledWith("12", {
      device_employee_no: "1042",
      results: { person: "failed", face: "failed" },
      error: "device_number_taken: Ali",
    });
  });

  it("reports an unreachable service as device_sync_unreachable, for enrolment and removal", async () => {
    syncEmployeeToDevice.mockRejectedValue(new TypeError("Failed to fetch"));
    removeCredentialsFromDevice.mockRejectedValue(new TypeError("Failed to fetch"));
    const { result: enrol } = renderHook(() => useDeviceEnrollmentSync());
    const { result: removal } = renderHook(() => useDeviceRemovalSync());

    await act(async () => { await enrol.current.runEnrollment(INPUT); });
    await act(async () => { await removal.current.runRemoval("12", "1042"); });

    expect(reportDeviceEnrollment).toHaveBeenNthCalledWith(1, "12", expect.objectContaining({ error: "device_sync_unreachable" }));
    expect(reportDeviceEnrollment).toHaveBeenNthCalledWith(2, "12", {
      device_employee_no: "1042",
      results: { removal: "failed" },
      error: "device_sync_unreachable",
    });
  });

  it("reports no error on success", async () => {
    syncEmployeeToDevice.mockResolvedValue({ success: true, action: "created" });
    const { result } = renderHook(() => useDeviceEnrollmentSync());

    await act(async () => { await result.current.runEnrollment(INPUT); });

    expect(reportDeviceEnrollment).toHaveBeenCalledWith("12", { device_employee_no: "1042", results: { person: "synced", face: "synced" } });
  });
});
