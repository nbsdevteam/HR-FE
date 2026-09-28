import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { arabicSource } from "@/i18n/source";
import type { DbEmployee } from "@/shared/hooks";
import ReportSelectionPanel from "./ReportSelectionPanel";

// The hooks barrel drags in the data layer; the panel only needs the name helper.
vi.mock("@/shared/hooks", () => ({
  empDisplayName: (employee: { name: string }) => employee.name,
}));

const employee = (id: string, name: string, status: string | null) =>
  ({ id, name, arabic_name: "", status }) as DbEmployee;

const EMPLOYEES = [
  employee("1", "Ahmed Ali", "active"),
  employee("2", "Ahmed Saleh", "suspended"),
  employee("3", "Sara Kareem", "onboarding"),
  employee("4", "Omar Hadi", "active"),
  employee("5", "Zaid Noor", null),
];

let latestSelection: string[] = [];

const Harness = ({ showStatusFilter = true }: { showStatusFilter?: boolean }) => {
  const [selected, setSelected] = useState<string[]>([]);
  latestSelection = selected;
  return (
    <ReportSelectionPanel
      employees={EMPLOYEES}
      selectedEmployeeIds={selected}
      fields={[]}
      selectedFieldKeys={[]}
      fieldsLoading={false}
      showColumns={false}
      showStatusFilter={showStatusFilter}
      onSelectedEmployeeIdsChange={setSelected}
      onToggleField={vi.fn()}
      onSelectAllFields={vi.fn()}
      onClearAllFields={vi.fn()}
    />
  );
};

const shownNames = (): string[] =>
  screen.getAllByRole("checkbox").map((box) => box.querySelector("[dir=auto]")?.textContent ?? "");

const tabCount = (): number =>
  Number(screen.getByRole("button", { pressed: true }).textContent?.match(/(\d+)$/)?.[1]);

const pickStatus = (label: string): void => {
  fireEvent.click(screen.getByRole("button", { name: arabicSource("common.status") }));
  fireEvent.mouseDown(screen.getByRole("option", { name: label }));
};

const search = (query: string): void => {
  fireEvent.change(screen.getByPlaceholderText(arabicSource("common.search_for_an_employee")), {
    target: { value: query },
  });
};

const click = (label: string): void => {
  fireEvent.click(screen.getByRole("button", { name: label }));
};

const ALL = arabicSource("reports.all_employees");
const ACTIVE = arabicSource("common.is_active");
const INACTIVE = arabicSource("common.is_inactive");
const SELECT_ALL = arabicSource("common.select_all");
const CLEAR_ALL = arabicSource("common.clear_all");

describe("ReportSelectionPanel status filter", () => {
  it("opens on Active and counts only the employees shown", () => {
    render(<Harness />);
    expect(screen.getByRole("button", { name: arabicSource("common.status") })).toHaveTextContent(ACTIVE);
    expect(shownNames()).toEqual(["Ahmed Ali", "Omar Hadi", "Zaid Noor"]);
    expect(tabCount()).toBe(3);
  });

  it("switches between Inactive and All Employees", () => {
    render(<Harness />);
    pickStatus(INACTIVE);
    expect(shownNames()).toEqual(["Ahmed Saleh", "Sara Kareem"]);
    expect(tabCount()).toBe(2);
    pickStatus(ALL);
    expect(shownNames()).toHaveLength(5);
    expect(tabCount()).toBe(5);
  });

  it("combines the search with the status filter", () => {
    render(<Harness />);
    search("ahmed");
    expect(shownNames()).toEqual(["Ahmed Ali"]);
    expect(tabCount()).toBe(1);
    pickStatus(INACTIVE);
    expect(shownNames()).toEqual(["Ahmed Saleh"]);
  });

  it("Select All takes only the shown employees, and a status switch drops the rest", () => {
    render(<Harness />);
    click(SELECT_ALL);
    expect(latestSelection.sort()).toEqual(["1", "4", "5"]);

    pickStatus(INACTIVE);
    expect(latestSelection).toEqual([]);
    expect(screen.getAllByRole("checkbox").every((box) => box.getAttribute("aria-checked") === "false")).toBe(true);

    click(SELECT_ALL);
    expect(latestSelection.sort()).toEqual(["2", "3"]);
    click(CLEAR_ALL);
    expect(latestSelection).toEqual([]);
  });

  it("keeps selections when widening to All Employees", () => {
    render(<Harness />);
    click(SELECT_ALL);
    pickStatus(ALL);
    expect(latestSelection.sort()).toEqual(["1", "4", "5"]);
    click(CLEAR_ALL);
    expect(latestSelection).toEqual([]);
  });

  it("leaves reports without the filter untouched", () => {
    render(<Harness showStatusFilter={false} />);
    expect(screen.queryByRole("button", { name: arabicSource("common.status") })).toBeNull();
    expect(shownNames()).toHaveLength(5);
    expect(tabCount()).toBe(0);
  });
});
