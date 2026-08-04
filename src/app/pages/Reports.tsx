import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart3, Download, FileText, Users, CalendarDays, Wallet,
  ClipboardCheck, Clock, AlertTriangle, Search, Loader2,
  Eye, X, Briefcase, FileCheck, UserPlus, GraduationCap, History,
  Table, LayoutGrid, Printer,
} from "lucide-react";
import { SortableHeaderRow, toggleSort } from "../components/SortableHeader";
import { supabase } from "../lib/supabase";
import { isOdooBackend } from "../lib/api/client";
import * as odooData from "../lib/api/odooData";
import {
  useReportTemplates, useReportHistory, useEmployees, useHierarchyData,
  useAttendanceRecords, useMonthlyRecords, useLeaveRequests, useLeaveTypes,
  useLeaveBalances, useEmployeeContracts, useContractTypes, useEmployeeDocuments,
  useDocumentTypes, useLoans, useAllowanceTypes, useEmployeeAllowances,
  useDeductionTypes, useEmployeeDeductions,
  type DbReportTemplate, type DbReportHistory, empDisplayName, logAudit,
} from "../lib/hooks";

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
  attendance: "حضور",
  payroll: "مالية",
  leave: "إجازات",
  employee: "موظفين",
  contract: "عقود",
  document: "وثائق",
  recruitment: "توظيف",
  training: "تدريب",
  warnings: "إنذارات",
  custom: "مخصص",
};

const formatIQD = (val: number) => `${val.toLocaleString("ar-IQ")} د.ع`;

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
        rows = filtered.map(r => ({
          employee_name: empMap[r.employee_id] || r.employee_id,
          date: r.date,
          check_in: r.check_in_time || "—",
          check_out: r.check_out_time || "—",
          status: r.status === "complete" ? (r.is_late ? "متأخر" : "حاضر") : r.status === "absent" ? "غائب" : r.status,
          delay_minutes: r.late_minutes || 0,
          overtime_hours: r.overtime_hours ? r.overtime_hours.toFixed(1) : "0",
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
            entitlement: b.entitlement_days,
            used: b.used_days,
            remaining: b.entitlement_days - b.used_days,
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
          status: e.status || "نشط",
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
            end_date: c.end_date || "غير محدد",
            status: c.status === "active" ? "نشط" : c.status === "expired" ? "منتهي" : c.status === "terminated" ? "ملغي" : c.status,
            probation_status: c.probation_status === "in_progress" ? "جارية" : c.probation_status === "passed" ? "ناجح" : c.probation_status === "failed" ? "فاشل" : c.probation_status === "not_applicable" ? "—" : c.probation_status,
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
          let status = "سارية";
          if (daysLeft < 0) status = "منتهية";
          else if (daysLeft <= (dt?.expiry_warning_days || 30)) status = "قريبة الانتهاء";
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
        rows = [{ info: "لا توجد بيانات متاحة لهذا التقرير حالياً" }];
      }
    }

    // Log to report history
    if (isOdooBackend()) {
      await odooData.createReportHistory({
        report_template_id: template.id,
        report_name: template.name_ar,
        filters_used: { dateFrom, dateTo, department: filterDept },
        row_count: rows.length,
        generated_by: "مدير الموارد البشرية",
      });
    } else {
      await supabase.from("report_history").insert({
        report_template_id: template.id,
        report_name: template.name_ar,
        filters_used: { dateFrom, dateTo, department: filterDept },
        row_count: rows.length,
        generated_by: "مدير الموارد البشرية",
      });
    }
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

  // Export to CSV
  const exportCSV = () => {
    if (!generatedData || !selectedTemplate) return;
    const cols = selectedTemplate.columns;
    const header = cols.map(c => c.label).join(",");
    const csvRows = generatedData.map(row =>
      cols.map(c => `"${String(row[c.key] || "").replace(/"/g, '""')}"`).join(",")
    );
    const csv = "\uFEFF" + [header, ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTemplate.code}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cardCls = "bg-card/30 backdrop-blur-md border border-border/40 rounded-xl p-6 shadow-lg";

  const quickStats = [
    { label: "قوالب التقارير", value: templates.length, icon: BarChart3 },
    { label: "تقارير تم إنشاؤها", value: history.length, icon: FileText },
    { label: "أقسام", value: departments.length, icon: Users },
    { label: "إجمالي الموظفين", value: employees.length, icon: ClipboardCheck },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gradient-gold">التقارير</h1>
          <p className="text-muted-foreground mt-1">محرك التقارير — بيانات حية من قاعدة البيانات</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors cursor-pointer ${showHistory ? "bg-primary text-primary-foreground border-primary" : "border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/50"}`}
          >
            <History className="w-4 h-4" />
            سجل التقارير
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
              سجل التقارير المُنشأة
            </h3>
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">لم يتم إنشاء أي تقارير بعد</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {history.slice(0, 20).map(h => (
                  <div key={h.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                    <div>
                      <p className="text-sm text-foreground">{h.report_name}</p>
                      <p className="text-xs text-muted-foreground">{h.row_count} سجل · بواسطة {h.generated_by}</p>
                    </div>
                    <span className="text-xs text-muted-foreground" dir="ltr">{new Date(h.generated_at).toLocaleString("ar-IQ")}</span>
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
              placeholder="بحث في التقارير..."
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
            <option value="all">جميع الفئات</option>
            {Object.entries(categoryLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            className="px-3 py-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
          >
            <option value="">جميع الأقسام</option>
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
          <span className="text-muted-foreground text-sm">إلى</span>
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
                    {template.columns.length} عمود
                  </span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setSelectedTemplate(template); setGeneratedData(null); }}
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  إنشاء التقرير
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
                    { label: "التقرير", key: "name" },
                    { label: "الفئة", key: "category" },
                    { label: "الأعمدة", key: null },
                    { label: "الصيغة", key: null },
                    { label: "إجراء", key: null },
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
                          إنشاء
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
                      {generating ? "جاري الإنشاء..." : "إنشاء"}
                    </motion.button>
                  ) : (
                    <>
                      <button
                        onClick={exportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        تصدير CSV
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                        طباعة
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
                    <p className="text-muted-foreground">جاري تجميع بيانات التقرير...</p>
                  </div>
                ) : !generatedData ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <BarChart3 className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground mb-2">اضغط "إنشاء" لتوليد التقرير</p>
                    <p className="text-muted-foreground/60 text-xs">سيتم استخدام الفلاتر المحددة أعلاه (القسم، التاريخ)</p>
                  </div>
                ) : generatedData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <FileText className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">لا توجد بيانات مطابقة للفلاتر المحددة</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-muted-foreground">
                        {generatedData.length} سجل
                        {filterDept && ` · قسم: ${filterDept}`}
                        {dateFrom && ` · من: ${dateFrom}`}
                        {dateTo && ` · إلى: ${dateTo}`}
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
                        يتم عرض أول 200 سجل من أصل {generatedData.length}. قم بالتصدير للحصول على البيانات الكاملة.
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
