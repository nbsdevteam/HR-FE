# Report PDF Naming Guide

## Problem
Previously, all reports were saved with the same filename "Human Resources System.pdf" when printing to PDF, creating naming conflicts and confusion.

## Solution
We now have utilities to dynamically set the document title based on the report being viewed. This ensures each report saves with a proper, descriptive filename.

## Usage

### Method 1: Using the React Hook (Recommended)

Use the `useReportTitle` hook in your report component:

```tsx
import { useReportTitle } from "../lib/useDocumentTitle";

function ReportModal({ reportData, isOpen }) {
  // Set title when modal opens
  useReportTitle(
    isOpen ? reportData.name : null,  // Report name
    reportData.dateRange                // Optional date range
  );

  return (
    <div className="report-modal">
      {/* Your report UI */}
    </div>
  );
}
```

### Method 2: Manual Title Management

For more control, use the utility functions directly:

```tsx
import { setReportTitle, resetDocumentTitle } from "../lib/documentTitle";

function handleOpenReport(report, dateRange) {
  // Set the title when opening the report
  setReportTitle(report.name, dateRange);
}

function handleCloseReport() {
  // Reset to default title
  resetDocumentTitle();
}
```

## Examples for Different Report Types

### 1. Punch Audit Report

```tsx
// With date range
useReportTitle("Punch Audit Report", "01/08/2026 - 31/08/2026");
// Results in: "Punch Audit Report - 01/08/2026 - 31/08/2026 - Human Resources System.pdf"

// With month only
useReportTitle("Punch Audit Report", "August 2026");
// Results in: "Punch Audit Report - August 2026 - Human Resources System.pdf"
```

### 2. Monthly Attendance Report

```tsx
useReportTitle("Monthly Attendance Report", "2026-08");
// Results in: "Monthly Attendance Report - 2026-08 - Human Resources System.pdf"
```

### 3. Payroll Report

```tsx
useReportTitle("Monthly Salaries Report", "August 2026");
// Results in: "Monthly Salaries Report - August 2026 - Human Resources System.pdf"
```

### 4. Leave Requests Report

```tsx
useReportTitle("Leave Requests Report", "Q3 2026");
// Results in: "Leave Requests Report - Q3 2026 - Human Resources System.pdf"
```

### 5. Employee Report (No Date)

```tsx
useReportTitle("Employee Master Report");
// Results in: "Employee Master Report - Human Resources System.pdf"
```

## Integration with Existing Code

### If you have a report modal/component:

```tsx
import { useReportTitle } from "../lib/useDocumentTitle";

function ReportViewer({ template, filters, reportData, onClose }) {
  // Extract date range from filters
  const dateRange = filters.date_from && filters.date_to
    ? `${filters.date_from} - ${filters.date_to}`
    : filters.month;

  // Set document title
  useReportTitle(
    template?.name_en || template?.name_ar,
    dateRange
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="report-container">
      <div className="report-header no-print">
        <h2>{template.name_en}</h2>
        <button onClick={handlePrint}>Print</button>
        <button onClick={onClose}>Close</button>
      </div>
      
      <div className="report-content">
        {/* Report table/content */}
      </div>
    </div>
  );
}
```

### If you're generating reports programmatically:

```tsx
import { setReportTitle, resetDocumentTitle } from "../lib/documentTitle";

async function generateReport(reportCode, filters) {
  try {
    const response = await generateHrReport(reportCode, filters);
    
    // Set title based on report
    const reportNames = {
      'punch_audit': 'Punch Audit Report',
      'attendance_monthly': 'Monthly Attendance Report',
      'payroll_monthly': 'Monthly Salaries Report',
      'leave_requests': 'Leave Requests Report',
    };
    
    const dateRange = filters.date_from && filters.date_to
      ? `${filters.date_from} to ${filters.date_to}`
      : undefined;
    
    setReportTitle(reportNames[reportCode], dateRange);
    
    // Display the report...
  } catch (error) {
    // On error, reset title
    resetDocumentTitle();
  }
}
```

## Important Notes

1. **Automatic Cleanup**: The `useReportTitle` hook automatically resets the title when the component unmounts.

2. **Print vs Save**: The document title determines the default filename in both:
   - Browser's Print dialog → Save as PDF
   - Browser's native PDF export

3. **Localization**: If you need the report name in Arabic, pass it directly:
   ```tsx
   useReportTitle("تقرير تدقيق البصمات", "أغسطس 2026");
   ```

4. **Date Formatting**: Format dates consistently for better filename readability:
   - Use: `01-08-2026` instead of `01/08/2026` (slashes can cause issues in some OS)
   - Or use: `2026-08-01` (ISO format, sorts well)
   - Or use: `August 2026` (human-readable)

## Testing

To test if titles are working correctly:

1. Open a report
2. Use Ctrl+P (Windows/Linux) or Cmd+P (Mac) to open print dialog
3. Check the filename in the "Save as PDF" destination
4. The filename should now match the report name and date range

## Troubleshooting

**Problem**: PDF still saves as "Human Resources System.pdf"  
**Solution**: Make sure you're calling `useReportTitle` or `setReportTitle` BEFORE the user prints/exports.

**Problem**: Title doesn't update when switching between reports  
**Solution**: Ensure the `reportName` parameter changes when switching reports. The hook will automatically update the title.

**Problem**: Title stays after closing the report  
**Solution**: If using manual functions, remember to call `resetDocumentTitle()` when closing the report.
