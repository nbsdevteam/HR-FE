/**
 * React hook for managing document title in components.
 * Automatically resets title when component unmounts.
 */

import { useEffect, useRef } from "react";
import { setDocumentTitle, setReportTitle, resetDocumentTitle } from "./documentTitle";

/**
 * Hook to set a custom document title for the current component.
 * Title is automatically reset when the component unmounts.
 * 
 * @param title - The title to set
 * @param isTranslationKey - Whether the title is a translation key
 * 
 * @example
 * ```tsx
 * function MyPage() {
 *   useDocumentTitle("Employee Management");
 *   // ...
 * }
 * ```
 */
export function useDocumentTitle(title: string | null, isTranslationKey = false): void {
  const hasSetTitle = useRef(false);

  useEffect(() => {
    if (title) {
      setDocumentTitle(title, isTranslationKey);
      hasSetTitle.current = true;
    }

    return () => {
      if (hasSetTitle.current) {
        resetDocumentTitle();
      }
    };
  }, [title, isTranslationKey]);
}

/**
 * Hook to set a report-specific document title.
 * Title is automatically reset when the component unmounts.
 * 
 * @param reportName - Name of the report
 * @param date - Optional date range or period
 * 
 * @example
 * ```tsx
 * function ReportModal({ reportName, dateRange }) {
 *   useReportTitle(reportName, dateRange);
 *   // ...
 * }
 * ```
 */
export function useReportTitle(reportName: string | null, date?: string): void {
  const hasSetTitle = useRef(false);

  useEffect(() => {
    if (reportName) {
      setReportTitle(reportName, date);
      hasSetTitle.current = true;
    }

    return () => {
      if (hasSetTitle.current) {
        resetDocumentTitle();
      }
    };
  }, [reportName, date]);
}
