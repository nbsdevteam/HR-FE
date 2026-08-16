import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart3, Download, FileText, Users, CalendarDays, Wallet,
  ClipboardCheck, Clock, AlertTriangle, Search, Loader2,
  Eye, X, Briefcase, FileCheck, UserPlus, GraduationCap, History,
  Table, LayoutGrid, Printer,
} from "lucide-react";
import { SortableHeaderRow, toggleSort } from "@/shared/components/SortableHeader";
import * as odooData from "@/shared/api/odooData";
import {
  useReportTemplates, useReportHistory, useEmployees, useHierarchyData,
  useAttendanceRecords, useMonthlyRecords, useLeaveRequests, useLeaveTypes,
  useLeaveBalances, useEmployeeContracts, useContractTypes, useEmployeeDocuments,
  useDocumentTypes, useLoans, useAllowanceTypes, useEmployeeAllowances,
  useDeductionTypes, useEmployeeDeductions,
  type DbReportTemplate, type DbReportHistory, empDisplayName, logAudit,
} from "@/shared/hooks";
import { formatCurrency, formatDateTime } from "@/i18n/format";
import { translateCataloguedValue } from "@/i18n/legacy";
import { arabicSource } from "@/i18n/source";
import { downloadExcelCsv } from "@/shared/utils/export";

const categoryIcons: Record<string, any> = {
  attendance: Clock,
  payroll: Wallet,
  leave: CalendarDays,
  employee: Users,
  contract: Briefcase,
  document: FileCheck,
  recruitment: UserPlus,
  training: GraduationCap,
  warnings: AlertTriangle,
  custom: FileText,
};

const categoryLabels: Record<string, string> = {
  attendance: arabicSource("common.attendance_2"),
  payroll: arabicSource("reports.financial"),
  leave: arabicSource("common.vacations_2"),
  employee: arabicSource("reports.employees"),
  contract: arabicSource("common.contracts"),
  document: arabicSource("common.documentation"),
  recruitment: arabicSource("reports.recruitment"),
  training: arabicSource("common.training"),
  warnings: arabicSource("common.alarms_2"),
  custom: arabicSource("reports.custom"),
};

const formatIQD = (val: number) => formatCurrency(val, "IQD", { maximumFractionDigits: 0 });

export function Reports() {
  const { templates, loading: templatesLoading } = useReportTemplates();
  const { history, loading: historyLoading, refetch: refetchHistory } = useReportHistory();
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
  const { loans } = useLoans();
  const { types: allowanceTypes } = useAllowanceTypes();
  const { allowances: empAllowances } = useEmployeeAllowances();
  const { types: deductionTypes } = useDeductionTypes();
  const { deductions: empDeductions } = useEmployeeDeductions();

  const [selectedTemplate, setSelectedTemplate] = useState<DbReportTemplate | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [generatedData, setGeneratedData] = useState<Record<string, any>[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [rptSortBy, setRptSortBy] = useState<"name" | "category">("name");
  const [rptSortDir, setRptSortDir] = useState<"asc" | "desc">("asc");

  const empMap = useMemo(() => {
    const m: Record<string, string> = {};
    employees.forEach(e => { m[e.id] = empDisplayName(e); });
    return m;
  }, [employees]);

  const empDeptMap = useMemo(() => {
    const m: Record<string, string> = {};
    employees.forEach(e => { m[e.id] = e.department || ""; });
    return m;
  }, [employees]);

  const filteredTemplates = useMemo(() => {
    const list = templates.filter(t => {
      if (filterCategory !== "all" && t.category !== filterCategory) return false;
      if (searchQuery && !t.name_ar.includes(searchQuery) && !(t.name_en || "").toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
    const dir = rptSortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (rptSortBy === "name") return dir * (a.name_ar || "").localeCompare(b.name_ar || "", "ar");
      if (rptSortBy === "category") return dir * (a.category || "").localeCompare(b.category || "", "ar");
      return 0;
    });
    return list;
  }, [templates, filterCategory, searchQuery, rptSortBy, rptSortDir]);

  // ——— Report data generation engine ———
  const generateReport = async (template: DbReportTemplate) => {
    setGenerating(true);
    setGeneratedData(null);

    let rows: Record<string, any>[] = [];

    switch (template.code) {
      case "attendance_monthly": {
        let filtered = attendanceRecords;
        if (dateFrom) filtered = filtered.filter(r => r.date >= dateFrom);
        if (dateTo) filtered = filtered.filter(r => r.date <= dateTo);
        if (filterDept) filtered = filtered.filter(r => empDeptMap[r.employee_id] === filterDept);
        rows = filtered.map(r => {
          let statusLabel = r.status || "—";
          if (r.status === "complete" || r.status === "missing_checkout") {
            statusLabel = r.is_late ? arabicSource("common.late") : arabicSource("common.present");
          } else if (r.status === "absent" || r.status === "absent_due_to_late_threshold") {
            statusLabel = arabicSource("common.absent");
          } else if (r.status === "leave") {
            statusLabel = arabicSource("common.vacations_2") || "Leave";
          } else if (r.status === "holiday") {
            statusLabel = "Holiday";
          }
          return {
            employee_name: empMap[r.employee_id] || r.employee_id,
            date: r.date,
            // check_in/out already converted to Asia/Baghdad in mapAttendance
            check_in: r.check_in_time || "—",
            check_out: r.check_out_time || "—",
            status: statusLabel,
            delay_minutes: r.late_minutes || 0,
            overtime_hours: r.overtime_hours ? r.overtime_hours.toFixed(1) : "0",
          };
        });
        break;
      }
      case "leave_requests":
      case "leave_monthly": {
        let filtered = leaveRequests;
        if (dateFrom) filtered = filtered.filter(r => r.start_date >= dateFrom);
        if (dateTo) filtered = filtered.filter(r => r.start_date <= dateTo);
        if (filterDept) filtered = filtered.filter(r => empDeptMap[r.employee_id] === filterDept);
        rows = filtered.map(r => ({
          employee_name: empMap[r.employee_id] || r.employee_id,
          leave_type: r.leave_type || "—",
          start_date: r.start_date,
          end_date: r.end_date,
          days: r.days,
          status: r.status,
          reason: r.reason || "—",
        }));
        break;
      }
      case "payroll_monthly": {
        let filtered = monthlyRecords;
        if (filterDept) {
          const deptEmpIds = employees.filter(e => e.department === filterDept).map(e => e.id);
          filtered = filtered.filter(r => deptEmpIds.includes(r.employee_id));
        }
        rows = filtered.map(r => {
          const calc = r.salary_calculation || {} as any;
          return {
            employee_name: empMap[r.employee_id] || r.employee_id,
            department: empDeptMap[r.employee_id] || "—",
            basic_salary: formatIQD(calc.baseSalary || 0),
            allowances: formatIQD((calc.allowances || []).reduce((s: number, a: any) => s + (a.amount || 0), 0)),
            deductions: formatIQD((calc.deductions || []).reduce((s: number, d: any) => s + (d.amount || 0), 0)),
            net_salary: formatIQD(calc.netSalary || 0),
          };
        });
        break;
      }
      case "leave_balances": {
        rows = leaveBalances.map(b => {
          const lt = leaveTypes.find(t => t.id === b.leave_type_id);
          return {
            employee_name: empMap[b.employee_id] || b.employee_id,
            leave_type: lt?.name_ar || "—",
            entitlement: b.total_days,
            used: b.used_days,
            remaining: b.total_days - b.used_days,
            carryover: b.carryover_days || 0,
          };
        });
        if (filterDept) rows = rows.filter((_, i) => empDeptMap[leaveBalances[i]?.employee_id] === filterDept);
        break;
      }
      case "employee_master": {
        let filtered = employees;
        if (filterDept) filtered = filtered.filter(e => e.department === filterDept);
        rows = filtered.map(e => ({
          name: e.name || "—",
          arabic_name: e.arabic_name || "—",
          department: e.department || "—",
          position: e.position || "—",
          join_date: e.join_date || "—",
          monthly_salary: formatIQD(e.monthly_salary || 0),
          status: e.status || arabicSource("common.is_active"),
        }));
        break;
      }
      case "contracts_status": {
        let filtered = contracts;
        if (filterDept) {
          const deptEmpIds = employees.filter(e => e.department === filterDept).map(e => e.id);
          filtered = filtered.filter(c => deptEmpIds.includes(c.employee_id));
        }
        rows = filtered.map(c => {
          const ct = contractTypes.find(t => t.id === c.contract_type_id);
          return {
            employee_name: empMap[c.employee_id] || c.employee_id,
            contract_type: ct?.name_ar || "—",
            start_date: c.start_date,
            end_date: c.end_date || arabicSource("common.not_specified"),
            status: c.status === "active" ? arabicSource("common.is_active") : c.status === "expired" ? arabicSource("common.finished") : c.status === "terminated" ? arabicSource("common.canceled") : c.status,
            probation_status: c.probation_status === "in_progress" ? arabicSource("reports.underway") : c.probation_status === "passed" ? arabicSource("common.successful") : c.probation_status === "failed" ? arabicSource("common.failed") : c.probation_status === "not_applicable" ? "—" : c.probation_status,
          };
        });
        break;
      }
      case "documents_expiry": {
        const now = new Date();
        let filtered = empDocuments;
        if (filterDept) {
          const deptEmpIds = employees.filter(e => e.department === filterDept).map(e => e.id);
          filtered = filtered.filter(d => deptEmpIds.includes(d.employee_id));
        }
        rows = filtered.filter(d => d.expiry_date).map(d => {
          const dt = documentTypes.find(t => t.id === d.document_type_id);
          const expiry = new Date(d.expiry_date!);
          const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          let status = arabicSource("reports.mast");
          if (daysLeft < 0) status = arabicSource("reports.finished");
          else if (daysLeft <= (dt?.expiry_warning_days || 30)) status = arabicSource("reports.nearly_completed");
          return {
            employee_name: empMap[d.employee_id] || d.employee_id,
            document_type: dt?.name_ar || "—",
            document_number: d.document_number || "—",
            expiry_date: d.expiry_date,
            status,
          };
        });
        break;
      }
      default: {
        rows = [{ info: arabicSource("reports.there_is_currently_no_data_available_for_this_report") }];
      }
    }

    // Log to report history
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
  };

  // Export to CSV / Excel-friendly UTF-8 BOM CSV
  const exportCSV = () => {
    if (!generatedData || !selectedTemplate) return;
    const cols = selectedTemplate.columns;
    const rows = generatedData.map((row) => {
      const out: Record<string, unknown> = {};
      for (const c of cols) {
        out[translateCataloguedValue(c.label)] = translateCataloguedValue(String(row[c.key] || ""));
      }
      return out;
    });
    downloadExcelCsv(
      `${selectedTemplate.code}_${new Date().toISOString().slice(0, 10)}`,
      rows,
    );
  };

  const cardCls = "bg-card/30 backdrop-blur-md border border-border/40 rounded-xl p-6 shadow-lg";

  const quickStats = [
    { label: arabicSource("reports.report_templates"), value: templates.length, icon: BarChart3 },
    { label: arabicSource("reports.reports_generated"), value: history.length, icon: FileText },
    { label: arabicSource("common.sections"), value: departments.length, icon: Users },
    { label: arabicSource("common.total_employees"), value: employees.length, icon: ClipboardCheck },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gradient-gold">{arabicSource("common.reports")}</h1>
          <p className="text-muted-foreground mt-1">{arabicSource("reports.reporting_engine_live_data_from_the_database")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors cursor-pointer ${showHistory ? "bg-primary text-primary-foreground border-primary" : "border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/50"}`}
          >
            <History className="w-4 h-4" />
            {arabicSource("reports.report_log")}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {quickStats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card backdrop-blur-sm border border-border rounded-xl p-5 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground" style={{ fontSize: 13 }}>{stat.label}</p>
                  <span className="text-gradient-gold block mt-2" style={{ fontSize: 28 }}>{stat.value}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Report History Panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={cardCls}
          >
            <h3 className="text-foreground mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              {arabicSource("reports.log_of_generated_reports")}
            </h3>
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">{arabicSource("reports.no_reports_have_been_generated_yet")}</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {history.slice(0, 20).map(h => (
                  <div key={h.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                    <div>
                      <p className="text-sm text-foreground">{h.report_name}</p>
                      <p className="text-xs text-muted-foreground">{h.row_count} {arabicSource("reports.register_by")} {h.generated_by}</p>
                    </div>
                    <span className="text-xs text-muted-foreground" dir="ltr">{formatDateTime(h.generated_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters Bar */}
      <div className={cardCls}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              placeholder={arabicSource("reports.search_reports")}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
          >
            <option value="all">{arabicSource("common.all_categories")}</option>
            {Object.entries(categoryLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            className="px-3 py-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
          >
            <option value="">{arabicSource("reports.all_sections")}</option>
            {departments.map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
            dir="ltr"
          />
          <span className="text-muted-foreground text-sm">{arabicSource("common.to")}</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
            dir="ltr"
          />
          <div className="flex items-center border border-border/50 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 cursor-pointer ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 cursor-pointer ${viewMode === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Table className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Templates Grid / Table */}
      {templatesLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template, i) => {
            const Icon = categoryIcons[template.category] || FileText;
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -5 }}
                className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl p-5 shadow-lg hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/40 transition-all"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-foreground">{template.name_ar}</h3>
                    <p className="text-muted-foreground mt-1" style={{ fontSize: 12 }}>{template.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary" style={{ fontSize: 11 }}>
                    {categoryLabels[template.category] || template.category}
                  </span>
                  <span className="text-muted-foreground" style={{ fontSize: 11 }}>
                    {template.columns.length} {arabicSource("common.column")}
                  </span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setSelectedTemplate(template); setGeneratedData(null); }}
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  {arabicSource("reports.create_the_report")}
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className={cardCls}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <SortableHeaderRow
                  columns={[
                    { label: arabicSource("reports.report"), key: "name" },
                    { label: arabicSource("common.category"), key: "category" },
                    { label: arabicSource("reports.columns"), key: null },
                    { label: arabicSource("reports.formula"), key: null },
                    { label: arabicSource("reports.procedure"), key: null },
                  ]}
                  sortBy={rptSortBy}
                  sortDir={rptSortDir}
                  onSort={(key) => toggleSort(key, rptSortBy, rptSortDir, setRptSortBy, setRptSortDir)}
                />
              </thead>
              <tbody>
                {filteredTemplates.map(template => {
                  const Icon = categoryIcons[template.category] || FileText;
                  return (
                    <tr key={template.id} className="border-b border-border/20 hover:bg-muted/10">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-primary" />
                          <span className="text-foreground">{template.name_ar}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary" style={{ fontSize: 11 }}>
                          {categoryLabels[template.category]}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">{template.columns.length}</td>
                      <td className="p-3 text-muted-foreground">{template.format}</td>
                      <td className="p-3">
                        <button
                          onClick={() => { setSelectedTemplate(template); setGeneratedData(null); }}
                          className="px-3 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer text-xs"
                        >
                          {arabicSource("common.create")}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report Viewer Modal */}
      <AnimatePresence>
        {selectedTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => { setSelectedTemplate(null); setGeneratedData(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border/40 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-border/40 flex items-center justify-between">
                <div>
                  <h2 className="text-lg text-foreground">{selectedTemplate.name_ar}</h2>
                  <p className="text-muted-foreground text-sm mt-1">{selectedTemplate.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!generatedData ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => generateReport(selectedTemplate)}
                      disabled={generating}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow hover:bg-gold-dark transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                      {generating ? arabicSource("reports.construction_underway") : arabicSource("common.create")}
                    </motion.button>
                  ) : (
                    <>
                      <button
                        onClick={exportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        {arabicSource("reports.csv_export")}
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                        {arabicSource("common.print")}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => { setSelectedTemplate(null); setGeneratedData(null); }}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-6">
                {generating ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                    <p className="text-muted-foreground">{arabicSource("reports.collecting_report_data")}</p>
                  </div>
                ) : !generatedData ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <BarChart3 className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground mb-2">{arabicSource("reports.click_generate_to_generate_the_report")}</p>
                    <p className="text-muted-foreground/60 text-xs">{arabicSource("reports.the_filters_specified_above_department_date_will_be_used")}</p>
                  </div>
                ) : generatedData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <FileText className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">{arabicSource("reports.there_is_no_matching_data_for_the_specified_filters")}</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-muted-foreground">
                        {generatedData.length} {arabicSource("common.record")}
                        {filterDept && ` ${arabicSource("reports.section")} ${filterDept}`}
                        {dateFrom && ` ${arabicSource("reports.from")} ${dateFrom}`}
                        {dateTo && ` ${arabicSource("reports.to")} ${dateTo}`}
                      </p>
                    </div>
                    <div className="overflow-x-auto border border-border/30 rounded-xl">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/30 border-b border-border/40">
                            <th className="p-3 text-start text-muted-foreground font-medium" style={{ fontSize: 12 }}>#</th>
                            {selectedTemplate.columns.map(col => (
                              <th key={col.key} className="p-3 text-start text-muted-foreground font-medium" style={{ fontSize: 12 }}>
                                {col.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {generatedData.slice(0, 200).map((row, idx) => (
                            <tr key={idx} className="border-b border-border/20 hover:bg-muted/10">
                              <td className="p-3 text-muted-foreground" style={{ fontSize: 12 }}>{idx + 1}</td>
                              {selectedTemplate.columns.map(col => (
                                <td key={col.key} className="p-3 text-foreground" style={{ fontSize: 12 }}>
                                  {row[col.key] ?? "—"}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {generatedData.length > 200 && (
                      <p className="text-center text-muted-foreground text-xs mt-3">
                        {arabicSource("reports.the_first_200_records_of_a_parent_are_displayed")} {generatedData.length}{arabicSource("reports.export_to_get_full_data")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
