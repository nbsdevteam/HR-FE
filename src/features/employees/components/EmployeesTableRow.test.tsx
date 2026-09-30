import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { mapEmployee } from "@/shared/api/mappers";
import { arabicSource } from "@/i18n/source";
import { toEmployee } from "../utils/employeeMapper";

vi.mock("@/shared/auth/permissions", () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}));

const { default: EmployeesTableRow } = await import("./EmployeesTableRow");

const row = (raw: Record<string, unknown>) => {
  const emp = toEmployee(mapEmployee({ id: 186, person_id: 4447, name: "Suraj", device_employee_no: "4447", ...raw }), new Map());
  return render(
    <table>
      <tbody>
        <EmployeesTableRow
          emp={emp}
          index={0}
          isPending={false}
          isDeviceSynced={Boolean(emp.deviceEmployeeNo)}
          isSelf={false}
          onSelectEmployee={vi.fn()}
          onEditEmployee={vi.fn()}
          onDeleteTargetChange={vi.fn()}
          onDeactivateEmployee={vi.fn()}
          onRestoreEmployee={vi.fn()}
        />
      </tbody>
    </table>,
  );
};

describe("EmployeesTableRow for a deactivated employee", () => {
  it("shows Inactive, keeps the device number, and says the removal failed", () => {
    row({ status: "inactive", active: false, read_only: true, device_enrollment_state: "removal_failed" });

    expect(screen.getByText(arabicSource("employees.status_inactive"))).toBeInTheDocument();
    expect(screen.queryByText(arabicSource("common.is_active"))).toBeNull();
    expect(screen.getByText("#4447")).toBeInTheDocument();
    expect(screen.getByText(arabicSource("employees.device_enrollment_removal_failed"))).toBeInTheDocument();
    expect(screen.queryByText(arabicSource("employees.is_not_registered"))).toBeNull();
  });

  it("offers view and Restore only — no edit, deactivate or delete on the locked profile", () => {
    row({ status: "inactive", active: false, read_only: true, device_enrollment_state: "removed" });

    expect(screen.getAllByRole("button")).toHaveLength(2);
    expect(screen.queryByTitle(arabicSource("employees.deactivate_employee"))).toBeNull();
  });

  it("still offers deactivate for an active employee", () => {
    row({ status: "active", active: true, read_only: false, device_enrollment_state: "enrolled" });

    expect(screen.getByText(arabicSource("common.is_active"))).toBeInTheDocument();
    expect(screen.getByTitle(arabicSource("employees.deactivate_employee"))).toBeInTheDocument();
    expect(screen.getByText(arabicSource("employees.registered"))).toBeInTheDocument();
  });
});
