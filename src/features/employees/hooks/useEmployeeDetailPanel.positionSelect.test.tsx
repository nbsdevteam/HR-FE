import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import type { DbPosition } from "@/shared/hooks";
import type { Employee } from "../types";
import EmployeePositionField from "../components/EmployeePositionField";
import { useEmployeeDetailPanel } from "./useEmployeeDetailPanel";

const baseEmployee: Employee = {
  id: 1,
  dbId: "emp-1",
  employeeNumber: "EMP-0001",
  name: "Test Employee",
  position: "IT Manager",
  positionId: "2",
  department: "IT",
  departmentId: "10",
  email: "",
  personalPhone: "",
  companyPhone: "",
  phone: "",
  joinDate: "",
  startDate: "",
  endDate: null,
  status: "active",
  salary: 0,
  currency: "IQD",
  photo: "",
  address: "",
  nationalId: "",
  emergencyContact: "",
  emergencyPhone: "",
  bloodType: "",
  managerId: null,
  managerName: "",
  custodies: [],
  leaves: [],
  attachments: [],
};

const designations: DbPosition[] = [
  { id: "1", title_ar: "محاسب", title_en: "Accountant", department_id: null, reports_to_position_id: null, level: 1, max_headcount: 1, is_active: true, description: null, created_at: "", updated_at: "" },
  { id: "2", title_ar: "مدير تقنية المعلومات", title_en: "IT Manager", department_id: null, reports_to_position_id: null, level: 1, max_headcount: 1, is_active: true, description: null, created_at: "", updated_at: "" },
  { id: "3", title_ar: "", title_en: "Call Center Agent", department_id: null, reports_to_position_id: null, level: 1, max_headcount: 1, is_active: true, description: null, created_at: "", updated_at: "" },
  { id: "4", title_ar: "محاسب", title_en: "Accountant (duplicate name)", department_id: null, reports_to_position_id: null, level: 1, max_headcount: 1, is_active: true, description: null, created_at: "", updated_at: "" },
];

const Harness = () => {
  const { editData, allPositions, resolvedPositionId, handlePositionSelect } = useEmployeeDetailPanel({
    employee: baseEmployee,
    designations,
    dbDepartments: [],
    allEmployees: [],
    onClose: () => {},
  });

  return (
    <div>
      <div data-testid="display-position">{editData.position}</div>
      <div data-testid="display-position-id">{editData.positionId}</div>
      <EmployeePositionField
        position={editData.position}
        positionId={resolvedPositionId}
        allPositions={allPositions}
        isEditing
        inputClass=""
        onSelectPosition={handlePositionSelect}
      />
    </div>
  );
};

const openDropdown = (): void => {
  fireEvent.click(screen.getByRole("button", { hidden: true }));
};

describe("job title selection", () => {
  it("updates the displayed position when picking an option with an empty Arabic title", () => {
    render(<Harness />);
    openDropdown();
    fireEvent.mouseDown(screen.getByRole("option", { name: "Call Center Agent" }));
    expect(screen.getByTestId("display-position").textContent).toBe("Call Center Agent");
    expect(screen.getByTestId("display-position-id").textContent).toBe("3");
  });

  it("resolves the correct id when two positions share the same displayed name", () => {
    render(<Harness />);
    openDropdown();
    const options = screen.getAllByRole("option", { name: "محاسب" });
    expect(options).toHaveLength(2);
    // Click the SECOND "محاسب" entry (id "4") and verify it doesn't resolve to id "1".
    fireEvent.mouseDown(options[1]);
    expect(screen.getByTestId("display-position-id").textContent).toBe("4");
  });

  it("updates on a second, different selection right after the first", () => {
    render(<Harness />);
    openDropdown();
    fireEvent.mouseDown(screen.getByRole("option", { name: "Call Center Agent" }));
    expect(screen.getByTestId("display-position").textContent).toBe("Call Center Agent");

    openDropdown();
    fireEvent.mouseDown(screen.getAllByRole("option", { name: "محاسب" })[0]);
    expect(screen.getByTestId("display-position").textContent).toBe("محاسب");
    expect(screen.getByTestId("display-position-id").textContent).toBe("1");
  });
});
