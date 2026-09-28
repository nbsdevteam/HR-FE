import { describe, expect, it } from "vitest";
import { arabicSource } from "@/i18n/source";
import { matchesEmployeeStatusFilter } from "./employeeStatusFilter";

// Every `lugal_hr_status` value the backend can serialize for a listed employee.
const INACTIVE_CODES = ["onboarding", "inactive", "suspended", "ended", "exited"];

describe("matchesEmployeeStatusFilter", () => {
  it("counts 'active', the legacy Arabic value and an unset status as active", () => {
    for (const status of ["active", "ACTIVE", arabicSource("common.is_active"), null]) {
      expect(matchesEmployeeStatusFilter(status, "active")).toBe(true);
      expect(matchesEmployeeStatusFilter(status, "inactive")).toBe(false);
    }
  });

  it("counts every other HR status as inactive", () => {
    for (const status of INACTIVE_CODES) {
      expect(matchesEmployeeStatusFilter(status, "active")).toBe(false);
      expect(matchesEmployeeStatusFilter(status, "inactive")).toBe(true);
    }
  });

  it("lets 'all' through regardless of status", () => {
    for (const status of ["active", null, ...INACTIVE_CODES]) {
      expect(matchesEmployeeStatusFilter(status, "all")).toBe(true);
    }
  });
});
