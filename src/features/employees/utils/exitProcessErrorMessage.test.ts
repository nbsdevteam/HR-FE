import { describe, expect, it } from "vitest";
import { arabicSource } from "@/i18n/source";
import type { HrApiError } from "@/shared/api/client";
import { exitErrorCode, exitProcessErrorMessage } from "./exitProcessErrorMessage";

const apiError = (code: string | undefined, message = "raw server text"): HrApiError => {
  const error: HrApiError = new Error(message);
  if (code) error.code = code;
  return error;
};

describe("exitProcessErrorMessage", () => {
  it("maps each backend code to its own localized message", () => {
    const cases: Array<[string, Parameters<typeof arabicSource>[0]]> = [
      ["invalid_exit_transition", "lifecycle.exit_error_invalid_transition"],
      ["clearance_checklist_incomplete", "lifecycle.exit_error_checklist_incomplete"],
      ["open_exit_process_exists", "lifecycle.exit_error_open_exists"],
      ["exit_already_completed", "lifecycle.exit_error_already_completed"],
      ["esign_not_signed", "lifecycle.exit_error_esign_not_signed"],
      ["clearance_section_governs_item", "lifecycle.exit_error_section_governs_item"],
      ["signature_out_of_order", "lifecycle.exit_error_signature_out_of_order"],
      ["signature_already_decided", "lifecycle.exit_error_signature_already_decided"],
    ];
    for (const [code, key] of cases) {
      expect(exitProcessErrorMessage(apiError(code), "lifecycle.exit_error_update_failed"))
        .toBe(arabicSource(key));
    }
  });

  it("never surfaces the raw ORM text, even for a code it does not know", () => {
    const raw = "Wrong value for lugal.hr.exit.process.status: 'clearance'";
    const message = exitProcessErrorMessage(apiError("INTERNAL_ERROR", raw), "lifecycle.exit_error_update_failed");
    expect(message).toBe(arabicSource("lifecycle.exit_error_update_failed"));
    expect(message).not.toContain("Wrong value");
  });

  it("falls back when there is no code at all", () => {
    expect(exitProcessErrorMessage(new Error("offline"), "lifecycle.exit_error_create_failed"))
      .toBe(arabicSource("lifecycle.exit_error_create_failed"));
  });

  it("reads the code off the thrown error", () => {
    expect(exitErrorCode(apiError("open_exit_process_exists"))).toBe("open_exit_process_exists");
    expect(exitErrorCode(new Error("no code"))).toBeUndefined();
  });
});
