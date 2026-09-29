import { describe, expect, it } from "vitest";
import { arabicSource } from "@/i18n/source";
import { deviceMappingErrorMessage } from "./deviceMappingErrorMessage";

const withCode = (code: string) => Object.assign(new Error("server text"), { code });

describe("deviceMappingErrorMessage", () => {
  it("maps each mapping refusal code to its own message", () => {
    expect(deviceMappingErrorMessage(withCode("mapping_target_has_device_number")))
      .toBe(arabicSource("employees.device_mapping_error_target_has_number"));
    expect(deviceMappingErrorMessage(withCode("device_origin_has_records")))
      .toBe(arabicSource("employees.device_mapping_error_has_records"));
    expect(deviceMappingErrorMessage(withCode("mapping_target_inactive")))
      .toBe(arabicSource("employees.device_mapping_error_target_inactive"));
  });

  it("never shows raw server text for an unknown or missing code", () => {
    expect(deviceMappingErrorMessage(withCode("something_new")))
      .toBe(arabicSource("employees.device_mapping_error_generic"));
    expect(deviceMappingErrorMessage(new Error("server text")))
      .toBe(arabicSource("employees.device_mapping_error_generic"));
  });
});
