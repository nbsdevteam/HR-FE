import { useCallback, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import {
  logAudit,
  type DbAttendanceRecord, type DbContractType, type DbDocumentType, type DbEmployee,
  type DbEmployeeContract, type DbEmployeeDocument, type DbLeaveBalance, type DbLeaveRequest,
  type DbLeaveType, type DbMonthlyRecord, type DbReportTemplate,
} from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { translateCataloguedValue } from "@/i18n/legacy";
import { downloadExcelCsv } from "@/shared/utils/export";
import type { ReportRow } from "../types";
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
  dateFrom: string;
  dateTo: string;
  filterDept: string;
  refetchHistory: () => void;
};

export const useReportGeneration = ({
  attendanceRecords, monthlyRecords, leaveRequests, leaveTypes, leaveBalances,
  employees, contracts, contractTypes, empDocuments, documentTypes,
  empMap, empDeptMap, dateFrom, dateTo, filterDept, refetchHistory,
}: UseReportGenerationArgs) => {
  const [generatedData, setGeneratedData] = useState<ReportRow[] | null>(null);
  const [generating, setGenerating] = useState(false);

  const generateReport = useCallback(async (template: DbReportTemplate) => {
    setGenerating(true);
    setGeneratedData(null);

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
    setGeneratedData(rows);
    setGenerating(false);
  }, [
    attendanceRecords, monthlyRecords, leaveRequests, leaveTypes, leaveBalances,
    employees, contracts, contractTypes, empDocuments, documentTypes,
    empMap, empDeptMap, dateFrom, dateTo, filterDept, refetchHistory,
  ]);

  const exportCSV = useCallback((template: DbReportTemplate | null) => {
    if (!generatedData || !template) return;
    const cols = template.columns;
    const rows = generatedData.map((row) => {
      const out: Record<string, unknown> = {};
      for (const c of cols) {
        out[translateCataloguedValue(c.label)] = translateCataloguedValue(String(row[c.key] || ""));
      }
      return out;
    });
    downloadExcelCsv(`${template.code}_${new Date().toISOString().slice(0, 10)}`, rows);
  }, [generatedData]);

  const resetGeneratedData = useCallback(() => setGeneratedData(null), []);

  return { generatedData, generating, generateReport, exportCSV, resetGeneratedData };
};
