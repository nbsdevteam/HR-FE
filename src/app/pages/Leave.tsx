import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CalendarDays, Plus, Check, X, Clock, Filter, Send, Loader2,
  Search, Eye, ChevronRight, AlertCircle, FileText, Timer,
  UserCheck, TrendingDown, Briefcase, Save, Pencil, Trash2,
} from "lucide-react";
import { ViewToggle } from "../components/ViewToggle";
import { SortableHeaderRow, toggleSort } from "../components/SortableHeader";
import { EmptyState } from "../components/EmptyState";
import { EmployeeSelect } from "../components/EmployeeSelect";
import * as odooData from "../lib/api/odooData";
import {
  useLeaveEmployeeScope, empDisplayName, useLeaveTypes, useLeaveRequests,
  useLeaveBalances, useLeavePermissions, resolveLeaveEntitlement,
  useLeavePolicies,
  type DbLeaveRequest, type DbLeaveType, type DbLeaveBalance, type DbLeavePermission,
} from "../lib/hooks";
import { localizedAlert } from "../i18n/native";
import { arabicSource } from "../i18n/source";
import {
  isLeavePending,
  leaveStatusKeys,
  normalizeLeaveStatus,
  translateBackendCode,
} from "../i18n/status";

// ══════════════════════════ Styles ══════════════════════════

const cardCls = "bg-card/30 backdrop-blur-md border border-border/40 rounded-xl overflow-hidden shadow-lg";
const inputCls = "w-full h-10 px-3 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none";

const statusColors: Record<string, string> = {
  [arabicSource("common.pending")]: "bg-primary/10 border-primary/20 text-primary",
  [arabicSource("common.accepted")]: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  [arabicSource("common.rejected_3")]: "bg-destructive/10 border-destructive/20 text-destructive",
};

const kanbanColumns: { key: string; label: string; accent: string; dotColor: string }[] = [
  { key: arabicSource("common.pending"), label: arabicSource("common.pending"), accent: "border-primary/40", dotColor: "bg-primary" },
  { key: arabicSource("common.accepted"), label: arabicSource("common.accepted"), accent: "border-emerald-500/40", dotColor: "bg-emerald-500" },
  { key: arabicSource("common.rejected_3"), label: arabicSource("common.rejected_3"), accent: "border-destructive/40", dotColor: "bg-destructive" },
];

const TABS = [
  { id: "requests", label: arabicSource("leave.leave_requests"), icon: CalendarDays },
  { id: "balances", label: arabicSource("leave.leave_balances"), icon: TrendingDown },
  { id: "permissions", label: arabicSource("leave.permissions"), icon: Timer },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ══════════════════════════ Main Component ══════════════════════════

export function Leave() {
  const {
    employees,
    loading: empLoading,
    selfOnly,
    linkError: employeeLinkError,
  } = useLeaveEmployeeScope();
  const { types: leaveTypes, loading: typesLoading } = useLeaveTypes();
  const { policies } = useLeavePolicies();
  const { requests, loading: reqLoading, refetch: refetchRequests } = useLeaveRequests();
  const currentYear = new Date().getFullYear();
  const { balances, loading: balLoading, refetch: refetchBalances } = useLeaveBalances(currentYear);
  const { permissions, loading: permLoading, refetch: refetchPermissions } = useLeavePermissions();

  const [activeTab, setActiveTab] = useState<TabId>("requests");
  const [filter, setFilter] = useState(arabicSource("common.all"));
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showPermForm, setShowPermForm] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [leaveSortBy, setLeaveSortBy] = useState<"employee" | "type" | "start" | "end" | "days" | "status">("start");
  const [leaveSortDir, setLeaveSortDir] = useState<"asc" | "desc">("desc");

  const empMap = useMemo(() => {
    const m: Record<string, typeof employees[0]> = {};
    employees.forEach(e => { m[e.id] = e; });
    return m;
  }, [employees]);

  const activeLeaveTypes = useMemo(() => leaveTypes.filter(t => t.is_active), [leaveTypes]);

  // Filter & search requests
  const filteredRequests = useMemo(() => {
    let list = [...requests];
    if (filter !== arabicSource("common.all")) {
      list = list.filter(r => normalizeLeaveStatus(r.status) === filter);
    }
    if (search) {
      list = list.filter(r => {
        const emp = empMap[r.employee_id];
        const name = emp ? empDisplayName(emp) : "";
        return name.includes(search) || r.leave_type.includes(search) || (r.reason || "").includes(search);
      });
    }
    const dir = leaveSortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (leaveSortBy === "employee") {
        const na = empMap[a.employee_id] ? empDisplayName(empMap[a.employee_id]) : "";
        const nb = empMap[b.employee_id] ? empDisplayName(empMap[b.employee_id]) : "";
        return dir * na.localeCompare(nb, "ar");
      }
      if (leaveSortBy === "type") return dir * (a.leave_type || "").localeCompare(b.leave_type || "", "ar");
      if (leaveSortBy === "start") return dir * (a.start_date || "").localeCompare(b.start_date || "");
      if (leaveSortBy === "end") return dir * (a.end_date || "").localeCompare(b.end_date || "");
      if (leaveSortBy === "days") return dir * ((a.days || 0) - (b.days || 0));
      if (leaveSortBy === "status") {
        return dir * normalizeLeaveStatus(a.status).localeCompare(normalizeLeaveStatus(b.status), "ar");
      }
      return 0;
    });
    return list;
  }, [requests, filter, search, empMap, leaveSortBy, leaveSortDir]);

  // Stats (normalize so legacy "قيد الانتظار" counts as pending)
  const pendingCount = requests.filter(r => isLeavePending(r.status)).length;
  const approvedCount = requests.filter(
    r => normalizeLeaveStatus(r.status) === arabicSource("common.accepted"),
  ).length;
  const rejectedCount = requests.filter(
    r => normalizeLeaveStatus(r.status) === arabicSource("common.rejected_3"),
  ).length;

  // Approve / Reject — Odoo native leave workflow
  const handleApprove = async (id: string) => {
    try {
      try {
        await odooData.hrApproveLeave(id);
      } catch {
        await odooData.managerApproveLeave(id);
      }
      refetchRequests();
      refetchBalances();
    } catch (e: any) {
      console.error("Approve error:", e.message);
      localizedAlert(arabicSource("leave.error_accepting_request") + " " + e.message);
    }
  };

  const handleReject = async (id: string, reason?: string) => {
    try {
      await odooData.refuseLeave(id, reason);
      refetchRequests();
    } catch (e: any) {
      console.error("Reject error:", e.message);
      localizedAlert(arabicSource("leave.error_rejecting_the_request") + " " + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await odooData.cancelLeave(id);
      refetchRequests();
      refetchBalances();
    } catch (e: any) {
      console.error("Delete error:", e.message);
      localizedAlert(arabicSource("leave.error_deleting_request") + " " + e.message);
    }
  };

  const loading = empLoading || typesLoading || reqLoading || balLoading || permLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-muted-foreground ms-3">{arabicSource("leave.loading_vacation_data")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-gradient-gold">{arabicSource("leave.leave_management")}</h1>
          <p className="text-muted-foreground mt-1">{arabicSource("leave.follow_up_on_requests_for_leave_balances_and_authorizations")}</p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === "requests" && <ViewToggle view={viewMode} onChange={setViewMode} />}
          {activeTab === "requests" && (
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg shadow-lg shadow-primary/20 hover:bg-gold-dark transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> {arabicSource("leave.leave_request")}
            </motion.button>
          )}
          {activeTab === "permissions" && (
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShowPermForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg shadow-lg shadow-primary/20 hover:bg-gold-dark transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> {arabicSource("leave.asking_for_permission")}
            </motion.button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: arabicSource("leave.pending_requests"), value: pendingCount, icon: Clock, color: "text-primary" },
          { label: arabicSource("leave.requests_accepted"), value: approvedCount, icon: Check, color: "text-emerald-400" },
          { label: arabicSource("leave.requests_rejected"), value: rejectedCount, icon: X, color: "text-destructive" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)" }}
              className="bg-card backdrop-blur-sm border border-border rounded-xl p-4 shadow-lg relative overflow-hidden hover:border-primary/30 transition-colors"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent w-28 pointer-events-none" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-muted-foreground" style={{ fontSize: 13 }}>{stat.label}</p>
                  <span className="text-gradient-gold block mt-1" style={{ fontSize: 28 }}>{stat.value}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-card/40 border border-border/30 rounded-xl w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
              style={{ fontSize: 13 }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "requests" && (
          <motion.div key="requests" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Filters & Search */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Filter className="w-4 h-4 text-muted-foreground" />
              {[arabicSource("common.all"), arabicSource("common.pending"), arabicSource("common.accepted"), arabicSource("common.rejected_3")].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                    filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                  style={{ fontSize: 13 }}
                >
                  {f}
                </button>
              ))}
              <div className="relative flex-1 max-w-xs ms-auto">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder={arabicSource("common.search")}
                  className={`${inputCls} ps-10`}
                />
              </div>
            </div>

            {viewMode === "list" ? (
              <div className={cardCls}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <SortableHeaderRow
                        columns={[
                          { label: arabicSource("common.employee"), key: "employee" },
                          { label: arabicSource("leave.leave_type"), key: "type" },
                          { label: arabicSource("common.from"), key: "start" },
                          { label: arabicSource("common.to"), key: "end" },
                          { label: arabicSource("common.duration"), key: "days" },
                          { label: arabicSource("common.the_reason"), key: null },
                          { label: arabicSource("common.status"), key: "status" },
                          { label: arabicSource("common.procedures"), key: null },
                        ]}
                        sortBy={leaveSortBy}
                        sortDir={leaveSortDir}
                        onSort={(key) => toggleSort(key, leaveSortBy, leaveSortDir, setLeaveSortBy, setLeaveSortDir)}
                      />
                    </thead>
                    <tbody>
                      {filteredRequests.length > 0 ? filteredRequests.map((leave, i) => {
                        const emp = empMap[leave.employee_id];
                        const empName = emp ? empDisplayName(emp) : leave.employee_id;
                        const lt = activeLeaveTypes.find(t => t.code === leave.leave_type || t.name_ar === leave.leave_type);
                        return (
                          <motion.tr
                            key={leave.id}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                            className="border-b border-border/20 hover:bg-muted/10 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                                  <span className="text-primary" style={{ fontSize: 11 }}>{empName.charAt(0)}</span>
                                </div>
                                <span className="text-foreground" style={{ fontSize: 13 }}>{empName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className="px-2 py-0.5 rounded-md border"
                                style={{ fontSize: 12, borderColor: lt?.color || "#3b82f6", color: lt?.color || "#3b82f6", backgroundColor: (lt?.color || "#3b82f6") + "15" }}
                              >
                                {leave.leave_type}
                                {leave.is_half_day && <span className="ms-1" style={{ fontSize: 10 }}>{arabicSource("leave.half_a_day")}</span>}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{leave.start_date}</td>
                            <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{leave.end_date}</td>
                            <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }}>
                              {leave.days} {leave.is_half_day ? arabicSource("common.half_a_day") : arabicSource("common.days_2")}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }}>{leave.reason || "—"}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-md border ${statusColors[normalizeLeaveStatus(leave.status)] || ""}`} style={{ fontSize: 12 }}>
                                {translateBackendCode(leave.status, leaveStatusKeys)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {isLeavePending(leave.status) ? (
                                <div className="flex items-center gap-1">
                                  <button onClick={() => handleApprove(leave.id)} className="p-1.5 rounded hover:bg-emerald-500/20 transition-colors cursor-pointer" title={arabicSource("common.accept")}>
                                    <Check className="w-4 h-4 text-emerald-400" />
                                  </button>
                                  <button onClick={() => handleReject(leave.id)} className="p-1.5 rounded hover:bg-destructive/20 transition-colors cursor-pointer" title={arabicSource("common.rejected_2")}>
                                    <X className="w-4 h-4 text-destructive" />
                                  </button>
                                  <button onClick={() => handleDelete(leave.id)} className="p-1.5 rounded hover:bg-destructive/20 transition-colors cursor-pointer" title={arabicSource("common.delete")}>
                                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-muted-foreground" style={{ fontSize: 11 }}>
                                  {leave.rejection_reason && <span className="text-destructive">{leave.rejection_reason}</span>}
                                </span>
                              )}
                            </td>
                          </motion.tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan={8}><EmptyState icon={CalendarDays} message={arabicSource("leave.there_are_no_leave_requests")} /></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Kanban View */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {kanbanColumns.map((col, ci) => {
                  const items = filteredRequests.filter(r => normalizeLeaveStatus(r.status) === col.key);
                  return (
                    <motion.div
                      key={col.key}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.1 }}
                      className={`bg-card/20 backdrop-blur-md border ${col.accent} rounded-xl shadow-lg overflow-hidden`}
                    >
                      <div className="p-4 border-b border-border/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                          <span className="text-foreground" style={{ fontSize: 14 }}>{col.label}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground" style={{ fontSize: 11 }}>
                          {items.length}
                        </span>
                      </div>
                      <div className="p-3 space-y-3 min-h-[200px]">
                        {items.length > 0 ? items.map((leave, i) => {
                          const emp = empMap[leave.employee_id];
                          const empName = emp ? empDisplayName(emp) : "—";
                          return (
                            <motion.div
                              key={leave.id}
                              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                              className="bg-card/60 border border-border/30 rounded-lg p-3 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                                  <span className="text-primary" style={{ fontSize: 11 }}>{empName.charAt(0)}</span>
                                </div>
                                <span className="text-foreground" style={{ fontSize: 13 }}>{empName}</span>
                              </div>
                              <div className="space-y-1.5">
                                <span className="inline-block px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary" style={{ fontSize: 11 }}>
                                  {leave.leave_type}
                                </span>
                                {leave.reason && <p className="text-muted-foreground" style={{ fontSize: 11 }}>{leave.reason}</p>}
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground" style={{ fontSize: 11 }}>
                                    {leave.days} {leave.is_half_day ? arabicSource("common.half_a_day") : arabicSource("common.days_2")}
                                  </span>
                                  <span className="text-muted-foreground" style={{ fontSize: 10 }} dir="ltr">{leave.start_date}</span>
                                </div>
                              </div>
                              {isLeavePending(leave.status) && (
                                <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/20">
                                  <button onClick={() => handleApprove(leave.id)} className="flex-1 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors cursor-pointer" style={{ fontSize: 11 }}>
                                    <Check className="w-3.5 h-3.5 inline-block" /> {arabicSource("common.accept")}
                                  </button>
                                  <button onClick={() => handleReject(leave.id)} className="flex-1 py-1 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors cursor-pointer" style={{ fontSize: 11 }}>
                                    <X className="w-3.5 h-3.5 inline-block" /> {arabicSource("common.rejected_2")}
                                  </button>
                                </div>
                              )}
                            </motion.div>
                          );
                        }) : (
                          <EmptyState icon={CalendarDays} message={arabicSource("leave.no_requests")} className="py-8" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "balances" && (
          <motion.div key="balances" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <BalancesTab
              employees={employees}
              leaveTypes={activeLeaveTypes}
              balances={balances}
              policies={policies}
              loading={balLoading}
              year={currentYear}
            />
          </motion.div>
        )}

        {activeTab === "permissions" && (
          <motion.div key="permissions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <PermissionsTab
              permissions={permissions}
              empMap={empMap}
              loading={permLoading}
              refetch={refetchPermissions}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Leave Request Modal */}
      <AnimatePresence>
        {showForm && (
          <LeaveRequestModal
            employees={employees}
            leaveTypes={activeLeaveTypes}
            balances={balances}
            selfOnly={selfOnly}
            linkError={employeeLinkError}
            employeesLoading={empLoading}
            onClose={() => setShowForm(false)}
            onSubmit={async () => { refetchRequests(); refetchBalances(); setShowForm(false); }}
          />
        )}
      </AnimatePresence>

      {/* New Permission Modal */}
      <AnimatePresence>
        {showPermForm && (
          <PermissionModal
            employees={employees}
            onClose={() => setShowPermForm(false)}
            onSubmit={async () => { refetchPermissions(); setShowPermForm(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════ Balances Tab ══════════════════════════

function BalancesTab({
  employees, leaveTypes, balances, policies, loading, year,
}: {
  employees: any[];
  leaveTypes: DbLeaveType[];
  balances: DbLeaveBalance[];
  policies: any[];
  loading: boolean;
  year: number;
}) {
  const [selectedEmp, setSelectedEmp] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredEmployees = employees.filter(e =>
    !search || empDisplayName(e).includes(search) || e.department?.includes(search)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (selectedEmp) {
    const emp = employees.find(e => e.id === selectedEmp);
    if (!emp) return null;
    const empBalances = balances.filter(b => b.employee_id === selectedEmp);

    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedEmp(null)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
          {arabicSource("leave.return_to_the_list_of_employees")}
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="text-primary" style={{ fontSize: 18 }}>{empDisplayName(emp).charAt(0)}</span>
          </div>
          <div>
            <h3 className="text-foreground">{empDisplayName(emp)}</h3>
            <p className="text-muted-foreground" style={{ fontSize: 13 }}>{emp.department} — {year}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {leaveTypes.map((lt, i) => {
            const bal = empBalances.find(b => b.leave_type === lt.name_ar || b.leave_type_id === lt.id);
            const entitlement = resolveLeaveEntitlement(lt, policies, emp.department);
            const totalDays = bal?.total_days ?? entitlement;
            const usedDays = bal?.used_days ?? 0;
            const carryover = bal?.carryover_days ?? 0;
            const remaining = totalDays + carryover - usedDays;
            const pct = totalDays > 0 ? Math.min(100, (usedDays / (totalDays + carryover)) * 100) : 0;

            return (
              <motion.div
                key={lt.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-card backdrop-blur-sm border border-border rounded-xl p-5 shadow-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-foreground" style={{ fontSize: 14 }}>{lt.name_ar}</span>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: lt.color }} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-gradient-gold" style={{ fontSize: 28 }}>{remaining}</span>
                  <span className="text-muted-foreground" style={{ fontSize: 12 }}>/ {totalDays + carryover} {arabicSource("common.days_2")}</span>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-muted/30">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: lt.color }} />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-muted-foreground" style={{ fontSize: 11 }}>{arabicSource("common.user")} {usedDays}</p>
                  {carryover > 0 && <p className="text-muted-foreground" style={{ fontSize: 11 }}>{arabicSource("leave.relay")} {carryover}</p>}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {lt.allow_half_day && <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20" style={{ fontSize: 9 }}>{arabicSource("common.half_a_day")}</span>}
                  {lt.is_encashable && <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" style={{ fontSize: 9 }}>{arabicSource("common.exchangeable")}</span>}
                  {lt.is_carryover_allowed && <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20" style={{ fontSize: 9 }}>{arabicSource("common.relay")}</span>}
                  {!lt.is_paid && <span className="px-1.5 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20" style={{ fontSize: 9 }}>{arabicSource("common.without_salary")}</span>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder={arabicSource("common.search_by_name_or_department")}
          className={`${inputCls} ps-10`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredEmployees.map((emp, i) => {
          const empBals = balances.filter(b => b.employee_id === emp.id);
          const totalUsed = empBals.reduce((s, b) => s + b.used_days, 0);
          return (
            <motion.button
              key={emp.id}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
              onClick={() => setSelectedEmp(emp.id)}
              className="flex items-center gap-3 p-4 rounded-xl border border-border/30 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer text-start"
            >
              <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <span className="text-primary" style={{ fontSize: 14 }}>{empDisplayName(emp).charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground truncate">{empDisplayName(emp)}</p>
                <p className="text-muted-foreground" style={{ fontSize: 12 }}>{emp.department}</p>
              </div>
              <div className="text-end">
                <p className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("common.user")} {totalUsed} {arabicSource("common.days_2")}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════ Permissions Tab ══════════════════════════

function PermissionsTab({
  permissions, empMap, loading, refetch,
}: {
  permissions: DbLeavePermission[];
  empMap: Record<string, any>;
  loading: boolean;
  refetch: () => void;
}) {
  const handleApprove = async (id: string) => {
    await odooData.updateLeavePermission(id, "approved");
    refetch();
  };
  const handleReject = async (id: string) => {
    await odooData.updateLeavePermission(id, "refused");
    refetch();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className={cardCls}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/20 border-b border-border/20">
              {[arabicSource("common.employee"), arabicSource("common.date"), arabicSource("common.from"), arabicSource("common.to"), arabicSource("common.duration"), arabicSource("common.the_reason"), arabicSource("common.status"), arabicSource("common.procedures")].map(h => (
                <th key={h} className="text-start px-4 py-3 text-muted-foreground" style={{ fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissions.length > 0 ? permissions.map((p, i) => {
              const emp = empMap[p.employee_id];
              const empName = emp ? empDisplayName(emp) : "—";
              return (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-border/20 hover:bg-muted/10 transition-colors"
                >
                  <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }}>{empName}</td>
                  <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{p.date}</td>
                  <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{p.start_time?.substring(0, 5)}</td>
                  <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{p.end_time?.substring(0, 5)}</td>
                  <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }}>{p.hours} {arabicSource("common.hours")}</td>
                  <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }}>{p.reason || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md border ${statusColors[p.status] || ""}`} style={{ fontSize: 12 }}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.status === arabicSource("common.pending") && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleApprove(p.id)} className="p-1.5 rounded hover:bg-emerald-500/20 transition-colors cursor-pointer">
                          <Check className="w-4 h-4 text-emerald-400" />
                        </button>
                        <button onClick={() => handleReject(p.id)} className="p-1.5 rounded hover:bg-destructive/20 transition-colors cursor-pointer">
                          <X className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              );
            }) : (
              <tr>
                <td colSpan={8}><EmptyState icon={Timer} message={arabicSource("leave.there_are_no_permission_requests")} /></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════ Leave Request Modal ══════════════════════════

function LeaveRequestModal({
  employees, leaveTypes, balances, selfOnly, linkError, employeesLoading,
  onClose, onSubmit,
}: {
  employees: any[];
  leaveTypes: DbLeaveType[];
  balances: DbLeaveBalance[];
  selfOnly: boolean;
  linkError: string | null;
  employeesLoading: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
}) {
  const selfEmployee = selfOnly ? employees[0] || null : null;
  const selfEmployeeId = selfEmployee ? String(selfEmployee.id) : "";
  const [employeeId, setEmployeeId] = useState(selfEmployeeId);
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayPeriod, setHalfDayPeriod] = useState<"morning" | "afternoon">("morning");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (selfOnly && selfEmployeeId) {
      setEmployeeId(selfEmployeeId);
    }
  }, [selfOnly, selfEmployeeId]);

  const selectedType = leaveTypes.find(t => t.id === leaveTypeId);

  // Calculate working days (excluding Friday & Saturday — Iraqi weekend)
  const days = useMemo(() => {
    if (isHalfDay) return 0.5;
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return 0;
    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const dow = cur.getDay(); // 0=Sun, 5=Fri, 6=Sat
      if (dow !== 5 && dow !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }, [startDate, endDate, isHalfDay]);

  // Remaining balance for selected employee+type
  const remainingBalance = useMemo(() => {
    if (!employeeId || !leaveTypeId) return null;
    const lt = leaveTypes.find(t => t.id === leaveTypeId);
    if (!lt) return null;
    const bal = balances.find(b => b.employee_id === employeeId && (b.leave_type_id === leaveTypeId || b.leave_type === lt.name_ar));
    if (!bal) {
      // No balance record — if the leave type normally allocates days, treat as 0 remaining
      // (unpaid leave with default_days_per_year=30 still needs a balance record to track usage)
      return (lt as any).default_days_per_year > 0 ? 0 : null;
    }
    return bal.total_days + bal.carryover_days + bal.accrued_days - bal.used_days;
  }, [employeeId, leaveTypeId, balances, leaveTypes]);

  const handleSubmit = async () => {
    if (selfOnly && (linkError || !selfEmployee)) {
      setError(linkError || "Your user account is not linked to an employee. Please contact HR.");
      return;
    }
    if ((!selfOnly && !employeeId) || !leaveTypeId || !startDate) {
      setError(arabicSource("common.please_fill_out_all_required_fields"));
      return;
    }
    const lt = leaveTypes.find(t => t.id === leaveTypeId);
    if (!lt) return;

    // Validate balance
    if (remainingBalance !== null && days > remainingBalance) {
      setError(`${arabicSource("leave.remaining_balance")}${remainingBalance} ${arabicSource("leave.day_is_not_enough_for_the_required_number_of_days")}${days} ${arabicSource("common.days_3")}`);
      return;
    }

    setSaving(true);
    setError("");

    try {
      // Self-only: omit employee_id so backend uses current_employee().
      // List + manage_types: pass selected employee (existing HR behavior).
      // List without manage_types: still pass selection for UI consistency; backend
      // ignores employee_id unless manage_types (unchanged permission model).
      const payload: Parameters<typeof odooData.requestLeave>[0] = {
        leave_type_id: lt.id,
        date_from: startDate,
        date_to: isHalfDay ? startDate : (endDate || startDate),
        reason: reason || null,
        half_day: isHalfDay,
      };
      if (!selfOnly) {
        payload.employee_id = employeeId;
      }
      await odooData.requestLeave(payload);
      setSaving(false);
      await onSubmit();
    } catch (e: any) {
      setError(e?.message || "فشل إنشاء طلب الإجازة");
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-foreground">{arabicSource("leave.new_leave_request")}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary cursor-pointer">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive" style={{ fontSize: 13 }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Employee Selection */}
          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("common.employee_3")}</label>
            {selfOnly ? (
              employeesLoading ? (
                <div className={`${inputCls} flex items-center text-muted-foreground`} style={{ fontSize: 13 }}>
                  <Loader2 className="w-4 h-4 animate-spin me-2" />
                </div>
              ) : linkError || !selfEmployee ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive" style={{ fontSize: 13 }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {linkError || "Your user account is not linked to an employee. Please contact HR."}
                </div>
              ) : (
                <input
                  type="text"
                  readOnly
                  disabled
                  value={empDisplayName(selfEmployee)}
                  className={`${inputCls} opacity-80 cursor-not-allowed`}
                  style={{ fontSize: 13 }}
                  dir="auto"
                  aria-label="My employee"
                />
              )
            ) : (
              <EmployeeSelect
                employees={employees}
                labels={Object.fromEntries(employees.map((e) => [String(e.id), empDisplayName(e)]))}
                value={employeeId}
                onChange={(id) => setEmployeeId(String(id))}
              />
            )}
          </div>

          {/* Leave Type */}
          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("leave.leave_type_2")}</label>
            <div className="flex flex-wrap gap-2">
              {leaveTypes.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setLeaveTypeId(t.id); if (!t.allow_half_day) setIsHalfDay(false); }}
                  className={`px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                    leaveTypeId === t.id
                      ? "border-primary/40 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/20"
                  }`}
                  style={{ fontSize: 13, backgroundColor: leaveTypeId === t.id ? t.color + "15" : undefined }}
                >
                  {t.name_ar}
                  {!t.is_paid && <span className="text-destructive ms-1" style={{ fontSize: 10 }}>{arabicSource("leave.without_salary")}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Half Day Toggle */}
          {selectedType?.allow_half_day && (
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox" checked={isHalfDay} onChange={e => setIsHalfDay(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-foreground" style={{ fontSize: 13 }}>{arabicSource("common.half_a_day")}</span>
              </label>
              {isHalfDay && (
                <div className="flex gap-2">
                  {([["morning", arabicSource("leave.morning")], ["afternoon", arabicSource("leave.evening")]] as const).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setHalfDayPeriod(val)}
                      className={`px-3 py-1 rounded-md border transition-colors cursor-pointer ${
                        halfDayPeriod === val
                          ? "bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground"
                      }`}
                      style={{ fontSize: 12 }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>
                {isHalfDay ? arabicSource("common.date") : arabicSource("common.from_date")} *
              </label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} dir="ltr" />
            </div>
            {!isHalfDay && (
              <div>
                <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("leave.to_date")}</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} dir="ltr" min={startDate} />
              </div>
            )}
          </div>

          {days > 0 && (
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                <span className="text-primary" style={{ fontSize: 13 }}>{arabicSource("common.duration_2")} {days} {isHalfDay ? arabicSource("common.half_a_day") : arabicSource("common.days_2")}</span>
              </div>
              {remainingBalance !== null && (
                <span className={`${days > remainingBalance ? "text-destructive" : "text-emerald-400"}`} style={{ fontSize: 12 }}>
                  {arabicSource("leave.remaining_balance_2")} {remainingBalance} {arabicSource("common.days_2")}
                </span>
              )}
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("common.the_reason")}</label>
            <textarea
              value={reason} onChange={e => setReason(e.target.value)}
              rows={2} placeholder={arabicSource("leave.reason_for_leave")}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none resize-none"
            />
          </div>

          {/* Attachment notice */}
          {selectedType?.requires_attachment && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400" style={{ fontSize: 12 }}>
              <FileText className="w-4 h-4" />
              {arabicSource("leave.this_type_of_leave_requires_an_attachment_medical_report_etc")}
              {selectedType.attachment_after_days && ` ${arabicSource("leave.after")} ${selectedType.attachment_after_days} ${arabicSource("common.days")}`}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={saving || employeesLoading || (selfOnly && (!!linkError || !selfEmployee))}
              className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground hover:bg-gold-dark transition-colors shadow-lg shadow-primary/20 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {arabicSource("leave.send_request")}
            </button>
            <button
              onClick={onClose}
              className="flex-1 h-11 rounded-lg border-2 border-border text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              {arabicSource("common.cancel")}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ══════════════════════════ Permission Modal ══════════════════════════

function PermissionModal({
  employees, onClose, onSubmit,
}: {
  employees: any[];
  onClose: () => void;
  onSubmit: () => Promise<void>;
}) {
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const hours = useMemo(() => {
    if (!startTime || !endTime) return 0;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    return Math.max(0, Math.round(((eh * 60 + em) - (sh * 60 + sm)) / 60 * 100) / 100);
  }, [startTime, endTime]);

  const handleSubmit = async () => {
    if (!employeeId || !date || !startTime || !endTime) {
      setError(arabicSource("common.please_fill_out_all_required_fields"));
      return;
    }
    setSaving(true);
    setError("");

    try {
      await odooData.createLeavePermission({
        employee_id: employeeId,
        date,
        start_time: startTime,
        end_time: endTime,
        hours,
        reason: reason || null,
      });
      setSaving(false);
      await onSubmit();
    } catch (e: any) {
      setError(e?.message || "فشل إنشاء الإذن");
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-foreground">{arabicSource("leave.new_permission_request")}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary cursor-pointer">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive" style={{ fontSize: 13 }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Employee */}
          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("common.employee_3")}</label>
            <EmployeeSelect
              employees={employees}
              labels={Object.fromEntries(employees.map((e) => [String(e.id), empDisplayName(e)]))}
              value={employeeId}
              onChange={(id) => setEmployeeId(String(id))}
            />
          </div>

          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("common.date_2")}</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} dir="ltr" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("leave.of_the_hour")}</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={inputCls} dir="ltr" />
            </div>
            <div>
              <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("leave.to_the_hour")}</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={inputCls} dir="ltr" />
            </div>
          </div>

          {hours > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
              <Timer className="w-4 h-4 text-primary" />
              <span className="text-primary" style={{ fontSize: 13 }}>{arabicSource("common.duration_2")} {hours} {arabicSource("common.hours")}</span>
            </div>
          )}

          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("common.the_reason")}</label>
            <textarea
              value={reason} onChange={e => setReason(e.target.value)}
              rows={2} placeholder={arabicSource("leave.the_reason_for_asking_permission")}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground hover:bg-gold-dark transition-colors shadow-lg shadow-primary/20 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {arabicSource("leave.send")}
            </button>
            <button
              onClick={onClose}
              className="flex-1 h-11 rounded-lg border-2 border-border text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              {arabicSource("common.cancel")}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
