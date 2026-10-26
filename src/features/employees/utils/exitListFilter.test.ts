import { describe, expect, it } from "vitest";
import { mapExitProcess } from "@/shared/api/mappers/lifecycle";
import type { DbExitProcess } from "@/shared/hooks";
import { exitFilterCounts, exitMatchesFilter, sortExits } from "./exitListFilter";
import { progressAt } from "./exitProgress.fixtures";

const proc = (id: number, status: string, days: number | null): DbExitProcess =>
  mapExitProcess({ id, employee_id: id, status, progress: progressAt(status === "cancelled" ? "in_progress" : status, { days_in_stage: days }) });

const all = [proc(1, "approval", 5), proc(2, "clearance", 2), proc(3, "completed", null), proc(4, "settlement", 9), proc(5, "cancelled", null)];
const mine: ReadonlySet<string> = new Set(["2", "4"]);

describe("exit list filters", () => {
  it("counts every chip from the loaded rows", () => {
    expect(exitFilterCounts(all, mine)).toEqual({
      needs_me: 2, open: 3, in_progress: 0, approval: 1, clearance: 1, settlement: 1, completed: 1, cancelled: 1,
    });
  });

  it("matches Needs me by My tasks, All open by stage, and a stage chip by status", () => {
    expect(all.filter(p => exitMatchesFilter(p, "needs_me", mine)).map(p => p.id)).toEqual(["2", "4"]);
    expect(all.filter(p => exitMatchesFilter(p, "open", mine)).map(p => p.id)).toEqual(["1", "2", "4"]);
    expect(all.filter(p => exitMatchesFilter(p, "completed", mine)).map(p => p.id)).toEqual(["3"]);
  });

  it("sorts open first with the longest wait on top, closed ones after in their own order", () => {
    expect(sortExits(all).map(p => p.id)).toEqual(["4", "1", "2", "3", "5"]);
  });
});
