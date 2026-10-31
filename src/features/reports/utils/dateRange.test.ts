import { describe, expect, it } from "vitest";
import { majorityMonthOfRange } from "@/shared/utils/reports/payrollMonthly";
import { getCurrentMonthRange } from "./dateRange";

describe("getCurrentMonthRange", () => {
  it("spans the calendar month, first day to last", () => {
    expect(getCurrentMonthRange(new Date("2026-10-15T12:00:00Z"))).toEqual({
      from: "2026-10-01",
      to: "2026-10-31",
    });
  });

  it("follows the Baghdad calendar, which is a day ahead of UTC late in the evening", () => {
    // 21:30 UTC on 31 Oct is already 1 Nov in Baghdad.
    expect(getCurrentMonthRange(new Date("2026-10-31T21:30:00Z"))).toEqual({
      from: "2026-11-01",
      to: "2026-11-30",
    });
  });

  it("never starts the month on the previous day", () => {
    const { from } = getCurrentMonthRange(new Date("2026-10-02T00:30:00Z"));
    expect(from).toBe("2026-10-01");
  });
});

describe("majorityMonthOfRange", () => {
  it("names the month holding most of a range that crosses two months", () => {
    expect(majorityMonthOfRange("2026-09-30", "2026-10-30")).toBe("2026-10");
    expect(majorityMonthOfRange("2026-10-01", "2026-10-31")).toBe("2026-10");
  });

  it("takes the later month on a tie", () => {
    expect(majorityMonthOfRange("2026-10-30", "2026-11-02")).toBe("2026-11");
  });

  it("returns null for a range that is not two ordered dates", () => {
    expect(majorityMonthOfRange("", "2026-10-31")).toBeNull();
    expect(majorityMonthOfRange("2026-10-31", "2026-10-01")).toBeNull();
  });
});
