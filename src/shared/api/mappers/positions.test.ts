import { describe, expect, it } from "vitest";
import { mapPosition } from "./positions";

describe("mapPosition", () => {
  it("maps the new job-title fields (department_name, reports_to_job_name, employee_count)", () => {
    const position = mapPosition({
      id: 17,
      title_ar: "مشرف مخازن",
      name: "Warehouse Supervisor",
      department_id: 4,
      department_name: "Warehouses",
      reports_to_job_id: 11,
      reports_to_job_name: "Supply Chain Manager",
      level: 3,
      max_headcount: 2,
      employee_count: 2,
      description: "Runs the warehouse floor",
      active: true,
    });

    expect(position.title_ar).toBe("مشرف مخازن");
    expect(position.title_en).toBe("Warehouse Supervisor");
    expect(position.department_id).toBe("4");
    expect(position.department_name).toBe("Warehouses");
    expect(position.reports_to_position_id).toBe("11");
    expect(position.reports_to_job_name).toBe("Supply Chain Manager");
    expect(position.employee_count).toBe(2);
    expect(position.is_active).toBe(true);
  });

  it("defaults missing relational fields to null/zero rather than throwing", () => {
    const position = mapPosition({ id: 1, title_ar: "محاسب" });

    expect(position.department_name).toBeNull();
    expect(position.reports_to_job_name).toBeNull();
    expect(position.employee_count).toBe(0);
  });
});
