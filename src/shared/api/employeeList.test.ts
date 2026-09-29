import { beforeEach, describe, expect, it, vi } from "vitest";

const hrCall = vi.fn();
vi.mock("./client", () => ({ hrCall: (...args: unknown[]) => hrCall(...args) }));

const { fetchEmployeesPage } = await import("./employeeList");

const lastBody = (): Record<string, unknown> => hrCall.mock.calls.at(-1)?.[1] as Record<string, unknown>;

describe("fetchEmployeesPage origin filters", () => {
  beforeEach(() => {
    hrCall.mockReset();
    hrCall.mockResolvedValue({ items: [], total: 0 });
  });

  it("sends hr_info_pending for the pending filter and source for the device filter", async () => {
    await fetchEmployeesPage({ origin: "hr_info_pending" });
    expect(lastBody()).toMatchObject({ hr_info_pending: true });
    expect(lastBody()).not.toHaveProperty("source");

    await fetchEmployeesPage({ origin: "device" });
    expect(lastBody()).toMatchObject({ source: "device" });
    expect(lastBody()).not.toHaveProperty("hr_info_pending");
  });

  it("sends has_device_number only when asked, including false", async () => {
    await fetchEmployeesPage({ hasDeviceNumber: false, status: "active" });
    expect(lastBody()).toMatchObject({ has_device_number: false, status: "active" });

    await fetchEmployeesPage({ origin: "" });
    expect(lastBody()).toEqual({ limit: 25, page: 1 });
  });
});
