/**
 * Utility for setting dynamic document titles, especially for reports.
 * This ensures each report/page saves with a proper filename when printing to PDF.
 */

import i18n from "../i18n";

const DEFAULT_TITLE_KEY = "shared.human_resources_system";
const REPORT_TITLE_ATTR = "data-report-title";
let currentCustomTitle: string | null = null;

function applyDocumentTitle(title: string, lock = true): void {
  if (typeof document === "undefined") return;
  document.title = title;
  const tag = document.querySelector("title");
  if (tag) tag.textContent = title;
  if (lock) document.documentElement.setAttribute(REPORT_TITLE_ATTR, title);
  else document.documentElement.removeAttribute(REPORT_TITLE_ATTR);
}

export function getLockedReportTitle(): string | null {
  if (typeof document === "undefined") return currentCustomTitle;
  return document.documentElement.getAttribute(REPORT_TITLE_ATTR) || currentCustomTitle;
}

/**
 * Set a custom document title.
 * Use this when displaying reports or specific pages that should have unique names.
 */
export function setDocumentTitle(title: string, isTranslationKey = false): void {
  if (typeof document === "undefined") return;

  currentCustomTitle = title;
  const resolvedTitle = isTranslationKey ? i18n.t(title) : title;
  applyDocumentTitle(resolvedTitle || i18n.t(DEFAULT_TITLE_KEY));
}

/**
 * Set document title for a specific report.
 * Formats the title as: "2026-08-01 to 2026-08-31 - Punch Audit Report"
 * so Save as PDF uses the date range plus the report header name.
 */
export function setReportTitle(reportName: string, date?: string): void {
  if (typeof document === "undefined") return;

  const title = date ? `${date} - ${reportName}` : reportName;
  currentCustomTitle = title;
  applyDocumentTitle(title);
}

/**
 * Chromium snapshots document.title for "Save as PDF" on the next turn.
 * Setting the title and calling print() in the same click often keeps the
 * generic "Human Resources System.pdf" name.
 */
export function printWithReportTitle(reportName: string, date?: string): void {
  setReportTitle(reportName, date);
  window.setTimeout(() => window.print(), 80);
}

/**
 * Reset document title to the default system title.
 */
export function resetDocumentTitle(): void {
  if (typeof document === "undefined") return;

  currentCustomTitle = null;
  applyDocumentTitle(i18n.t(DEFAULT_TITLE_KEY), false);
}

/**
 * Get the current custom title, if any.
 */
export function getCurrentCustomTitle(): string | null {
  return currentCustomTitle;
}

// Reset title when language changes
i18n.on("languageChanged", () => {
  if (currentCustomTitle) {
    // If there's a custom title, keep it but don't re-translate
    // (custom titles are usually already in the correct language)
    return;
  }
  resetDocumentTitle();
});
