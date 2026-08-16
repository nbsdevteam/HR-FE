import { describe, expect, it, vi } from "vitest";
import {
  isEmployeesListForbiddenError,
  leaveRequestEmployeeIdField,
  resolveLeaveEmployeeScope,
} from "./odooData";
import type { DbEmployee } from "../hooks";

const omar: DbEmployee = {
  id: "56",
  name: "Omar.T",
  arabic_name: "",
  email: "omar@example.com",
  department: "",
  position: "",
  status: "active",
} as DbEmployee;

describe("isEmployeesListForbiddenError", () => {
  it("detects Forbidden — permission required: hr.employees.list", () => {
    expect(
      isEmployeesListForbiddenError(
        new Error("Forbidden — permission required: hr.employees.list"),
      ),
    ).toBe(true);
  });

  it("does not treat unrelated failures as forbidden", () => {
    expect(isEmployeesListForbiddenError(new Error("Network Error"))).toBe(false);
  });
});

describe("resolveLeaveEmployeeScope (agent self-leave)", () => {
  it("uses /employees/me when list is forbidden (leave.own, no employees.list)", async () => {
    const fetchEmployees = vi.fn(async () => {
      throw new Error("Forbidden — permission required: hr.employees.list");
    });
    const fetchCurrentEmployee = vi.fn(async () => omar);

    const scope = await resolveLeaveEmployeeScope({
      fetchEmployees,
      fetchCurrentEmployee,
    });

    expect(fetchEmployees).toHaveBeenCalledOnce();
    expect(fetchCurrentEmployee).toHaveBeenCalledOnce();
    expect(scope.selfOnly).toBe(true);
    expect(scope.employees).toEqual([omar]);
    expect(scope.linkError).toBeNull();
    // Current employee is what the Leave readonly field displays.
    expect(scope.employees[0]?.name).toBe("Omar.T");
    expect(scope.employees[0]?.id).toBe("56");
  });

  it("keeps full roster when employees.list succeeds", async () => {
    const roster = [omar, { ...omar, id: "99", name: "Other" } as DbEmployee];
    const fetchEmployees = vi.fn(async () => roster);
    const fetchCurrentEmployee = vi.fn(async () => omar);

    const scope = await resolveLeaveEmployeeScope({
      fetchEmployees,
      fetchCurrentEmployee,
    });

    expect(scope.selfOnly).toBe(false);
    expect(scope.employees).toEqual(roster);
    expect(fetchCurrentEmployee).not.toHaveBeenCalled();
  });

  it("surfaces link error when /me fails after forbidden list", async () => {
    const scope = await resolveLeaveEmployeeScope({
      fetchEmployees: async () => {
        throw new Error("Forbidden — permission required: hr.employees.list");
      },
      fetchCurrentEmployee: async () => {
        throw new Error("No HR employee linked to this user");
      },
    });
    expect(scope.selfOnly).toBe(true);
    expect(scope.employees).toEqual([]);
    expect(scope.linkError).toMatch(/not linked/i);
  });
});

describe("leaveRequestEmployeeIdField (self-service submit)", () => {
  it("omits employee_id for selfOnly so backend uses current_employee()", () => {
    expect(leaveRequestEmployeeIdField(true, "56")).toEqual({});
    expect(leaveRequestEmployeeIdField(true, 56)).toEqual({});
  });

  it("includes selected employee_id when roster mode (has list)", () => {
    expect(leaveRequestEmployeeIdField(false, "56")).toEqual({ employee_id: "56" });
  });
});
