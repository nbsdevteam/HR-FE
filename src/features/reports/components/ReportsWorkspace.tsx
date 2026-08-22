import { lazy, Suspense } from "react";
import { useCallback, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { Loader2 } from "lucide-react";
import {
  useReportTemplates,
  useReportHistory,
  useEmployees,
  useHierarchyData,
  useAttendanceRecords,
  useMonthlyRecords,
  useLeaveRequests,
  useLeaveTypes,
  useLeaveBalances,
  useEmployeeContracts,
  useContractTypes,
  useEmployeeDocuments,
  useDocumentTypes,
  useLoans,
  useAllowanceTypes,
  useEmployeeAllowances,
  useDeductionTypes,
  useEmployeeDeductions,
  type DbReportTemplate,
} from "@/shared/hooks";
import type { ReportSortBy, ReportSortDir, ReportViewMode } from "../types";
import { useEmployeeLookups } from "../hooks/useEmployeeLookups";
import { useReportGeneration } from "../hooks/useReportGeneration";
import ReportFiltersBar from "./ReportFiltersBar";
import ReportHistoryPanel from "./ReportHistoryPanel";
import ReportsHeader from "./ReportsHeader";
import ReportsStats from "./ReportsStats";
import ReportTemplatesGrid from "./ReportTemplatesGrid";
import ReportViewerModal from "./ReportViewerModal";

const ReportTemplatesTable = lazy(() => import("./ReportTemplatesTable"));

const ReportsWorkspace = () => {
  const [selectedTemplate, setSelectedTemplate] =
    useState<DbReportTemplate | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [viewMode, setViewMode] = useState<ReportViewMode>("grid");
  const [rptSortBy, setRptSortBy] = useState<ReportSortBy>("name");
  const [rptSortDir, setRptSortDir] = useState<ReportSortDir>("asc");

  const { templates, loading: templatesLoading } = useReportTemplates();
  const {
    history,
    loading: historyLoading,
    refetch: refetchHistory,
  } = useReportHistory();
  const { employees } = useEmployees();
  const { departments } = useHierarchyData();
  const { records: attendanceRecords } = useAttendanceRecords();
  const { records: monthlyRecords } = useMonthlyRecords();
  const { requests: leaveRequests } = useLeaveRequests();
  const { types: leaveTypes } = useLeaveTypes();
  const { balances: leaveBalances } = useLeaveBalances();
  const { contracts } = useEmployeeContracts();
  const { types: contractTypes } = useContractTypes();
  const { documents: empDocuments } = useEmployeeDocuments();
  const { types: documentTypes } = useDocumentTypes();
  useLoans();
  useAllowanceTypes();
  useEmployeeAllowances();
  useDeductionTypes();
  useEmployeeDeductions();
  const { empMap, empDeptMap } = useEmployeeLookups(employees);
  const {
    generatedData,
    generating,
    generateReport,
    exportCSV,
    resetGeneratedData,
  } = useReportGeneration({
    attendanceRecords,
    monthlyRecords,
    leaveRequests,
    leaveTypes,
    leaveBalances,
    employees,
    contracts,
    contractTypes,
    empDocuments,
    documentTypes,
    empMap,
    empDeptMap,
    dateFrom,
    dateTo,
    filterDept,
    refetchHistory,
  });

  const filteredTemplates = useMemo(() => {
    const list = templates.filter((t) => {
      if (filterCategory !== "all" && t.category !== filterCategory)
        return false;
      if (
        searchQuery &&
        !t.name_ar.includes(searchQuery) &&
        !(t.name_en || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });

    const dir = rptSortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (rptSortBy === "name")
        return dir * (a.name_ar || "").localeCompare(b.name_ar || "", "ar");
      if (rptSortBy === "category")
        return dir * (a.category || "").localeCompare(b.category || "", "ar");
      return 0;
    });
    return list;
  }, [templates, filterCategory, searchQuery, rptSortBy, rptSortDir]);

  const handleToggleHistory = useCallback(() => setShowHistory((v) => !v), []);

  const handleSelectTemplate = useCallback(
    (template: DbReportTemplate) => {
      setSelectedTemplate(template);
      resetGeneratedData();
    },
    [resetGeneratedData],
  );

  const handleCloseViewer = useCallback(() => {
    setSelectedTemplate(null);
    resetGeneratedData();
  }, [resetGeneratedData]);

  const handleGenerate = useCallback(() => {
    if (selectedTemplate) generateReport(selectedTemplate);
  }, [selectedTemplate, generateReport]);

  const handleExportCSV = useCallback(
    () => exportCSV(selectedTemplate),
    [exportCSV, selectedTemplate],
  );
  const handlePrint = useCallback(() => window.print(), []);

  return (
    <div className="space-y-6">
      <ReportsHeader
        showHistory={showHistory}
        onToggleHistory={handleToggleHistory}
      />

      <ReportsStats
        templateCount={templates.length}
        historyCount={history.length}
        departmentCount={departments.length}
        employeeCount={employees.length}
      />

      <AnimatePresence>
        {showHistory && (
          <ReportHistoryPanel history={history} loading={historyLoading} />
        )}
      </AnimatePresence>

      <ReportFiltersBar
        searchQuery={searchQuery}
        filterCategory={filterCategory}
        filterDept={filterDept}
        dateFrom={dateFrom}
        dateTo={dateTo}
        departments={departments}
        viewMode={viewMode}
        onSearchQueryChange={setSearchQuery}
        onFilterCategoryChange={setFilterCategory}
        onFilterDeptChange={setFilterDept}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onViewModeChange={setViewMode}
      />

      {templatesLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : viewMode === "grid" ? (
        <ReportTemplatesGrid
          templates={filteredTemplates}
          onSelect={handleSelectTemplate}
        />
      ) : (
        <Suspense fallback={null}>
          <ReportTemplatesTable
            templates={filteredTemplates}
            sortBy={rptSortBy}
            sortDir={rptSortDir}
            onSortByChange={setRptSortBy}
            onSortDirChange={setRptSortDir}
            onSelect={handleSelectTemplate}
          />
        </Suspense>
      )}

      <AnimatePresence>
        {selectedTemplate && (
          <ReportViewerModal
            template={selectedTemplate}
            generating={generating}
            generatedData={generatedData}
            filterDept={filterDept}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onClose={handleCloseViewer}
            onGenerate={handleGenerate}
            onExportCSV={handleExportCSV}
            onPrint={handlePrint}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReportsWorkspace;
