/**
 * Utility for setting dynamic document titles, especially for reports.
 * This ensures each report/page saves with a proper filename when printing to PDF.
 */

import i18n from "../i18n";

const DEFAULT_TITLE_KEY = "shared.human_resources_system";
let currentCustomTitle: string | null = null;

/**
 * Set a custom document title.
 * Use this when displaying reports or specific pages that should have unique names.
 * 
 * @param title - The title to set (can be a translation key or plain text)
 * @param isTranslationKey - Whether the title is a translation key (default: false)
 */
export function setDocumentTitle(title: string, isTranslationKey = false): void {
  if (typeof document === "undefined") return;
  
  currentCustomTitle = title;
  const resolvedTitle = isTranslationKey ? i18n.t(title) : title;
  document.title = resolvedTitle || i18n.t(DEFAULT_TITLE_KEY);
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
  document.title = title;
}

/**
 * Reset document title to the default system title.
 */
export function resetDocumentTitle(): void {
  if (typeof document === "undefined") return;
  
  currentCustomTitle = null;
  document.title = i18n.t(DEFAULT_TITLE_KEY);
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
