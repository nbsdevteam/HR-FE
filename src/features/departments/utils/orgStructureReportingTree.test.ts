import { describe, expect, it } from "vitest";
import { mapOrgStructureTree } from "@/shared/api/mappers";
import live from "./__fixtures__/orgStructure.live.json";

/**
 * `reporting_tree` / `reporting_tree_is_flat` mapper coverage. Split out of
 * `orgStructure.test.ts` to keep that file under the 300-line cap.
 *
 * The captured `orgStructure.live.json` fixture predates the reporting-line
 * feature, so it has no `reporting_tree` key — that's the resilience case
 * below. The nesting itself is synthesised, matching the shape
 * `models/hr_department.py::_lugal_nest_by_reporting_line()` sends.
 */
describe("reporting tree mapper", () => {
  it("defaults to an empty, non-flat tree when reporting_tree is absent from the payload", () => {
    const tree = mapOrgStructureTree(live);
    expect(tree.reporting_tree).toEqual([]);
    expect(tree.reporting_tree_is_flat).toBe(false);
  });

  it("maps nested nodes and normalises Odoo's false into null", () => {
    const mapped = mapOrgStructureTree({
      reporting_tree: [
        {
          position_id: 1,
          title: "CEO",
          title_ar: "",
          level: 1,
          seats: 1,
          employee_count: 0,
          vacancies: 1,
          employees: [],
          reports_to_position_id: false,
          department_id: 2,
          department: "General Administration",
          department_ar: "",
          children: [
            {
              position_id: 3,
              title: "HR Manager",
              title_ar: "",
              level: 1,
              seats: 1,
              employee_count: 0,
              vacancies: 1,
              employees: [],
              reports_to_position_id: 1,
              department_id: false,
              department: "",
              department_ar: "",
              children: [],
            },
          ],
        },
      ],
      reporting_tree_is_flat: false,
    });

    const [root] = mapped.reporting_tree;
    expect(root.reports_to_position_id).toBeNull();
    expect(root.department_id).toBe("2");
    expect(root.children).toHaveLength(1);
    expect(root.children[0].reports_to_position_id).toBe("1");
    expect(root.children[0].department_id).toBeNull();
  });

  it("flags a flat tree honestly rather than inventing nesting", () => {
    const mapped = mapOrgStructureTree({
      reporting_tree: [
        { position_id: 1, title: "A", reports_to_position_id: false, department_id: false, children: [] },
        { position_id: 2, title: "B", reports_to_position_id: false, department_id: false, children: [] },
      ],
      reporting_tree_is_flat: true,
    });

    expect(mapped.reporting_tree_is_flat).toBe(true);
    expect(mapped.reporting_tree.every((node) => node.children.length === 0)).toBe(true);
  });
});
