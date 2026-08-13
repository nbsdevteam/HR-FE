/**
 * Asia/Baghdad timezone helpers for device-sync → Odoo.
 * Device punches are wall-clock Baghdad; Odoo Datetime is UTC-naive.
 * Conversion uses Intl IANA (Asia/Baghdad), not a hardcoded offset constant.
 */

export const HR_BUSINESS_TZ = "Asia/Baghdad";

/**
 * Convert Baghdad local date+time to Odoo UTC-naive "YYYY-MM-DD HH:MM:SS".
 * @param {string} dateStr - YYYY-MM-DD (Baghdad calendar date)
 * @param {string} timeStr - HH:MM or HH:MM:SS (Baghdad wall clock)
 */
export function baghdadLocalToOdooUtc(dateStr, timeStr) {
  const t = (timeStr || "00:00:00").length === 5 ? `${timeStr}:00` : timeStr;
  const [Y, M, D] = String(dateStr).split("-").map(Number);
  const [h, m, s] = String(t).split(":").map(Number);
  if (![Y, M, D, h, m].every((n) => Number.isFinite(n))) {
    throw new Error(`Invalid Baghdad local datetime: ${dateStr}T${t}`);
  }

  // Guess UTC as if components were UTC, then correct using Asia/Baghdad wall clock.
  let guess = Date.UTC(Y, M - 1, D, h, m, s || 0);
  const wanted = Date.UTC(Y, M - 1, D, h, m, s || 0);
  for (let i = 0; i < 4; i++) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: HR_BUSINESS_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(new Date(guess));
    const get = (type) => parts.find((p) => p.type === type)?.value || "00";
    let hour = get("hour");
    if (hour === "24") hour = "00";
    const shown = Date.UTC(
      Number(get("year")),
      Number(get("month")) - 1,
      Number(get("day")),
      Number(hour),
      Number(get("minute")),
      Number(get("second")),
    );
    const delta = wanted - shown;
    if (delta === 0) break;
    guess += delta;
  }
  return new Date(guess).toISOString().slice(0, 19).replace("T", " ");
}
