import { describe, expect, it } from "vitest";
import type { Employee, EmployeeAddForm } from "../types";
import { buildEmployeeCreatePayload } from "./employeeCreatePayload";
import { buildEmployeeUpdatePayload } from "./employeeUpdatePayload";
import { employeeWriteErrorMessage } from "./employeeWriteError";

const form = {
  name: "Ali",
  email: "",
  personalPhone: "0770",
  companyPhone: "0750",
  salary: "500",
  nationalityId: "103",
} as EmployeeAddForm;

describe("buildEmployeeCreatePayload", () => {
  it("sends each phone under its own key and never the merged phone", () => {
    const payload = buildEmployeeCreatePayload(form, 1);
    expect(payload.personal_phone).toBe("0770");
    expect(payload.company_phone).toBe("0750");
    expect(payload).not.toHaveProperty("phone");
  });

  it("sends the nationality as a country id, and omits it when none is picked", () => {
    expect(buildEmployeeCreatePayload(form, 1).nationality_id).toBe(103);
    const none = buildEmployeeCreatePayload({ ...form, nationalityId: "" }, 1);
    expect(none).not.toHaveProperty("nationality_id");
    expect(none).not.toHaveProperty("nationality");
  });
});

describe("buildEmployeeUpdatePayload", () => {
  const employee = { endDate: "2026-12-31", birthDate: "", photo: "" } as Employee;
  const edit = (overrides: Partial<Employee>): Employee => ({ ...employee, ...overrides }) as Employee;

  it("drops the old phone key", () => {
    const payload = buildEmployeeUpdatePayload(edit({ personalPhone: "1", companyPhone: "2" }), employee, null, null);
    expect(payload).not.toHaveProperty("phone");
    expect(payload.company_phone).toBe("2");
  });

  it("sends end_date only when changed, as an empty string to clear it", () => {
    expect(buildEmployeeUpdatePayload(edit({}), employee, null, null)).not.toHaveProperty("end_date");
    expect(buildEmployeeUpdatePayload(edit({ endDate: "2027-01-15" }), employee, null, null).end_date).toBe("2027-01-15");
    expect(buildEmployeeUpdatePayload(edit({ endDate: null }), employee, null, null).end_date).toBe("");
  });
});

describe("employeeWriteErrorMessage", () => {
  it("maps the new refusal codes and ignores others", () => {
    const refused = (code: string) => Object.assign(new Error("x"), { code });
    expect(employeeWriteErrorMessage(refused("end_date_before_joining"))).toBeTruthy();
    expect(employeeWriteErrorMessage(refused("invalid_blood_type"))).toBeTruthy();
    expect(employeeWriteErrorMessage(refused("department_not_found"))).toBeNull();
  });
});
