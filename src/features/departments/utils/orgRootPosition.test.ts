import { describe, expect, it } from "vitest";
import type { OrgStructureDepartment, OrgStructurePosition } from "@/shared/hooks";
import { findOrgRootPosition } from "./orgRootPosition";

const position = (title: string): OrgStructurePosition =>
  ({ position_id: title, title, title_ar: "", employees: [] }) as unknown as OrgStructurePosition;

const department = (name: string, titles: string[]): OrgStructureDepartment =>
  ({
    department_id: name,
    department: name,
    positions: titles.map(position),
  }) as unknown as OrgStructureDepartment;

describe("findOrgRootPosition", () => {
  it("finds the head position and the department holding it", () => {
    const found = findOrgRootPosition([
      department("Administration", ["Cleaner"]),
      department("General Administration", ["CEO", "Executive Assistant"]),
    ]);

    expect(found?.position.title).toBe("CEO");
    expect(found?.department.department).toBe("General Administration");
  });

  it("matches regardless of casing or stray whitespace", () => {
    expect(findOrgRootPosition([department("X", ["  ceo "])])?.position.title).toBe("  ceo ");
  });

  it("returns null when no head position exists, so the tree renders without one", () => {
    expect(findOrgRootPosition([department("Finance", ["Accountant", "Cashier"])])).toBeNull();
  });

  it("returns null for an empty structure", () => {
    expect(findOrgRootPosition([])).toBeNull();
  });

  it("does not mistake a title that merely contains the word", () => {
    expect(findOrgRootPosition([department("X", ["Deputy CEO", "CEO Assistant"])])).toBeNull();
  });
});
