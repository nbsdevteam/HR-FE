import { describe, expect, it } from "vitest";
import { mapOrgStructureTree } from "@/shared/api/mappers";
import live from "./__fixtures__/orgStructure.live.json";
import {
  departmentSeats,
  departmentStaffOnPositions,
  departmentStaffWithoutPosition,
  employeeMatchId,
  groupPositionsByLevel,
  isDepartmentEmpty,
  isPositionVacant,
  matchStructureIds,
  orgLabel,
  positionMatchId,
  searchStructureNodes,
  structureDepartmentOptions,
  structureJobTitleOptions,
} from "./orgStructure";

/**
 * The fixture is a real `/api/hr/org-structure/tree` response captured from the
 * backend, not a hand-written shape — so these assert against what the server
 * actually sends.
 */
const tree = mapOrgStructureTree(live);
const dept = (name: string) => {
  const found = tree.departments.find((d) => d.department === name);
  if (!found) throw new Error(`fixture is missing department ${name}`);
  return found;
};

describe("org structure — grade must never reach the UI", () => {
  it("carries no grade field anywhere in the mapped tree", () => {
    const blob = JSON.stringify(tree).toLowerCase();
    for (const token of ["grade", "grade_code", "grade_name", "band"]) {
      expect(blob).not.toContain(`"${token}"`);
    }
  });

  it("exposes only the documented keys on a position", () => {
    const position = dept("Warehousing").positions[0];
    expect(Object.keys(position).sort()).toEqual([
      "employee_count",
      "employees",
      "level",
      "position_id",
      "seats",
      "title",
      "title_ar",
      "vacancies",
    ]);
  });
});

describe("groupPositionsByLevel", () => {
  it("groups peers into one band instead of numbering rows", () => {
    // Warehousing is the real case: 5 positions across 2 levels.
    const warehousing = dept("Warehousing");
    const groups = groupPositionsByLevel(warehousing.positions);
    expect(warehousing.positions).toHaveLength(5);
    expect(groups.map((g) => g.level)).toEqual([1, 2]);
    expect(groups[1].positions).toHaveLength(4);
    expect(warehousing.level_count).toBe(2);
  });

  it("preserves the backend order — most senior first", () => {
    const groups = groupPositionsByLevel(dept("Warehousing").positions);
    expect(groups[0].positions[0].title).toBe("Warehouse Supervisor");
  });

  it("keeps a single-level department at level 1", () => {
    const groups = groupPositionsByLevel(dept("Human Resources").positions);
    expect(groups.map((g) => g.level)).toEqual([1]);
  });

  it("returns no groups for a department with no positions", () => {
    expect(groupPositionsByLevel([])).toEqual([]);
  });

  it("puts an unranked position in its own trailing null band", () => {
    const groups = groupPositionsByLevel([
      { position_id: "1", title: "A", title_ar: "", level: 1, seats: 1, employee_count: 0, vacancies: 1, employees: [] },
      { position_id: "2", title: "B", title_ar: "", level: null, seats: 0, employee_count: 0, vacancies: 0, employees: [] },
    ]);
    expect(groups.map((g) => g.level)).toEqual([1, null]);
  });
});

describe("vacancy and seat handling", () => {
  it("treats a position with no employees as vacant and keeps its seats", () => {
    const hrManager = dept("Human Resources").positions[0];
    expect(isPositionVacant(hrManager)).toBe(true);
    expect(hrManager.employees).toEqual([]);
    expect(hrManager.seats).toBeGreaterThan(0);
    expect(hrManager.vacancies).toBe(hrManager.seats);
  });

  it("lists every real employee on a shared position", () => {
    // Call Center / Supervisor is over its establishment on live data.
    const supervisor = dept("Call Center").positions[0];
    expect(isPositionVacant(supervisor)).toBe(false);
    expect(supervisor.employees.length).toBe(supervisor.employee_count);
    expect(supervisor.employees.length).toBeGreaterThan(1);
    expect(supervisor.employees.every((e) => e.name.length > 0)).toBe(true);
  });

  it("never reports negative vacancies when overstaffed", () => {
    const supervisor = dept("Call Center").positions[0];
    expect(supervisor.employee_count).toBeGreaterThan(supervisor.seats);
    expect(supervisor.vacancies).toBe(0);
  });

  it("sums seats and staff across a department", () => {
    const warehousing = dept("Warehousing");
    expect(departmentSeats(warehousing)).toBe(12);
    expect(departmentStaffOnPositions(warehousing)).toBe(0);
  });
});

describe("department employee_count is not the sum of its positions", () => {
  it("reports the remainder as staff without a position", () => {
    // Administration has employees in the department and no positions filled.
    const admin = tree.departments.filter((d) => d.department === "Administration");
    const withStaff = admin.find((d) => d.employee_count > 0);
    expect(withStaff).toBeDefined();
    if (!withStaff) return;
    expect(departmentStaffWithoutPosition(withStaff)).toBe(
      withStaff.employee_count - departmentStaffOnPositions(withStaff),
    );
  });

  it("floors at zero when staff sit on another department's position", () => {
    expect(
      departmentStaffWithoutPosition({
        ...dept("Human Resources"),
        employee_count: 0,
        positions: [
          { position_id: "1", title: "A", title_ar: "", level: 1, seats: 1, employee_count: 3, vacancies: 0, employees: [] },
        ],
      }),
    ).toBe(0);
  });
});

describe("orphan positions and labels", () => {
  it("keeps department-less positions out of every department", () => {
    expect(tree.positions_without_department.length).toBeGreaterThan(0);
    const orphanIds = new Set(
      tree.positions_without_department.map((p) => p.position_id),
    );
    for (const d of tree.departments) {
      for (const p of d.positions) expect(orphanIds.has(p.position_id)).toBe(false);
    }
  });

  it("falls back to the English label when the Arabic one is empty", () => {
    expect(orgLabel("Warehouse Keeper", "")).toBe("Warehouse Keeper");
    expect(orgLabel("Warehouse Keeper", "   ")).toBe("Warehouse Keeper");
    expect(orgLabel("Supervisor", "مشرف")).toBe("مشرف");
  });

  it("recognises a department with nothing to show", () => {
    expect(
      isDepartmentEmpty({ ...dept("Human Resources"), positions: [], employee_count: 0 }),
    ).toBe(true);
    expect(isDepartmentEmpty(dept("Human Resources"))).toBe(false);
  });
});

describe("mapper resilience", () => {
  it("survives a missing payload without throwing", () => {
    const empty = mapOrgStructureTree(undefined);
    expect(empty.departments).toEqual([]);
    expect(empty.positions_without_department).toEqual([]);
    expect(empty.totals.departments).toBe(0);
  });

  it("preserves a null level rather than coercing it to 0", () => {
    const mapped = mapOrgStructureTree({
      departments: [
        { department_id: 1, department: "D", positions: [{ position_id: 9, title: "T", level: null }] },
      ],
    });
    expect(mapped.departments[0].positions[0].level).toBeNull();
  });
});

describe("structure filter options", () => {
  it("lists every department once, in first-seen order", () => {
    const options = structureDepartmentOptions(tree);
    expect(new Set(options).size).toBe(options.length);
    expect(options).toEqual(tree.departments.map((d) => orgLabel(d.department, d.department_ar)).filter((label, index, all) => all.indexOf(label) === index));
  });

  it("lists every position title once, across departments and orphans", () => {
    const options = structureJobTitleOptions(tree);
    expect(new Set(options).size).toBe(options.length);
    const supervisor = dept("Warehousing").positions[0];
    expect(options).toContain(orgLabel(supervisor.title, supervisor.title_ar));
  });

  it("returns nothing for a null tree", () => {
    expect(structureDepartmentOptions(null)).toEqual([]);
    expect(structureJobTitleOptions(null)).toEqual([]);
  });
});

describe("searchStructureNodes", () => {
  it("matches a position by its English title even when the Arabic label is displayed", () => {
    const supervisor = dept("Warehousing").positions[0];
    const hits = searchStructureNodes(tree, "Warehouse Supervisor");
    expect(hits.some((h) => h.kind === "position" && h.id === positionMatchId(supervisor))).toBe(true);
  });

  it("matches a position by department name", () => {
    const hits = searchStructureNodes(tree, "Warehousing");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((h) => h.department === "Warehousing")).toBe(true);
  });

  it("matches an employee by name", () => {
    const supervisor = dept("Call Center").positions[0];
    const employee = supervisor.employees[0];
    const hits = searchStructureNodes(tree, employee.name);
    expect(hits.some((h) => h.kind === "employee" && h.id === employeeMatchId(employee))).toBe(true);
  });

  it("returns nothing for an empty query", () => {
    expect(searchStructureNodes(tree, "")).toEqual([]);
    expect(searchStructureNodes(tree, "   ")).toEqual([]);
  });
});

describe("matchStructureIds", () => {
  it("returns an empty set when nothing is active", () => {
    const matched = matchStructureIds(tree, { query: "", departmentFilter: "", jobTitleFilter: "" });
    expect(matched.size).toBe(0);
  });

  it("marks a position matched by an employee-name query, and the employee too", () => {
    const supervisor = dept("Call Center").positions[0];
    const employee = supervisor.employees[0];
    const matched = matchStructureIds(tree, { query: employee.name, departmentFilter: "", jobTitleFilter: "" });
    expect(matched.has(positionMatchId(supervisor))).toBe(true);
    expect(matched.has(employeeMatchId(employee))).toBe(true);
  });

  it("combines department and job-title filters with AND semantics", () => {
    const warehousing = dept("Warehousing");
    const supervisor = warehousing.positions.find((p) => p.title === "Warehouse Supervisor");
    expect(supervisor).toBeDefined();
    if (!supervisor) return;
    const matched = matchStructureIds(tree, {
      query: "",
      departmentFilter: orgLabel(warehousing.department, warehousing.department_ar),
      jobTitleFilter: orgLabel(supervisor.title, supervisor.title_ar),
    });
    expect(matched.has(positionMatchId(supervisor))).toBe(true);
    const others = warehousing.positions.filter((p) => p.title !== "Warehouse Supervisor");
    others.forEach((p) => expect(matched.has(positionMatchId(p))).toBe(false));
  });
});
