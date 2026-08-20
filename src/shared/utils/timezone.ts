/**
 * Company business timezone for all HR attendance/business datetime display.
 * Odoo stores Datetime as UTC-naive; UI must show Asia/Baghdad wall clock.
 */
export const HR_BUSINESS_TZ = "Asia/Baghdad";

/**
 * Convert an Odoo UTC-naive datetime string to HH:MM:SS in Asia/Baghdad.
 *
 * Input examples:
 *   "2026-08-12 09:32:41"  →  "12:32:41"
 *   "2026-08-12T09:32:41"  →  "12:32:41"
 *   "2026-08-12T09:32:41Z" →  "12:32:41"
 *
 * Time-only strings (no date) are returned as-is (cannot convert without a date).
 */
export const odooUtcNaiveToBaghdadTime = (
  dt: string | null | undefined,
): string | null => {
  if (dt == null || dt === "") return null;
  const raw = String(dt).trim();
  if (!raw) return null;

  // Already a clock time with no date — leave unchanged.
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(raw)) {
    const parts = raw.split(":");
    const hh = parts[0].padStart(2, "0");
    const mm = (parts[1] || "00").padStart(2, "0");
    const ss = (parts[2] || "00").padStart(2, "0").slice(0, 2);
    return `${hh}:${mm}:${ss}`;
  }

  const normalized = raw.replace("T", " ").replace(/Z$/i, "").trim();
  const match = normalized.match(
    /^(\d{4}-\d{2}-\d{2})[ ](\d{2}):(\d{2})(?::(\d{2}))?/,
  );
  if (!match) return null;

  const [, datePart, hh, mm, ss = "00"] = match;
  const utc = new Date(`${datePart}T${hh}:${mm}:${ss}Z`);
  if (Number.isNaN(utc.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: HR_BUSINESS_TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(utc);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "00";

  // Some engines emit "24" for midnight under hour12:false.
  let hour = get("hour");
  if (hour === "24") hour = "00";

  return `${hour}:${get("minute")}:${get("second")}`;
};
