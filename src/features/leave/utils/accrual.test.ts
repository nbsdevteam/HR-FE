import { describe, expect, it } from "vitest";
import type { DbLeaveAccrualEntry } from "@/shared/hooks";
import {
  accrualProgressPercent,
  addDaysToIsoDate,
  addMonthsToIsoDate,
  earliestLeaveStartDate,
  firstAccrualDate,
  formatLeaveDays,
  withRunningTotals,
} from "./accrual";

const entry = (
  id: string,
  period_date: string,
  period_sequence: number,
  days: number,
): DbLeaveAccrualEntry => ({
  id,
  leave_type_id: "1",
  leave_type_name: "Annual Leave",
  period_date,
  period_sequence,
  days,
  state: "validate",
  name: `accrual ${period_date}`,
});

describe("addDaysToIsoDate", () => {
  it("moves across a month boundary", () => {
    expect(addDaysToIsoDate("2026-03-31", 1)).toBe("2026-04-01");
  });

  it("returns an empty string for a missing date", () => {
    expect(addDaysToIsoDate(null, 1)).toBe("");
  });
});

describe("addMonthsToIsoDate", () => {
  it("keeps the joining day of the month", () => {
    expect(addMonthsToIsoDate("2026-01-15", 1)).toBe("2026-02-15");
  });

  it("clamps a month-end joiner to a shorter month without drifting", () => {
    expect(addMonthsToIsoDate("2026-01-31", 1)).toBe("2026-02-28");
    // Measured from the joining date, so the next period returns to the 31st.
    expect(addMonthsToIsoDate("2026-01-31", 2)).toBe("2026-03-31");
  });

  it("rolls over the year", () => {
    expect(addMonthsToIsoDate("2026-12-01", 1)).toBe("2027-01-01");
  });
});

describe("earliestLeaveStartDate / firstAccrualDate", () => {
  it("opens booking the day after probation ends", () => {
    expect(earliestLeaveStartDate("2026-03-31")).toBe("2026-04-01");
  });

  it("grants nothing on the joining date itself", () => {
    expect(firstAccrualDate("2026-01-01")).toBe("2026-02-01");
    expect(firstAccrualDate(null)).toBe("");
  });
});

describe("formatLeaveDays", () => {
  it("never rounds quarter-day balances to whole days", () => {
    expect(formatLeaveDays(5.25)).toBe("5.25");
    expect(formatLeaveDays(3.5)).toBe("3.5");
  });

  it("keeps at least one decimal", () => {
    expect(formatLeaveDays(21)).toBe("21.0");
  });
});

describe("accrualProgressPercent", () => {
  it("measures the earned share of the annual entitlement", () => {
    expect(accrualProgressPercent(5.25, 21)).toBe(25);
  });

  it("stays in range when entitlement is missing or exceeded", () => {
    expect(accrualProgressPercent(5, 0)).toBe(0);
    expect(accrualProgressPercent(42, 21)).toBe(100);
  });
});

describe("withRunningTotals", () => {
  const items = [
    entry("103", "2026-04-01", 3, 1.75),
    entry("102", "2026-03-01", 2, 1.75),
    entry("101", "2026-02-01", 1, 1.75),
  ];

  it("accumulates from the oldest row upward", () => {
    const rows = withRunningTotals(items);
    expect(rows.map((row) => row.running_total)).toEqual([5.25, 3.5, 1.75]);
  });

  it("matches the backend total on the newest row", () => {
    const rows = withRunningTotals(items);
    expect(rows[0].running_total).toBe(items.reduce((sum, item) => sum + item.days, 0));
  });

  it("handles an empty history", () => {
    expect(withRunningTotals([])).toEqual([]);
  });
});
