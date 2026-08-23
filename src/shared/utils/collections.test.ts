import { describe, expect, it } from "vitest";
import { countBy, groupBy, indexBy } from "./collections";

type Employee = { id: string; managerId: string | null; dept: string };

const employees: Employee[] = [
  { id: "1", managerId: null, dept: "eng" },
  { id: "2", managerId: "1", dept: "eng" },
  { id: "3", managerId: "1", dept: "hr" },
];

describe("indexBy", () => {
  it("builds an id lookup", () => {
    const index = indexBy(employees, (e) => e.id);
    expect(index.get("2")).toEqual({ id: "2", managerId: "1", dept: "eng" });
    expect(index.size).toBe(3);
  });

  it("skips null and undefined keys rather than indexing them", () => {
    const index = indexBy(employees, (e) => e.managerId);
    expect(index.has("1")).toBe(true);
    expect(index.size).toBe(1);
  });

  it("lets later duplicates win, matching last-write semantics", () => {
    const index = indexBy(
      [
        { id: "a", v: 1 },
        { id: "a", v: 2 },
      ],
      (x) => x.id
    );
    expect(index.get("a")?.v).toBe(2);
  });

  it("returns an empty map for an empty list", () => {
    expect(indexBy([], (x: Employee) => x.id).size).toBe(0);
  });
});

describe("groupBy", () => {
  it("buckets items by key, preserving order within a bucket", () => {
    const groups = groupBy(employees, (e) => e.dept);
    expect(groups.get("eng")?.map((e) => e.id)).toEqual(["1", "2"]);
    expect(groups.get("hr")?.map((e) => e.id)).toEqual(["3"]);
  });

  it("omits items with a null key", () => {
    const groups = groupBy(employees, (e) => e.managerId);
    expect(groups.get("1")?.map((e) => e.id)).toEqual(["2", "3"]);
    expect(groups.size).toBe(1);
  });
});

describe("countBy", () => {
  it("counts occurrences per key in one pass", () => {
    const counts = countBy(employees, (e) => e.dept);
    expect(counts.get("eng")).toBe(2);
    expect(counts.get("hr")).toBe(1);
  });

  it("returns an empty map for an empty list", () => {
    expect(countBy([], (x: Employee) => x.dept).size).toBe(0);
  });
});
