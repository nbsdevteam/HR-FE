/**
 * Lightweight CSV / Excel-friendly export helpers for Reports & Payroll.
 * Excel opens UTF-8 CSV with BOM correctly.
 */

export function downloadCsv(
  filename: string,
  rows: Record<string, unknown>[],
): void {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ];
  const bom = "\uFEFF";
  const blob = new Blob([bom + lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Alias kept for Task 18 naming (Excel opens this CSV). */
export function downloadExcelCsv(
  filename: string,
  rows: Record<string, unknown>[],
): void {
  const base = filename.replace(/\.xlsx$/i, "").replace(/\.csv$/i, "");
  downloadCsv(`${base}.csv`, rows);
}
