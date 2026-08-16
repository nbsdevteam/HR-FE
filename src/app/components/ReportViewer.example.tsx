/**
 * Example Report Viewer Component
 * This demonstrates how to properly set document titles for reports
 * so that PDFs save with descriptive filenames.
 * 
 * Copy this pattern to your actual report components.
 */

import { useReportTitle } from "../lib/useDocumentTitle";
import { useState, useEffect } from "react";

interface ReportTemplate {
  code: string;
  name_en: string;
  name_ar: string;
  category: string;
}

interface ReportFilters {
  date_from?: string;
  date_to?: string;
  month?: string;
  employee_id?: number;
  department_id?: number;
}

interface ReportViewerProps {
  template: ReportTemplate;
  filters: ReportFilters;
  reportData: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ReportViewer({ template, filters, reportData, isOpen, onClose }: ReportViewerProps) {
  // Format date range for the title
  const formatDateRange = (filters: ReportFilters): string | undefined => {
    if (filters.date_from && filters.date_to) {
      return `${filters.date_from} to ${filters.date_to}`;
    }
    if (filters.month) {
      return filters.month;
    }
    return undefined;
  };

  const dateRange = formatDateRange(filters);

  // Set document title when modal is open
  // This ensures PDF saves with the correct filename
  useReportTitle(
    isOpen ? (template.name_en || template.name_ar) : null,
    dateRange
  );

  const handlePrint = () => {
    // The document title is already set by the hook above
    // When user prints, the PDF will use this title as filename
    window.print();
  };

  const handleExportCSV = () => {
    // For CSV export, use the same naming pattern
    const filename = dateRange
      ? `${template.name_en} - ${dateRange}.csv`
      : `${template.name_en}.csv`;
    
    // Your CSV export logic here...
    console.log(`Exporting to: ${filename}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header - Hidden when printing */}
        <div className="report-header no-print bg-gray-50 p-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {template.name_en}
            </h2>
            {dateRange && (
              <p className="text-sm text-gray-600 mt-1">
                Period: {dateRange}
              </p>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Print / Save PDF
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Export CSV
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>

        {/* Report Content - Visible when printing */}
        <div className="report-content flex-1 overflow-auto p-6">
          {/* Print-only header */}
          <div className="print-only mb-6">
            <h1 className="text-2xl font-bold text-center mb-2">
              {template.name_en}
            </h1>
            {dateRange && (
              <p className="text-center text-gray-600">
                Period: {dateRange}
              </p>
            )}
          </div>

          {/* Your report table/content goes here */}
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Column 1</th>
                <th className="border p-2">Column 2</th>
                <th className="border p-2">Column 3</th>
              </tr>
            </thead>
            <tbody>
              {reportData?.rows?.map((row: any, idx: number) => (
                <tr key={idx}>
                  <td className="border p-2">{row.col1}</td>
                  <td className="border p-2">{row.col2}</td>
                  <td className="border p-2">{row.col3}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Print-only footer */}
          <div className="print-only mt-6 text-center text-sm text-gray-600">
            Generated on {new Date().toLocaleDateString()} - Human Resources System
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * USAGE EXAMPLE:
 * 
 * ```tsx
 * import { ReportViewer } from "./components/ReportViewer";
 * 
 * function MyReportsPage() {
 *   const [selectedReport, setSelectedReport] = useState(null);
 *   const [reportData, setReportData] = useState(null);
 * 
 *   const handleGenerateReport = async (template, filters) => {
 *     const data = await fetchReportData(template.code, filters);
 *     setReportData(data);
 *     setSelectedReport({ template, filters });
 *   };
 * 
 *   return (
 *     <div>
 *       <button onClick={() => handleGenerateReport(
 *         { code: 'punch_audit', name_en: 'Punch Audit Report', ... },
 *         { date_from: '2026-08-01', date_to: '2026-08-31' }
 *       )}>
 *         Generate Punch Audit
 *       </button>
 * 
 *       {selectedReport && (
 *         <ReportViewer
 *           template={selectedReport.template}
 *           filters={selectedReport.filters}
 *           reportData={reportData}
 *           isOpen={!!selectedReport}
 *           onClose={() => setSelectedReport(null)}
 *         />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */

/**
 * PRINT CSS (Add to your global styles):
 * 
 * ```css
 * @media print {
 *   .no-print {
 *     display: none !important;
 *   }
 *   
 *   .print-only {
 *     display: block !important;
 *   }
 *   
 *   body {
 *     margin: 0;
 *     padding: 20px;
 *   }
 *   
 *   table {
 *     border-collapse: collapse;
 *     width: 100%;
 *   }
 *   
 *   th, td {
 *     border: 1px solid #000;
 *     padding: 8px;
 *   }
 * }
 * 
 * .print-only {
 *   display: none;
 * }
 * ```
 */
