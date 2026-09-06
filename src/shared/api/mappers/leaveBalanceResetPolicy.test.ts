import { describe, expect, it } from "vitest";
import { mapLeaveType, mapLeaveBalanceItem } from "./leave";

describe("year-end leave balance policy mapping", () => {
  it("reads an explicit reset policy off a leave type", () => {
    expect(mapLeaveType({ id: 1, balance_reset_policy: "reset_yearly" }).balance_reset_policy)
      .toBe("reset_yearly");
  });

  it("falls back to accumulate when the backend does not send the field", () => {
    expect(mapLeaveType({ id: 1 }).balance_reset_policy).toBe("accumulate");
  });

  it("falls back to accumulate for a value it does not recognise", () => {
    expect(mapLeaveType({ id: 1, balance_reset_policy: "every_other_tuesday" }).balance_reset_policy)
      .toBe("accumulate");
  });

  it("carries the policy and the leave year onto a balance row", () => {
    const row = mapLeaveBalanceItem({
      leave_type_id: 7,
      balance_reset_policy: "reset_yearly",
      balance_resets_yearly: true,
      leave_year_start: "2026-01-01",
      leave_year_end: "2026-12-31",
    });
    expect(row.balance_resets_yearly).toBe(true);
    expect(row.leave_year_end).toBe("2026-12-31");
  });

  it("leaves the leave year null on a backend that does not send it", () => {
    const row = mapLeaveBalanceItem({ leave_type_id: 7 });
    expect(row.balance_reset_policy).toBe("accumulate");
    expect(row.leave_year_start).toBeNull();
  });
});
