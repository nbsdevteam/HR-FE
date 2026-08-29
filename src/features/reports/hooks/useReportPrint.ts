import { useCallback } from "react";
import i18n, { getLanguageDirection, normalizeLanguage } from "@/i18n";
import { formatDateTime } from "@/i18n/format";
import { translateArabicSource, translateCataloguedValue } from "@/i18n/legacy";
import { arabicSource } from "@/i18n/source";
import type { DbReportTemplate } from "@/shared/hooks";
import type { ReportColumn, ReportRow } from "../types";

type UseReportPrintArgs = {
  template: DbReportTemplate | null;
  generatedData: ReportRow[] | null;
  generatedColumns: ReportColumn[] | null;
  filterDept: string;
  dateFrom: string;
  dateTo: string;
  selectedEmployeeIds: string[];
};

const LANDSCAPE_COLUMN_THRESHOLD = 6;

const escapeHtml = (value: unknown): string => {
  const str = value === null || value === undefined || value === "" ? "—" : String(value);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};

/**
 * Renders the generated report as a standalone printable document (full data
 * set, not just the on-screen preview slice) instead of relying on
 * window.print(), which just rasterizes whatever is currently visible inside
 * the scrollable modal.
 */
export const useReportPrint = ({
  template,
  generatedData,
  generatedColumns,
  filterDept,
  dateFrom,
  dateTo,
  selectedEmployeeIds,
}: UseReportPrintArgs) => {
  const handlePrint = useCallback(() => {
    if (!template || !generatedData || !generatedColumns) return;
    const w = window.open("", "_blank");
    if (!w) return;

    const language = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);
    const direction = getLanguageDirection(language);

    const title = translateArabicSource(template.name_ar, language);
    const subtitle = template.description
      ? translateArabicSource(template.description, language)
      : "";
    const product = translateArabicSource(arabicSource("shared.human_resources_system"), language);
    const generatedByLabel = translateArabicSource(arabicSource("common.human_resources_manager"), language);
    const createdOnLabel = translateArabicSource(arabicSource("exports.created_on"), language);
    const sectionLabel = translateArabicSource(arabicSource("reports.section"), language);
    const fromLabel = translateArabicSource(arabicSource("reports.from"), language);
    const toLabel = translateArabicSource(arabicSource("reports.to"), language);
    const employeesSelectedLabel = translateArabicSource(arabicSource("reports.employees_selected"), language);
    const columnsIncludedLabel = translateArabicSource(arabicSource("reports.columns_included"), language);
    const recordLabel = translateArabicSource(arabicSource("common.record"), language);
    const generatedAt = formatDateTime(new Date());

    const metaParts = [
      filterDept ? `${sectionLabel} ${translateCataloguedValue(filterDept, language)}` : null,
      dateFrom ? `${fromLabel} ${dateFrom}` : null,
      dateTo ? `${toLabel} ${dateTo}` : null,
      `${selectedEmployeeIds.length} ${employeesSelectedLabel}`,
      `${generatedColumns.length} ${columnsIncludedLabel}`,
      `${generatedData.length} ${recordLabel}`,
    ].filter((part): part is string => Boolean(part));

    const headerCells = generatedColumns
      .map((col) => `<th>${escapeHtml(translateCataloguedValue(col.label, language))}</th>`)
      .join("");

    const bodyRows = generatedData
      .map((row, index) => {
        const cells = generatedColumns
          .map((col) => `<td>${escapeHtml(translateCataloguedValue(String(row[col.key] ?? ""), language))}</td>`)
          .join("");
        return `<tr><td class="idx">${index + 1}</td>${cells}</tr>`;
      })
      .join("");

    const pageSize = generatedColumns.length > LANDSCAPE_COLUMN_THRESHOLD ? "landscape" : "portrait";

    w.document.write(`<!DOCTYPE html><html dir="${direction}" lang="${language}"><head><meta charset="UTF-8"><title>${escapeHtml(title)}</title>
      <style>@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap');
      *{margin:0;padding:0;box-sizing:border-box;font-family:'Tajawal',sans-serif}
      body{background:#fff;color:#111827;padding:32px;direction:${direction}}
      .ph{text-align:center;margin-bottom:20px;border-bottom:2px solid #e5e7eb;padding-bottom:16px}
      .ph h1{font-size:20px;color:#1f2937}.ph p{font-size:13px;color:#6b7280;margin-top:4px}
      .meta{display:flex;flex-wrap:wrap;gap:6px 20px;justify-content:center;font-size:12px;color:#4b5563;margin-bottom:20px}
      table{width:100%;border-collapse:collapse;font-size:11px}
      thead{display:table-header-group}
      tr{break-inside:avoid;page-break-inside:avoid}
      th,td{border:1px solid #e5e7eb;padding:6px 8px;text-align:${direction === "rtl" ? "right" : "left"};white-space:normal;word-break:break-word}
      th{background:#f3f4f6;color:#1f2937;font-weight:700}
      td.idx,th:first-child{color:#9ca3af;width:36px;text-align:center}
      tbody tr:nth-child(even){background:#fafafa}
      .pf{text-align:center;margin-top:20px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af}
      @media print{body{padding:10px}@page{size:${pageSize};margin:12mm}}</style></head>
      <body>
        <div class="ph"><h1>${escapeHtml(title)}</h1>${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}</div>
        <div class="meta">${metaParts.map((part) => `<span>${escapeHtml(part)}</span>`).join("")}</div>
        <table>
          <thead><tr><th>#</th>${headerCells}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
        <div class="pf">${escapeHtml(createdOnLabel)} ${escapeHtml(generatedAt)} — ${escapeHtml(product)} · ${escapeHtml(generatedByLabel)}</div>
      </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  }, [template, generatedData, generatedColumns, filterDept, dateFrom, dateTo, selectedEmployeeIds]);

  return { handlePrint };
};
