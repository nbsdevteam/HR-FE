export const sid = (v: unknown) => (v === null || v === undefined || v === false ? "" : String(v));
export const sornull = (v: unknown) => (v === null || v === undefined || v === false || v === "" ? null : String(v));
export const num = (v: unknown, d = 0) => (typeof v === "number" ? v : Number(v) || d);
export const bool = (v: unknown) => Boolean(v);
export const empty = "";

/** A row is active unless explicitly marked inactive on either flag Odoo uses. */
export const isActive = (r: { active?: unknown; is_active?: unknown }) =>
  r.active !== false && r.is_active !== false;

export function hhmmFromFloatOrLabel(v: unknown, label?: unknown): string {
  if (typeof label === "string" && label) {
    return label.length === 5 ? `${label}:00` : label;
  }
  if (typeof v === "number") {
    const h = Math.floor(v);
    const m = Math.round((v - h) * 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
  }
  return "08:00:00";
}
