import { describe, expect, it } from "vitest";
import type { HrApiError } from "@/shared/api/client";
import { exitRedirectFromError, exitRedirectSearch, isRehireRequired } from "./exitRedirect";

const apiError = (code: string, details: Record<string, unknown> = {}): HrApiError =>
  Object.assign(new Error(code), { code, details });

describe("exitRedirectFromError", () => {
  it("sends use_end_of_service to Start End of Service for the acted-on employee", () => {
    const redirect = exitRedirectFromError(apiError("use_end_of_service", { history: { contracts: 2 } }), "186");
    expect(redirect).toEqual({ kind: "start", employeeId: "186" });
  });

  it("prefers the employee_id a contract refusal carries", () => {
    const redirect = exitRedirectFromError(apiError("use_end_of_service", { employee_id: 77, contract_id: 9 }), "186");
    expect(redirect).toEqual({ kind: "start", employeeId: "77" });
  });

  it("opens the existing record for exit_process_open", () => {
    const redirect = exitRedirectFromError(apiError("exit_process_open", { exit_id: 12, exit_status: "clearance" }), "186");
    expect(redirect).toEqual({ kind: "open", exitId: "12", exitStatus: "clearance" });
  });

  it("ignores other errors, and an open refusal with no exit id", () => {
    expect(exitRedirectFromError(apiError("employee_in_use"))).toBeNull();
    expect(exitRedirectFromError(apiError("exit_process_open"))).toBeNull();
    expect(exitRedirectFromError(new Error("boom"))).toBeNull();
  });
});

describe("exitRedirectSearch", () => {
  it("builds the Life cycle deep links", () => {
    expect(exitRedirectSearch({ kind: "open", exitId: "12", exitStatus: null })).toBe("?tab=exit&exit=12");
    expect(exitRedirectSearch({ kind: "start", employeeId: "186" })).toBe("?tab=exit&start=186");
  });
});

describe("isRehireRequired", () => {
  it("matches only use_rehire", () => {
    expect(isRehireRequired(apiError("use_rehire"))).toBe(true);
    expect(isRehireRequired(apiError("use_end_of_service"))).toBe(false);
  });
});
