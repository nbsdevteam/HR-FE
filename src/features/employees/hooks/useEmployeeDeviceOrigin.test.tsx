import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { arabicSource } from "@/i18n/source";
import type { Employee } from "../types";

const fetchEmployeesPage = vi.fn();
const markHrInfoComplete = vi.fn();
const mapDevicePersonToEmployee = vi.fn();

vi.mock("@/shared/api/odooData", () => ({
  fetchEmployeesPage: (...args: unknown[]) => fetchEmployeesPage(...args),
  markHrInfoComplete: (...args: unknown[]) => markHrInfoComplete(...args),
  mapDevicePersonToEmployee: (...args: unknown[]) => mapDevicePersonToEmployee(...args),
}));
vi.mock("@/shared/auth/permissions", () => ({
  usePermissions: () => ({ hasPermission: (key: string) => key === "hr.employees.edit" }),
}));

const { useEmployeeDeviceOrigin } = await import("./useEmployeeDeviceOrigin");

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

const deviceRecord = {
  dbId: "12",
  source: "device",
  deviceEmployeeNo: "1042",
  readOnly: false,
  hrInfoPending: true,
  hrInfoMissing: ["department", "joining_date"],
} as Employee;

const candidate = { id: "40", name: "Existing Person", arabic_name: "", position: "Driver", department: "Fleet" };

describe("useEmployeeDeviceOrigin", () => {
  beforeEach(() => {
    fetchEmployeesPage.mockReset();
    markHrInfoComplete.mockReset();
    mapDevicePersonToEmployee.mockReset();
    fetchEmployeesPage.mockResolvedValue({ items: [candidate], total: 1, page: 1, perPage: 20, totalPages: 1 });
  });

  it("offers only active employees with no device number, and maps onto HR's pick", async () => {
    mapDevicePersonToEmployee.mockResolvedValue({ employee: candidate, mappedFrom: "12", moved: { punches: 3, deviceEvents: 1 } });
    const onMapped = vi.fn();
    const { result } = renderHook(() => useEmployeeDeviceOrigin(deviceRecord, vi.fn(), onMapped), { wrapper });

    await waitFor(() => expect(result.current.mappingCandidates).toHaveLength(1));
    expect(fetchEmployeesPage).toHaveBeenCalledWith(expect.objectContaining({ status: "active", hasDeviceNumber: false }));

    act(() => { result.current.handleMappingTargetChange("40"); });
    await act(async () => { await result.current.handleConfirmMapping(); });

    expect(mapDevicePersonToEmployee).toHaveBeenCalledWith("12", "40");
    expect(onMapped).toHaveBeenCalledTimes(1);
    expect(result.current.mappingTargetLabels).toEqual({ 40: "Existing Person" });
  });

  it("shows the refusal's own message and stays open when the backend refuses", async () => {
    mapDevicePersonToEmployee.mockRejectedValue(Object.assign(new Error("x"), { code: "mapping_target_has_device_number" }));
    const onMapped = vi.fn();
    const { result } = renderHook(() => useEmployeeDeviceOrigin(deviceRecord, vi.fn(), onMapped), { wrapper });

    act(() => { result.current.handleMappingTargetChange("40"); });
    await act(async () => { await result.current.handleConfirmMapping(); });

    expect(result.current.originError).toBe(arabicSource("employees.device_mapping_error_target_has_number"));
    expect(onMapped).not.toHaveBeenCalled();
  });

  it("marks HR information complete from the backend's answer", async () => {
    markHrInfoComplete.mockResolvedValue({ hr_info_pending: false, hr_info_missing: [] });
    const setEditData = vi.fn();
    const { result } = renderHook(() => useEmployeeDeviceOrigin(deviceRecord, setEditData, vi.fn()), { wrapper });

    expect(result.current.missingFieldsLabel).toBe(`${arabicSource("common.section")} · ${arabicSource("common.direct_date")}`);
    await act(async () => { await result.current.handleMarkHrInfoComplete(); });

    expect(markHrInfoComplete).toHaveBeenCalledWith("12");
    const updater = setEditData.mock.calls[0][0] as (prev: Employee) => Employee;
    expect(updater(deviceRecord)).toMatchObject({ hrInfoPending: false, hrInfoMissing: [] });
  });

  it("never offers mapping for an HR-created employee", async () => {
    const hrRecord = { ...deviceRecord, source: "hr", hrInfoPending: false } as Employee;
    const { result } = renderHook(() => useEmployeeDeviceOrigin(hrRecord, vi.fn(), vi.fn()), { wrapper });

    expect(result.current.canEdit).toBe(true);
    expect(result.current.canMap).toBe(false);
    expect(fetchEmployeesPage).not.toHaveBeenCalled();
  });
});
