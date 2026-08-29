import { useCallback, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { generateHrReport } from "@/shared/api/reporting";
import { eid } from "@/shared/api/httpHelpers";
import {
  logAudit,
  type DbAttendanceRecord, type DbContractType, type DbDepartment, type DbDocumentType, type DbEmployee,
  type DbEmployeeContract, type DbEmployeeDocument, type DbLeaveBalance, type DbLeaveRequest,
  type DbLeaveType, type DbMonthlyRecord, type DbReportTemplate,
} from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { translateCataloguedValue } from "@/i18n/legacy";
import { downloadExcelCsv } from "@/shared/utils/export";
import { isBackendReportCode, resolveReportCode } from "../constants/reports";
import { departmentIdFromName } from "../utils/departments";
import type { ReportColumn, ReportRow } from "../types";
import { generateReportRows } from "../utils/reportGenerators";

type UseReportGenerationArgs = {
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
  refetchHistory: () => void;
};

export const useReportGeneration = ({
  attendanceRecords, monthlyRecords, leaveRequests, leaveTypes, leaveBalances,
  employees, contracts, contractTypes, empDocuments, documentTypes,
  empMap, empDeptMap, departments, dateFrom, dateTo, filterDept,
  selectedEmployeeIds, selectedFieldKeys, refetchHistory,
}: UseReportGenerationArgs) => {
  const [generatedData, setGeneratedData] = useState<ReportRow[] | null>(null);
  const [generatedColumns, setGeneratedColumns] = useState<ReportColumn[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const generateReport = useCallback(async (template: DbReportTemplate) => {
    setGenerating(true);
    setGeneratedData(null);
    setGeneratedColumns(null);
    setGenerateError(null);

    try {
      if (isBackendReportCode(template.code)) {
        const result = await generateHrReport({
          code: resolveReportCode(template.code),
          filters: {
            date_from: dateFrom,
            date_to: dateTo,
            department_id: departmentIdFromName(departments, filterDept),
            employee_ids: selectedEmployeeIds.map(eid),
          },
          fields: selectedFieldKeys,
          create_history: true,
          generated_by: arabicSource("common.human_resources_manager"),
        });

        await logAudit({
          action: "export",
          entity_type: "report",
          entity_id: template.id,
          entity_label: template.name_ar,
          details: { rows: result.rows.length, filters: result.filters_used },
        });

        refetchHistory();
        setGeneratedColumns(result.columns);
        setGeneratedData(result.rows);
      } else {
        const rows = generateReportRows(template, {
          attendanceRecords, monthlyRecords, leaveRequests, leaveTypes, leaveBalances,
          employees, contracts, contractTypes, empDocuments, documentTypes,
          empMap, empDeptMap,
          filters: { dateFrom, dateTo, filterDept },
        });

        await odooData.createReportHistory({
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

        refetchHistory();
        setGeneratedColumns(template.columns);
        setGeneratedData(rows);
      }
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  }, [
    attendanceRecords, monthlyRecords, leaveRequests, leaveTypes, leaveBalances,
    employees, contracts, contractTypes, empDocuments, documentTypes,
    empMap, empDeptMap, departments, dateFrom, dateTo, filterDept,
    selectedEmployeeIds, selectedFieldKeys, refetchHistory,
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

  return {
    generatedData, generatedColumns, generating, generateError,
    generateReport, exportCSV, resetGeneratedData,
  };
};
