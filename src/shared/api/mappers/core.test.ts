import { describe, expect, it } from "vitest";
import { mapDepartment, mapDepartmentTree, mapDepartmentMetadata } from "./core";

describe("mapDepartment", () => {
  it("keeps the existing Arabic-preferred `name` while exposing name_en/name_ar separately", () => {
    const dept = mapDepartment({
      id: 4,
      name: "Warehouses",
      name_ar: "المخازن",
      complete_name: "Supply Chain / Warehouses",
      parent_id: 3,
      parent_name: "Supply Chain",
      sort_order: 20,
      employee_count: 12,
      active: true,
    });

    expect(dept.name).toBe("المخازن");
    expect(dept.name_en).toBe("Warehouses");
    expect(dept.name_ar).toBe("المخازن");
    expect(dept.complete_name).toBe("Supply Chain / Warehouses");
    expect(dept.parent_id).toBe("3");
    expect(dept.parent_name).toBe("Supply Chain");
    expect(dept.sort_order).toBe(20);
    expect(dept.employee_count).toBe(12);
    expect(dept.is_active).toBe(true);
  });

  it("treats a row without an explicit `active` flag as active", () => {
    const dept = mapDepartment({ id: 1, name: "HR" });
    expect(dept.is_active).toBe(true);
    expect(dept.parent_id).toBeNull();
    expect(dept.parent_name).toBeNull();
    expect(dept.employee_count).toBe(0);
  });

  it("treats an explicit active:false row as archived", () => {
    const dept = mapDepartment({ id: 1, name: "HR", active: false });
    expect(dept.is_active).toBe(false);
  });
});

describe("mapDepartmentTree", () => {
  it("recursively maps children and carries total_employee_count", () => {
    const node = mapDepartmentTree({
      id: 1,
      name: "General Administration",
      employee_count: 7,
      total_employee_count: 52,
      children: [
        { id: 3, name: "Supply Chain", employee_count: 8, total_employee_count: 20, children: [] },
      ],
    });

    expect(node.total_employee_count).toBe(52);
    expect(node.children).toHaveLength(1);
    expect(node.children[0].name).toBe("Supply Chain");
    expect(node.children[0].total_employee_count).toBe(20);
    expect(node.children[0].children).toEqual([]);
  });
});

describe("mapDepartmentMetadata", () => {
  it("maps snake_case permission flags to camelCase", () => {
    const metadata = mapDepartmentMetadata({
      shifts: [{ value: "1", label: "Morning" }],
      can_manage: true,
      can_create: true,
      can_edit: false,
      can_delete: false,
    });

    expect(metadata.shifts).toEqual([{ value: "1", label: "Morning" }]);
    expect(metadata.canManage).toBe(true);
    expect(metadata.canCreate).toBe(true);
    expect(metadata.canEdit).toBe(false);
    expect(metadata.canDelete).toBe(false);
  });
});
