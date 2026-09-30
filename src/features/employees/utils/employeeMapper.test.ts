import { describe, expect, it } from "vitest";
import { mapEmployee } from "@/shared/api/mappers";
import { arabicSource } from "@/i18n/source";
import { employeeStatusKeys, translateBackendCode } from "@/i18n/status";
import { toEmployee } from "./employeeMapper";
import { buildEmployeeUpdatePayload } from "./employeeUpdatePayload";

const fromList = (raw: Record<string, unknown>) => toEmployee(mapEmployee({ id: 186, person_id: 4447, name: "Suraj", ...raw }), new Map());

describe("toEmployee status", () => {
  it("keeps the backend's status code instead of turning every code into Active", () => {
    expect(fromList({ status: "inactive", active: false }).status).toBe("inactive");
    expect(fromList({ status: "suspended" }).status).toBe("suspended");
    expect(fromList({ status: "exited", active: false }).status).toBe("exited");
    expect(fromList({ status: "active" }).status).toBe("active");
  });

  it("labels each code as its own status", () => {
    expect(translateBackendCode(fromList({ status: "inactive" }).status, employeeStatusKeys))
      .toBe(arabicSource("employees.status_inactive"));
    expect(translateBackendCode(fromList({ status: "suspended" }).status, employeeStatusKeys))
      .toBe(arabicSource("employees.status_suspended"));
    expect(translateBackendCode(fromList({ status: "active" }).status, employeeStatusKeys))
      .toBe(arabicSource("common.is_active"));
  });

  it("carries whether the row is archived", () => {
    expect(fromList({ status: "inactive", active: false }).isActive).toBe(false);
    expect(fromList({ status: "active", active: true }).isActive).toBe(true);
  });
});

describe("buildEmployeeUpdatePayload", () => {
  it("never sends status, so a save cannot reactivate a suspended employee", () => {
    const suspended = fromList({ status: "suspended" });
    const payload = buildEmployeeUpdatePayload({ ...suspended, name: "Suraj K" }, suspended, null, null);

    expect(payload).toMatchObject({ name: "Suraj K" });
    expect(payload).not.toHaveProperty("status");
  });
});
