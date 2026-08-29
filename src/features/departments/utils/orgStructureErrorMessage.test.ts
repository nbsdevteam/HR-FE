import { describe, expect, it } from "vitest";
import { orgStructureErrorMessage } from "./orgStructureErrorMessage";
import { arabicSource } from "@/i18n/source";
import type { HrApiError } from "@/shared/api/client";

const errorWithCode = (code: string): HrApiError => {
  const error: HrApiError = new Error("HR API error");
  error.code = code;
  return error;
};

describe("orgStructureErrorMessage", () => {
  it("maps a known error_code to its localized message", () => {
    expect(orgStructureErrorMessage(errorWithCode("parent_cycle"), "fallback"))
      .toBe(arabicSource("org_structure.error_parent_cycle"));
    expect(orgStructureErrorMessage(errorWithCode("department_not_found"), "fallback"))
      .toBe(arabicSource("org_structure.error_department_not_found"));
  });

  it("falls back to the error's own message for an unrecognized code", () => {
    const error = errorWithCode("some_unmapped_code");
    error.message = "raw backend message";
    expect(orgStructureErrorMessage(error, "fallback")).toBe("raw backend message");
  });

  it("falls back to the provided fallback when there is no code or message", () => {
    expect(orgStructureErrorMessage(undefined, "fallback")).toBe("fallback");
    expect(orgStructureErrorMessage({}, "fallback")).toBe("fallback");
  });
});
