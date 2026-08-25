import { arabicSource } from "@/i18n/source";
import type { DbLeaveRequest } from "@/shared/hooks";

const formatHour = (h: number): string => {
  const hours = Math.floor(h);
  const minutes = Math.round((h - hours) * 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

/**
 * "N hours (09:00–12:00)" for an hourly leave, or the existing "N days" label
 * otherwise. Appends the Odoo-computed effective hours only when they differ
 * from what was requested (window overlapping non-working time) — showing it
 * unconditionally would just repeat the same number on every common case.
 */
export const formatLeaveDuration = (leave: DbLeaveRequest): string => {
  if (leave.is_hourly) {
    const base = `${leave.requested_hours} ${arabicSource("common.hours")} (${formatHour(leave.hour_from)}–${formatHour(leave.hour_to)})`;
    if (leave.number_of_hours !== leave.requested_hours) {
      return `${base} · ${arabicSource("leave.effective_hours")}: ${leave.number_of_hours}`;
    }
    return base;
  }
  return `${leave.days} ${leave.is_half_day ? arabicSource("common.half_a_day") : arabicSource("common.days_2")}`;
};
