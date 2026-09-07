import { parseISO, isValid } from "date-fns";

/**
 * Parse an "HH:mm" string into numbers, always.
 *
 * `"9:30".split(':').map(Number)` is typed `number[]`, but under
 * `noUncheckedIndexedAccess` every element reads as `number | undefined` —
 * correctly, because the input may have no colon at all. Returns the
 * fallbacks for anything unparseable, so callers get plain `number`s and no
 * guard.
 */
export const parseHhMm = (value: string, fallbackH = 9, fallbackM = 0): [number, number] => {
  const [rawH, rawM] = value.split(":");
  const h = Number(rawH);
  const m = Number(rawM);
  return [
    rawH === undefined || Number.isNaN(h) ? fallbackH : h,
    rawM === undefined || Number.isNaN(m) ? fallbackM : m,
  ];
};

export const focusFirstCalendarDay = (root: HTMLElement): void => {
  const sel = root.querySelector<HTMLButtonElement>(
    "tbody button.rdp-day_selected:not([disabled])",
  );
  const first = root.querySelector<HTMLButtonElement>("tbody button:not([disabled])");
  (sel ?? first)?.focus();
};

export const extractTime = (isoStr: string | undefined): string => {
  if (!isoStr) return "09:00";
  const tIdx = isoStr.indexOf("T");
  if (tIdx !== -1) {
    const part = isoStr.slice(tIdx + 1, tIdx + 6);
    if (/^\d{2}:\d{2}$/.test(part)) return part;
  }
  return "09:00";
};

export const extractDateString = (isoStr: string | undefined): string => {
  if (!isoStr) return "";
  const tIdx = isoStr.indexOf("T");
  return tIdx !== -1 ? isoStr.slice(0, tIdx) : isoStr;
};

/**
 * Parses strings produced by {@link DatePicker}: `yyyy-MM-dd` or `yyyy-MM-dd'T'HH:mm` (local wall time).
 * Also accepts `yyyy-MM-dd HH:mm:ss` from APIs. Returns `null` when empty or invalid.
 */
export const parseDatePickerValueToLocalDate = (value: string | null | undefined): Date | null => {
  const raw = (value ?? "").trim();
  if (!raw) return null;

  const withT = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (withT) {
    const y = Number(withT[1]);
    const mo = Number(withT[2]);
    const d = Number(withT[3]);
    const h = Number(withT[4]);
    const min = Number(withT[5]);
    const out = new Date(y, mo - 1, d, h, min, 0, 0);
    return Number.isNaN(out.getTime()) ? null : out;
  }

  const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const y = Number(dateOnly[1]);
    const mo = Number(dateOnly[2]);
    const d = Number(dateOnly[3]);
    const out = new Date(y, mo - 1, d, 0, 0, 0, 0);
    return Number.isNaN(out.getTime()) ? null : out;
  }

  const withSpace = raw.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (withSpace) {
    const y = Number(withSpace[1]);
    const mo = Number(withSpace[2]);
    const d = Number(withSpace[3]);
    const h = Number(withSpace[4]);
    const min = Number(withSpace[5]);
    const sec = withSpace[6] != null ? Number(withSpace[6]) : 0;
    const out = new Date(y, mo - 1, d, h, min, sec, 0);
    return Number.isNaN(out.getTime()) ? null : out;
  }

  const fallback = parseISO(raw);
  return isValid(fallback) ? fallback : null;
};
