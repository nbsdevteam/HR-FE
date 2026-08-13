import { describe, expect, it } from "vitest";
import { HR_BUSINESS_TZ, odooUtcNaiveToBaghdadTime } from "./timezone";
import { mapAttendance } from "./api/mappers";

describe("odooUtcNaiveToBaghdadTime", () => {
  it("uses Asia/Baghdad as the business timezone", () => {
    expect(HR_BUSINESS_TZ).toBe("Asia/Baghdad");
  });

  it("converts the audit example UTC → Baghdad", () => {
    // Odoo: 2026-08-12 09:32:41 UTC → HR UI: 12:32:41 Baghdad
    expect(odooUtcNaiveToBaghdadTime("2026-08-12 09:32:41")).toBe("12:32:41");
  });

  it("converts 05:00 UTC → 08:00 Baghdad", () => {
    expect(odooUtcNaiveToBaghdadTime("2026-08-12 05:00:00")).toBe("08:00:00");
  });

  it("accepts ISO T separator and trailing Z", () => {
    expect(odooUtcNaiveToBaghdadTime("2026-08-12T09:32:41")).toBe("12:32:41");
    expect(odooUtcNaiveToBaghdadTime("2026-08-12T09:32:41Z")).toBe("12:32:41");
  });

  it("handles UTC midnight → 03:00 Baghdad", () => {
    expect(odooUtcNaiveToBaghdadTime("2026-08-12 00:00:00")).toBe("03:00:00");
  });

  it("handles late UTC evening rolling into next Baghdad morning", () => {
    // 21:30 UTC = 00:30 next calendar day in Asia/Baghdad
    expect(odooUtcNaiveToBaghdadTime("2026-08-12 21:30:00")).toBe("00:30:00");
    // 22:00 UTC = 01:00 next day Baghdad
    expect(odooUtcNaiveToBaghdadTime("2026-08-12 22:00:00")).toBe("01:00:00");
  });

  it("passes through time-only strings without inventing a date", () => {
    expect(odooUtcNaiveToBaghdadTime("08:30:00")).toBe("08:30:00");
    expect(odooUtcNaiveToBaghdadTime("8:05")).toBe("08:05:00");
  });

  it("returns null for empty / invalid input", () => {
    expect(odooUtcNaiveToBaghdadTime(null)).toBeNull();
    expect(odooUtcNaiveToBaghdadTime("")).toBeNull();
    expect(odooUtcNaiveToBaghdadTime("not-a-date")).toBeNull();
  });
});

describe("mapAttendance Baghdad times", () => {
  it("maps check_in / check_out UTC-naive fields to Baghdad clock times", () => {
    const row = mapAttendance({
      id: 12719,
      employee_id: 1,
      employee_name: "Omar.T",
      date: "2026-08-12",
      check_in: "2026-08-12 09:32:41",
      check_out: "2026-08-12 14:00:00",
      worked_hours: 4.5,
    });
    expect(row.check_in_time).toBe("12:32:41");
    expect(row.check_out_time).toBe("17:00:00");
  });
});
