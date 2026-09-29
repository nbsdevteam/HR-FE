import { describe, expect, it } from "vitest";
import { arabicSource } from "@/i18n/source";
import {
  DEVICE_SYNC_UNREACHABLE,
  deviceSyncErrorMessage,
  deviceSyncFailure,
  deviceSyncThrown,
} from "./deviceSyncErrorMessage";

describe("deviceSyncFailure", () => {
  it("reports a typed failure as its code, with the terminal's name for device_number_taken", () => {
    expect(deviceSyncFailure({ success: false, error_code: "device_number_taken", existing_name: "Ali" }))
      .toBe("device_number_taken: Ali");
    expect(deviceSyncFailure({ success: false, error_code: "device_number_not_in_odoo", error: "No employee holds device number #7" }))
      .toBe("device_number_not_in_odoo");
  });

  it("keeps the service's own text when it sent no code", () => {
    expect(deviceSyncFailure({ success: false, error: "ISAPI timeout" })).toBe("ISAPI timeout");
  });
});

describe("deviceSyncThrown", () => {
  it("reads a rejected fetch or a non-JSON answer as the service being unreachable", () => {
    expect(deviceSyncThrown(new TypeError("Failed to fetch"))).toBe(DEVICE_SYNC_UNREACHABLE);
    expect(deviceSyncThrown(new SyntaxError("Unexpected token <"))).toBe(DEVICE_SYNC_UNREACHABLE);
  });

  it("passes any other error through as text", () => {
    expect(deviceSyncThrown(new Error("boom"))).toBe("boom");
  });
});

describe("deviceSyncErrorMessage", () => {
  it("localizes a stored device-sync code and keeps its detail", () => {
    expect(deviceSyncErrorMessage("device_number_taken: Ali"))
      .toBe(`${arabicSource("employees.device_sync_error_number_taken")} (Ali)`);
    expect(deviceSyncErrorMessage(DEVICE_SYNC_UNREACHABLE))
      .toBe(arabicSource("employees.device_sync_error_unreachable"));
  });

  it("shows an uncoded error exactly as stored", () => {
    expect(deviceSyncErrorMessage("ISAPI timeout: 10s")).toBe("ISAPI timeout: 10s");
  });
});
