import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { mapDeviceEnrollment } from "@/shared/api/mappers";
import type { Employee } from "../types";

const fetchEmployee = vi.fn();
const reportDeviceEnrollment = vi.fn();
const removeCredentialsFromDevice = vi.fn();

vi.mock("@/shared/api/odooData", () => ({
  fetchEmployee: (...args: unknown[]) => fetchEmployee(...args),
  reportDeviceEnrollment: (...args: unknown[]) => reportDeviceEnrollment(...args),
}));
vi.mock("@/shared/api/deviceSync", () => ({
  syncEmployeeToDevice: vi.fn(),
  enrolCardOnDevice: vi.fn(),
  enrolFingerprintOnDevice: vi.fn(),
  removeCredentialsFromDevice: (...args: unknown[]) => removeCredentialsFromDevice(...args),
}));

const { useEmployeeCredentialActions } = await import("./useEmployeeCredentialActions");

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

const deactivated = { dbId: "186", deviceEmployeeNo: "4447", name: "Suraj", readOnly: true, deviceEnrollment: null } as Employee;
const failedRemoval = mapDeviceEnrollment({ state: "removal_failed", action: "remove", retry_required: true });
const removed = mapDeviceEnrollment({ state: "removed", action: null });

describe("useEmployeeCredentialActions", () => {
  beforeEach(() => {
    fetchEmployee.mockReset();
    reportDeviceEnrollment.mockReset();
    removeCredentialsFromDevice.mockReset();
    fetchEmployee.mockResolvedValue({ device_enrollment: failedRemoval });
  });

  it("loads the enrolment block the list does not carry, without overwriting a newer one", async () => {
    const setEditData = vi.fn();
    renderHook(() => useEmployeeCredentialActions(deactivated, setEditData), { wrapper });

    await waitFor(() => expect(setEditData).toHaveBeenCalled());
    expect(fetchEmployee).toHaveBeenCalledWith("186");
    const apply = setEditData.mock.calls[0][0] as (prev: Employee) => Employee;
    expect(apply(deactivated).deviceEnrollment?.state).toBe("removal_failed");
    const newer = { ...deactivated, deviceEnrollment: removed };
    expect(apply(newer)).toBe(newer);
  });

  it("retries a failed removal through device-sync and applies the reported outcome", async () => {
    removeCredentialsFromDevice.mockResolvedValue({ success: true });
    reportDeviceEnrollment.mockResolvedValue(removed);
    const setEditData = vi.fn();
    const { result } = renderHook(() => useEmployeeCredentialActions(deactivated, setEditData), { wrapper });

    await act(async () => { await result.current.handleRetryRemoval(); });

    expect(removeCredentialsFromDevice).toHaveBeenCalledWith("4447", { removeFace: true, removeFingerprint: true, removePerson: true });
    expect(reportDeviceEnrollment).toHaveBeenCalledWith("186", { device_employee_no: "4447", results: { removal: "removed" } });
    const applied = setEditData.mock.calls
      .map(([update]) => (update as (prev: Employee) => Employee)(deactivated))
      .find(next => next.deviceEnrollment?.state === "removed");
    expect(applied).toBeDefined();
  });
});
