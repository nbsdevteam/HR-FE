import { useCallback, useEffect, useRef, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { generateHrReport } from "@/shared/api/reporting";
import { eid } from "@/shared/api/httpHelpers";
import { useAppLanguage } from "@/i18n/useLocalizedName";
import {
  logAudit, useOdooMutation,
  type DbAttendanceRecord, type DbContractType, type DbDepartment, type DbDocumentType, type DbEmployee,
  type DbEmployeeContract, type DbEmployeeDocument, type DbLeaveBalance, type DbLeaveRequest,
  type DbLeaveType, type DbMonthlyRecord, type DbReportTemplate,
} from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { majorityMonthOfRange } from "@/shared/utils/reports/payrollMonthly";
import { translateCataloguedValue } from "@/i18n/legacy";
import { downloadExcelCsv } from "@/shared/utils/export";
import { isBackendReportCode, resolveReportCode } from "../constants/reports";
import { departmentIdFromName } from "../utils/departments";
import type { ReportColumn, ReportRow } from "../types";
import { generateReportRows } from "../utils/reportGenerators";

type UseReportGenerationArgs = {
  /** The report open in the viewer. A language switch re-runs it while its result is on screen. */
  selectedTemplate: DbReportTemplate | null;
  attendanceRecords: DbAttendanceRecord[];
  monthlyRecords: DbMonthlyRecord[];
  leaveRequests: DbLeaveRequest[];
  leaveTypes: DbLeaveType[];
  leaveBalances: DbLeaveBalance[];
  employees: DbEmployee[];
  contracts: DbEmployeeContract[];
  contractTypes: DbContractType[];
  empDocuments: DbEmployeeDocument[];
  documentTypes: DbDocumentType[];
  empMap: Record<string, string>;
  empDeptMap: Record<string, string>;
  departments: DbDepartment[];
  dateFrom: string;
  dateTo: string;
  filterDept: string;
  selectedEmployeeIds: string[];
  selectedFieldKeys: string[];
  // No longer called directly: the generate mutations below invalidate the
  // "reportHistory" cache key themselves — kept in the type so the existing
  // caller (ReportsWorkspace passes `useReportHistory().refetch`) can keep
  // passing it unchanged.
  refetchHistory: () => void;
};

type GenerateReportOptions = {
  /**
   * False when the run shows a report already generated again (in another language): no second
   * history row and no second export in the audit log.
   */
  createHistory?: boolean;
};

export const useReportGeneration = ({
  selectedTemplate,
  attendanceRecords, monthlyRecords, leaveRequests, leaveTypes, leaveBalances,
  employees, contracts, contractTypes, empDocuments, documentTypes,
  empMap, empDeptMap, departments, dateFrom, dateTo, filterDept,
  selectedEmployeeIds, selectedFieldKeys,
}: UseReportGenerationArgs) => {
  const [generatedData, setGeneratedData] = useState<ReportRow[] | null>(null);
  const [generatedColumns, setGeneratedColumns] = useState<ReportColumn[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const lang = useAppLanguage();

  // Both produce a report + log a history row; nothing else visibly needs
  // this beyond the report-history list, so that's the only invalidation.
  const generateHrReportMutation = useOdooMutation(generateHrReport, "reportHistory");
  const createReportHistoryMutation = useOdooMutation(odooData.createReportHistory, "reportHistory");
  // The number of the newest run. Only that run may write its result, so a slower older response
  // never replaces a newer one.
  const latestRequest = useRef(0);
  // The language the report last followed; a change from it re-runs the report on screen.
  const seenLang = useRef(lang);

  const generateReport = useCallback(async (
    template: DbReportTemplate,
    { createHistory = true }: GenerateReportOptions = {},
  ) => {
    const request = ++latestRequest.current;
    const isLatest = () => request === latestRequest.current;
    setGenerating(true);
    setGeneratedData(null);
    setGeneratedColumns(null);
    setGenerateError(null);

    try {
      if (isBackendReportCode(template.code)) {
        const result = await generateHrReportMutation.mutateAsync({
          code: resolveReportCode(template.code),
          filters: {
            date_from: dateFrom,
            date_to: dateTo,
            // Monthly salaries are one month: name it rather than let the backend infer it from the range.
            ...(resolveReportCode(template.code) === "payroll_monthly"
              ? { month: majorityMonthOfRange(dateFrom, dateTo) ?? undefined }
              : {}),
            department_id: departmentIdFromName(departments, filterDept),
            employee_ids: selectedEmployeeIds.map(eid),
          },
          fields: selectedFieldKeys,
          create_history: createHistory,
          generated_by: arabicSource("common.human_resources_manager"),
          // The server picks each employee's name and the headings by this, so it stays top-level.
          lang,
        });

        if (createHistory) {
          await logAudit({
            action: "export",
            entity_type: "report",
            entity_id: template.id,
            entity_label: template.name_ar,
            details: { rows: result.rows.length, filters: result.filters_used },
          });
        }
        if (!isLatest()) return;

        setGeneratedColumns(result.columns);
        setGeneratedData(result.rows);
      } else {
        const rows = generateReportRows(template, {
          attendanceRecords, monthlyRecords, leaveRequests, leaveTypes, leaveBalances,
          employees, contracts, contractTypes, empDocuments, documentTypes,
          empMap, empDeptMap,
          filters: { dateFrom, dateTo, filterDept },
        });

        if (createHistory) {
          await createReportHistoryMutation.mutateAsync({
            report_template_id: template.id,
            report_name: template.name_ar,
            filters_used: { dateFrom, dateTo, department: filterDept },
            row_count: rows.length,
            generated_by: arabicSource("common.human_resources_manager"),
          });
          await logAudit({
            action: "export",
            entity_type: "report",
            entity_id: template.id,
            entity_label: template.name_ar,
            details: { rows: rows.length, filters: { dateFrom, dateTo, department: filterDept } },
          });
        }
        if (!isLatest()) return;

        setGeneratedColumns(template.columns);
        setGeneratedData(rows);
      }
    } catch (err) {
      if (isLatest()) setGenerateError(err instanceof Error ? err.message : String(err));
    } finally {
      if (isLatest()) setGenerating(false);
    }
  }, [
    attendanceRecords, monthlyRecords, leaveRequests, leaveTypes, leaveBalances,
    employees, contracts, contractTypes, empDocuments, documentTypes,
    empMap, empDeptMap, departments, dateFrom, dateTo, filterDept,
    selectedEmployeeIds, selectedFieldKeys, lang,
    generateHrReportMutation.mutateAsync, createReportHistoryMutation.mutateAsync,
  ]);

  const exportCSV = useCallback((template: DbReportTemplate | null) => {
    if (!generatedData || !template) return;
    const cols = generatedColumns ?? template.columns;
    const rows = generatedData.map((row) => {
      const out: Record<string, unknown> = {};
      for (const c of cols) {
        out[translateCataloguedValue(c.label)] = translateCataloguedValue(String(row[c.key] ?? ""));
      }
      return out;
    });
    downloadExcelCsv(`${template.code}_${new Date().toISOString().slice(0, 10)}`, rows);
  }, [generatedData, generatedColumns]);

  const resetGeneratedData = useCallback(() => {
    setGeneratedData(null);
    setGeneratedColumns(null);
    setGenerateError(null);
  }, []);

  // A report on screen, or on its way, follows the app language: the same report runs again with
  // only `lang` changed. Never on mount, and not while nothing or only an error is shown.
  useEffect(() => {
    if (seenLang.current === lang) return;
    seenLang.current = lang;
    if (selectedTemplate && (generatedData !== null || generating)) {
      void generateReport(selectedTemplate, { createHistory: false });
    }
  }, [lang, selectedTemplate, generatedData, generating, generateReport]);

  return {
    generatedData, generatedColumns, generating, generateError,
    generateReport, exportCSV, resetGeneratedData,
  };
};
