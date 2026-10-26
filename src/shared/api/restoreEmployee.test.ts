import { beforeEach, describe, expect, it, vi } from "vitest";

const hrCallEnvelope = vi.fn();
vi.mock("./client", () => ({
  hrCall: vi.fn(),
  hrCallEnvelope: (...args: unknown[]) => hrCallEnvelope(...args),
}));

const { restoreEmployee } = await import("./core");

describe("restoreEmployee", () => {
  beforeEach(() => hrCallEnvelope.mockReset());

  it("sends the rehire contract and reads the new contract from the top-level key", async () => {
    hrCallEnvelope.mockResolvedValue({
      success: true,
      data: { id: 7, name: "Rehired" },
      contract: { id: 31, employee_id: 7, contract_number: "C-31", start_date: "2026-11-01", status: "active" },
    });

    const restored = await restoreEmployee(7, { contract: { start_date: "2026-11-01", contract_type_id: "2" } });

    expect(hrCallEnvelope).toHaveBeenCalledWith("/api/hr/employees/7/restore", {
      contract: { start_date: "2026-11-01", contract_type_id: 2 },
    });
    expect(restored.id).toBe("7");
    expect(restored.contract?.contract_number).toBe("C-31");
  });

  it("restores without a contract and reports none", async () => {
    hrCallEnvelope.mockResolvedValue({ success: true, data: { id: 7 } });

    const restored = await restoreEmployee(7);

    expect(hrCallEnvelope).toHaveBeenCalledWith("/api/hr/employees/7/restore", {});
    expect(restored.contract).toBeNull();
  });
});
