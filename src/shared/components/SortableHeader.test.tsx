import { describe, expect, it } from "vitest";
import { toggleSort, type SortDefaults } from "./SortableHeader";

type Key = "name" | "dept" | "salary";
type Dir = "asc" | "desc";
type Sort = { key: Key; dir: Dir };

const DEFAULTS: SortDefaults<Key> = { key: "name", dir: "asc" };

/** Applies one header click to `state` the same way the tables do. */
const click = (state: Sort, key: Key, defaults: SortDefaults<Key> = DEFAULTS): Sort => {
  const next = { ...state };
  toggleSort(
    key,
    state.key,
    state.dir,
    (k) => {
      next.key = k;
    },
    (d) => {
      next.dir = d;
    },
    defaults,
  );
  return next;
};

describe("toggleSort", () => {
  it("starts an unselected column at asc", () => {
    expect(click(DEFAULTS, "dept")).toEqual({ key: "dept", dir: "asc" });
  });

  it("goes asc → desc → back to the default on the third click", () => {
    const first = click(DEFAULTS, "dept");
    const second = click(first, "dept");
    const third = click(second, "dept");
    expect(second).toEqual({ key: "dept", dir: "desc" });
    expect(third).toEqual(DEFAULTS);
  });

  it("restores a descending default, not just asc", () => {
    const defaults: SortDefaults<Key> = { key: "salary", dir: "desc" };
    const start: Sort = { key: "salary", dir: "desc" };
    const third = click(click(click(start, "name", defaults), "name", defaults), "name", defaults);
    expect(third).toEqual({ key: "salary", dir: "desc" });
  });

  it("just flips the default column, since there is nothing to cancel back to", () => {
    const flipped = click(DEFAULTS, "name");
    expect(flipped).toEqual({ key: "name", dir: "desc" });
    expect(click(flipped, "name")).toEqual(DEFAULTS);
  });

  it("switching columns mid-cycle starts the new column at asc", () => {
    const onDept = click(click(DEFAULTS, "dept"), "dept");
    expect(click(onDept, "salary")).toEqual({ key: "salary", dir: "asc" });
  });
});
