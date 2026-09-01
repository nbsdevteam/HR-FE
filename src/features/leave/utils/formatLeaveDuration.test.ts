import { describe, expect, it } from "vitest";
import type { DbLeaveRequest } from "@/shared/hooks";
import { formatLeaveDuration } from "./formatLeaveDuration";

/** Only the fields `formatLeaveDuration` reads; the rest of the row is irrelevant here. */
const leave = (over: Partial<DbLeaveRequest>): DbLeaveRequest =>
  ({
    days: 1,
    is_half_day: false,
    is_hourly: false,
    requested_hours: 0,
    number_of_hours: 0,
    hour_from: 0,
    hour_to: 0,
    ...over,
  }) as DbLeaveRequest;

describe("formatLeaveDuration", () => {
  it("states a half day as the 0.5 days the backend books", () => {
    // The backend now returns number_of_days = 0.5 for half_day: true. Pairing
    // that with a "half a day" unit used to read "0.5 half a day".
    expect(formatLeaveDuration(leave({ days: 0.5, is_half_day: true }))).toBe("0.5 يوم");
  });

  it("keeps whole-day counts unchanged", () => {
    expect(formatLeaveDuration(leave({ days: 3 }))).toBe("3.0 يوم");
  });

  it("leaves hourly leave alone", () => {
    expect(
      formatLeaveDuration(
        leave({
          is_hourly: true,
          requested_hours: 2,
          number_of_hours: 2,
          hour_from: 9,
          hour_to: 11,
        }),
      ),
    ).toBe("2 ساعة (09:00–11:00)");
  });
});
