import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText, Plus, Check, X, Clock, Loader2, Search, Eye,
  ChevronRight, AlertCircle, Briefcase, Shield, UserX, Save,
  Trash2, Calendar, FileCheck, AlertTriangle, CheckCircle,
  ClipboardList, LogOut, DollarSign, RefreshCw, Timer,
} from "lucide-react";
import * as odooData from "../lib/api/odooData";
import { EmptyState } from "../components/EmptyState";
import { EmployeeSelect } from "../components/EmployeeSelect";
import {
  useEmployees, empDisplayName, useContractTypes, useEmployeeContracts,
  useDocumentTypes, useEmployeeDocuments, useExitChecklistItems,
  useExitProcesses, useExitChecklist, useConfigurations,
  type DbContractType, type DbEmployeeContract, type DbDocumentType,
  type DbEmployeeDocument, type DbExitProcess, type DbExitChecklist, type DbExitChecklistItem,
} from "../lib/hooks";
import { calculateEOS, DEFAULT_EOS_CONFIG } from "../lib/payslip-engine";
import { formatDate, formatNumber } from "../i18n/format";
import { arabicSource } from "../i18n/source";

const cardCls = "bg-card/30 backdrop-blur-md border border-border/40 rounded-xl overflow-hidden shadow-lg";
const inputCls = "w-full h-10 px-3 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none";

const TABS = [
  { id: "contracts", label: arabicSource("lifecycle.contracts"), icon: Briefcase },
  { id: "documents", label: arabicSource("lifecycle.documentation"), icon: FileText },
  { id: "exit", label: arabicSource("lifecycle.end_of_service"), icon: LogOut },
] as const;

type TabId = (typeof TABS)[number]["id"];

// Default status colors — keys can be extended via configurations table
const DEFAULT_STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  expired: "bg-destructive/10 border-destructive/20 text-destructive",
  terminated: "bg-destructive/10 border-destructive/20 text-destructive",
  renewed: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  pending: "bg-primary/10 border-primary/20 text-primary",
  valid: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  expiring_soon: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  missing: "bg-destructive/10 border-destructive/20 text-destructive",
  pending_review: "bg-primary/10 border-primary/20 text-primary",
  initiated: "bg-primary/10 border-primary/20 text-primary",
  in_progress: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  clearance: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  settlement: "bg-purple-500/10 border-purple-500/20 text-purple-400",
  completed: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  cancelled: "bg-muted/20 border-muted/30 text-muted-foreground",
};

const DEFAULT_STATUS_LABELS: Record<string, string> = {
  active: arabicSource("common.is_active"), expired: arabicSource("common.finished"), terminated: arabicSource("lifecycle.terminated"), renewed: arabicSource("lifecycle.refurbished"), pending: arabicSource("common.pending"),
  valid: arabicSource("common.surrey"), expiring_soon: arabicSource("common.soon_to_be_completed"), missing: arabicSource("common.is_missing"), pending_review: arabicSource("common.is_under_review"),
  initiated: arabicSource("lifecycle.started"), in_progress: arabicSource("common.my_neighbor"), clearance: arabicSource("lifecycle.disclaimer"), settlement: arabicSource("lifecycle.settlement"),
  completed: arabicSource("common.complete"), cancelled: arabicSource("common.canceled"),
  passed: arabicSource("common.successful"), failed: arabicSource("common.failed"), waived: arabicSource("lifecycle.exempt"),
};

const DEFAULT_EXIT_TYPE_LABELS: Record<string, string> = {
  resignation: arabicSource("lifecycle.resignation"), termination: arabicSource("common.termination_of_service"), contract_end: arabicSource("lifecycle.contract_expiration"),
  retirement: arabicSource("lifecycle.retired"), mutual: arabicSource("lifecycle.mutual_agreement"), death: arabicSource("lifecycle.death"),
};

/** Build a key-to-label map from the configured comma-separated key:value pairs. */
function parseKeyLabelMap(configStr: string, defaults: Record<string, string>): Record<string, string> {
  if (!configStr) return defaults;
  const map: Record<string, string> = {};
  configStr.split(',').forEach(pair => {
    const [key, label] = pair.split(':').map(s => s.trim());
    if (key && label) map[key] = label;
  });
  return Object.keys(map).length > 0 ? map : defaults;
}

// ══════════════════════════ Main Component ══════════════════════════

export function Lifecycle() {
  const { employees, loading: empLoading } = useEmployees();
  const { types: contractTypes } = useContractTypes();
  const { contracts, loading: contractsLoading, refetch: refetchContracts } = useEmployeeContracts();
  const { types: docTypes } = useDocumentTypes();
  const { documents, loading: docsLoading, refetch: refetchDocs } = useEmployeeDocuments();
  const { items: exitItems } = useExitChecklistItems();
  const { processes: exitProcesses, loading: exitLoading, refetch: refetchExit } = useExitProcesses();
  const { getValue, getNumber } = useConfigurations();

  // Config-driven maps
  const exitTypeLabels = useMemo(() => parseKeyLabelMap(
    getValue('lifecycle.exit_types', ''),
    DEFAULT_EXIT_TYPE_LABELS,
  ), [getValue]);

  const statusLabels = useMemo(() => parseKeyLabelMap(
    getValue('lifecycle.status_labels', ''),
    DEFAULT_STATUS_LABELS,
  ), [getValue]);

  const statusColors = DEFAULT_STATUS_COLORS; // CSS classes stay as defaults, extensible via code

  const checklistCategoryLabels = useMemo(() => parseKeyLabelMap(
    getValue('lifecycle.exit_checklist_categories', ''),
    { general: arabicSource("common.general"), it: arabicSource("common.information_technology"), finance: arabicSource("common.finance"), hr: arabicSource("common.human_resources"), admin: arabicSource("common.management"), custodies: arabicSource("lifecycle.covenant") },
  ), [getValue]);

  const probationAlertDays = getNumber('lifecycle.probation_alert_days', 30);

  const [activeTab, setActiveTab] = useState<TabId>("contracts");
  const [search, setSearch] = useState("");

  const empMap = useMemo(() => {
    const m: Record<string, typeof employees[0]> = {};
    employees.forEach(e => { m[e.id] = e; });
    return m;
  }, [employees]);

  const loading = empLoading || contractsLoading || docsLoading || exitLoading;

  // Stats
  const activeContracts = contracts.filter(c => c.status === "active").length;
  const expiringDocs = documents.filter(d => d.status === "expiring_soon").length;
  const activeExits = exitProcesses.filter(p => p.status !== "completed" && p.status !== "cancelled").length;

  // Probation alerts — threshold from config
  const probationAlerts = contracts.filter(c => {
    if (c.probation_status !== "pending" || !c.probation_end_date) return false;
    const daysLeft = Math.ceil((new Date(c.probation_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft <= probationAlertDays && daysLeft >= 0;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-muted-foreground ms-3">{arabicSource("common.loading")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-gradient-gold">{arabicSource("common.employee_life_cycle")}</h1>
        <p className="text-muted-foreground mt-1">{arabicSource("lifecycle.contracts_documents_and_termination_management")}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: arabicSource("common.active_contracts"), value: activeContracts, icon: Briefcase, color: "text-emerald-400" },
          { label: arabicSource("lifecycle.documents_are_almost_complete"), value: expiringDocs, icon: AlertTriangle, color: "text-amber-400" },
          { label: arabicSource("lifecycle.close_experience_periods"), value: probationAlerts.length, icon: Timer, color: "text-blue-400" },
          { label: arabicSource("lifecycle.termination_proceedings_in_progress"), value: activeExits, icon: LogOut, color: "text-destructive" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)" }}
              className="relative bg-card backdrop-blur-sm border border-border rounded-xl p-5 shadow-lg overflow-hidden hover:border-primary/30 transition-colors"
            >
              <div className="absolute top-0 end-0 w-28 h-28 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-muted-foreground" style={{ fontSize: 13 }}>{stat.label}</p>
                  <span className={`block mt-1 ${stat.color}`} style={{ fontSize: 28 }}>{stat.value}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Probation Alerts */}
      {probationAlerts.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400" style={{ fontSize: 14 }}>{arabicSource("lifecycle.trial_period_alerts")}</span>
          </div>
          <div className="space-y-1">
            {probationAlerts.map(c => {
              const emp = empMap[c.employee_id];
              const daysLeft = Math.ceil((new Date(c.probation_end_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return (
                <p key={c.id} className="text-foreground" style={{ fontSize: 13 }}>
                  {emp ? empDisplayName(emp) : "—"} {arabicSource("lifecycle.the_trial_period_ends_yet")} <span className="text-amber-400">{daysLeft} {arabicSource("common.days_2")}</span>
                </p>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-card/40 border border-border/30 rounded-xl w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all cursor-pointer ${
                isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
              style={{ fontSize: 13 }}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "contracts" && (
          <motion.div key="contracts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <ContractsTab
              contracts={contracts} contractTypes={contractTypes} empMap={empMap}
              employees={employees} refetch={refetchContracts} search={search}
              onSearchChange={setSearch} statusLabels={statusLabels} statusColors={statusColors}
            />
          </motion.div>
        )}
        {activeTab === "documents" && (
          <motion.div key="documents" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <DocumentsTab
              documents={documents} docTypes={docTypes} empMap={empMap}
              employees={employees} refetch={refetchDocs}
              statusLabels={statusLabels} statusColors={statusColors}
            />
          </motion.div>
        )}
        {activeTab === "exit" && (
          <motion.div key="exit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <ExitTab
              processes={exitProcesses} exitItems={exitItems} empMap={empMap}
              employees={employees} refetch={refetchExit}
              exitTypeLabels={exitTypeLabels} statusLabels={statusLabels} statusColors={statusColors}
              checklistCategoryLabels={checklistCategoryLabels}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════ Contracts Tab ══════════════════════════

function ContractsTab({
  contracts, contractTypes, empMap, employees, refetch, search, onSearchChange,
  statusLabels, statusColors,
}: {
  contracts: DbEmployeeContract[];
  contractTypes: DbContractType[];
  empMap: Record<string, any>;
  employees: any[];
  refetch: () => void;
  search: string;
  onSearchChange: (s: string) => void;
  statusLabels: Record<string, string>;
  statusColors: Record<string, string>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: "", contract_type_id: "", start_date: "", end_date: "",
    salary_amount: 0, salary_currency: "IQD", contract_number: "", notes: "",
  });
  const [saving, setSaving] = useState(false);

  const filtered = contracts.filter(c => {
    if (!search) return true;
    const emp = empMap[c.employee_id];
    const name = emp ? empDisplayName(emp) : "";
    return name.includes(search);
  });

  const handleCreate = async () => {
    if (!formData.employee_id || !formData.contract_type_id || !formData.start_date) return;
    setSaving(true);
    const ct = contractTypes.find(t => t.id === formData.contract_type_id);
    const probEnd = ct && ct.probation_days > 0
      ? new Date(new Date(formData.start_date).getTime() + ct.probation_days * 86400000).toISOString().substring(0, 10)
      : null;

    try {
      await odooData.createContract({
        ...formData,
        salary_amount: formData.salary_amount || null,
        end_date: formData.end_date || null,
        probation_end_date: probEnd,
        probation_status: probEnd ? "pending" : "waived",
        status: "active",
      });
      refetch();
      setShowForm(false);
      setFormData({ employee_id: "", contract_type_id: "", start_date: "", end_date: "", salary_amount: 0, salary_currency: "IQD", contract_number: "", notes: "" });
    } catch (e) {
      console.error(e);
      alert("خطأ في حفظ العقد");
    }
    setSaving(false);
  };

  const handleProbation = async (contractId: string, status: "passed" | "failed") => {
    try {
      await odooData.updateContract(contractId, { probation_status: status });
      refetch();
    } catch (e) {
      console.error(e);
      alert("خطأ في تحديث حالة التجربة");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={e => onSearchChange(e.target.value)} placeholder={arabicSource("lifecycle.search_by_name")} className={`${inputCls} ps-10`} />
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg shadow-lg shadow-primary/20 hover:bg-gold-dark transition-colors cursor-pointer" style={{ fontSize: 13 }}>
          <Plus className="w-4 h-4" /> {arabicSource("common.new_contract")}
        </button>
      </div>

      {/* New Contract Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className={`${cardCls} p-5`}>
            <h3 className="text-foreground mb-4">{arabicSource("common.new_contract")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Employee */}
              <div>
                <label className="text-foreground block mb-1" style={{ fontSize: 12 }}>{arabicSource("common.employee_3")}</label>
                <EmployeeSelect
                  employees={employees}
                  value={formData.employee_id}
                  onChange={(id) => setFormData((p) => ({ ...p, employee_id: id }))}
                />
              </div>
              {/* Contract Type */}
              <div>
                <label className="text-foreground block mb-1" style={{ fontSize: 12 }}>{arabicSource("lifecycle.contract_type_2")}</label>
                <select value={formData.contract_type_id} onChange={e => setFormData(p => ({ ...p, contract_type_id: e.target.value }))} className={inputCls}>
                  <option value="">{arabicSource("common.choose")}</option>
                  {contractTypes.filter(t => t.is_active).map(t => <option key={t.id} value={t.id}>{t.name_ar}</option>)}
                </select>
              </div>
              <div>
                <label className="text-foreground block mb-1" style={{ fontSize: 12 }}>{arabicSource("common.contract_number")}</label>
                <input value={formData.contract_number} onChange={e => setFormData(p => ({ ...p, contract_number: e.target.value }))} className={inputCls} dir="ltr" />
              </div>
              <div>
                <label className="text-foreground block mb-1" style={{ fontSize: 12 }}>{arabicSource("lifecycle.start_date")}</label>
                <input type="date" value={formData.start_date} onChange={e => setFormData(p => ({ ...p, start_date: e.target.value }))} className={inputCls} dir="ltr" />
              </div>
              <div>
                <label className="text-foreground block mb-1" style={{ fontSize: 12 }}>{arabicSource("common.end_date")}</label>
                <input type="date" value={formData.end_date} onChange={e => setFormData(p => ({ ...p, end_date: e.target.value }))} className={inputCls} dir="ltr" />
              </div>
              <div>
                <label className="text-foreground block mb-1" style={{ fontSize: 12 }}>{arabicSource("common.salary")}</label>
                <div className="flex gap-2">
                  <input type="number" value={formData.salary_amount || ""} onChange={e => setFormData(p => ({ ...p, salary_amount: Number(e.target.value) }))} className={`${inputCls} flex-1`} dir="ltr" />
                  <select value={formData.salary_currency} onChange={e => setFormData(p => ({ ...p, salary_currency: e.target.value }))} className="w-20 h-10 px-2 rounded-lg border border-border bg-input-background text-foreground text-xs outline-none">
                    <option value="IQD">IQD</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleCreate} disabled={saving} className="flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs hover:bg-primary/90 cursor-pointer disabled:opacity-50">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} {arabicSource("common.save")}
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-border text-muted-foreground rounded-lg text-xs hover:bg-muted/20 cursor-pointer">{arabicSource("common.cancel")}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contracts List */}
      <div className={cardCls}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/20 border-b border-border/20">
                {[arabicSource("common.employee"), arabicSource("lifecycle.contract_type"), arabicSource("common.contract_number"), arabicSource("common.start_date"), arabicSource("common.end_date"), arabicSource("common.probation_period"), arabicSource("common.status"), arabicSource("common.procedures")].map(h => (
                  <th key={h} className="text-start px-4 py-3 text-muted-foreground" style={{ fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((c, i) => {
                const emp = empMap[c.employee_id];
                const ct = contractTypes.find(t => t.id === c.contract_type_id);
                const probDaysLeft = c.probation_end_date ? Math.ceil((new Date(c.probation_end_date).getTime() - Date.now()) / 86400000) : null;
                return (
                  <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }}>{emp ? empDisplayName(emp) : "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }}>{ct?.name_ar || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{c.contract_number || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{c.start_date}</td>
                    <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{c.end_date || arabicSource("common.not_specified")}</td>
                    <td className="px-4 py-3">
                      {c.probation_status === "pending" && probDaysLeft !== null ? (
                        <span className={`text-xs ${probDaysLeft <= 14 ? "text-amber-400" : "text-muted-foreground"}`}>
                          {probDaysLeft > 0 ? `${probDaysLeft} ${arabicSource("common.days_left")}` : arabicSource("lifecycle.finished")}
                        </span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-md border ${statusColors[c.probation_status] || ""}`} style={{ fontSize: 11 }}>
                          {statusLabels[c.probation_status] || c.probation_status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md border ${statusColors[c.status] || ""}`} style={{ fontSize: 12 }}>
                        {statusLabels[c.status] || c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {c.probation_status === "pending" && (
                          <>
                            <button onClick={() => handleProbation(c.id, "passed")} className="p-1 rounded hover:bg-emerald-500/20 cursor-pointer" title={arabicSource("lifecycle.passed_the_test")}>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            </button>
                            <button onClick={() => handleProbation(c.id, "failed")} className="p-1 rounded hover:bg-destructive/20 cursor-pointer" title={arabicSource("lifecycle.did_not_pass")}>
                              <X className="w-3.5 h-3.5 text-destructive" />
                            </button>
                          </>
                        )}
                        {c.status === "active" && (
                          <button onClick={async () => {
                            try {
                              await odooData.updateContract(c.id, { status: "terminated" });
                              refetch();
                            } catch (e) {
                              console.error(e);
                              alert("خطأ في إنهاء العقد");
                            }
                          }} className="p-1 rounded hover:bg-destructive/20 cursor-pointer" title={arabicSource("common.end")}>
                            <UserX className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              }) : (
                <tr><td colSpan={8}><EmptyState icon={Briefcase} message={arabicSource("lifecycle.no_contracts")} /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════ Documents Tab ══════════════════════════

function DocumentsTab({
  documents, docTypes, empMap, employees, refetch,
  statusLabels, statusColors,
}: {
  documents: DbEmployeeDocument[];
  docTypes: DbDocumentType[];
  empMap: Record<string, any>;
  employees: any[];
  refetch: () => void;
  statusLabels: Record<string, string>;
  statusColors: Record<string, string>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: "", document_type_id: "", document_number: "",
    issue_date: "", expiry_date: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");

  // Auto-compute document statuses
  const enrichedDocs = useMemo(() => {
    const today = new Date().toISOString().substring(0, 10);
    return documents.map(d => {
      const dt = docTypes.find(t => t.id === d.document_type_id);
      let computedStatus = d.status;
      if (d.expiry_date && dt?.has_expiry) {
        const daysToExpiry = Math.ceil((new Date(d.expiry_date).getTime() - Date.now()) / 86400000);
        if (daysToExpiry < 0) computedStatus = "expired";
        else if (daysToExpiry <= (dt.expiry_warning_days || 30)) computedStatus = "expiring_soon";
        else computedStatus = "valid";
      }
      return { ...d, computedStatus };
    });
  }, [documents, docTypes]);

  const filtered = filter === "all" ? enrichedDocs
    : enrichedDocs.filter(d => d.computedStatus === filter);

  const handleCreate = async () => {
    if (!formData.employee_id || !formData.document_type_id) return;
    setSaving(true);
    try {
      await odooData.createDocument({
        employee_id: formData.employee_id,
        document_type_id: formData.document_type_id,
        name: formData.document_number || "Document",
        issue_date: formData.issue_date || false,
        expiry_date: formData.expiry_date || false,
      });
      refetch();
      setShowForm(false);
    } catch (e) {
      console.error(e);
      alert("خطأ في حفظ الوثيقة");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {[
          { key: "all", label: arabicSource("common.all") },
          { key: "valid", label: arabicSource("common.surrey") },
          { key: "expiring_soon", label: arabicSource("common.soon_to_be_completed") },
          { key: "expired", label: arabicSource("common.finished") },
          { key: "missing", label: arabicSource("common.is_missing") },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${filter === f.key ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
            style={{ fontSize: 13 }}>{f.label}</button>
        ))}
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-lg shadow-primary/20 hover:bg-gold-dark cursor-pointer ms-auto" style={{ fontSize: 13 }}>
          <Plus className="w-4 h-4" /> {arabicSource("common.add_document")}
        </button>
      </div>

      {/* New Doc Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className={`${cardCls} p-5`}>
            <h3 className="text-foreground mb-4">{arabicSource("common.add_document")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-foreground block mb-1" style={{ fontSize: 12 }}>{arabicSource("common.employee_3")}</label>
                <EmployeeSelect
                  employees={employees}
                  value={formData.employee_id}
                  onChange={(id) => setFormData((p) => ({ ...p, employee_id: id }))}
                />
              </div>
              <div>
                <label className="text-foreground block mb-1" style={{ fontSize: 12 }}>{arabicSource("lifecycle.document_type_2")}</label>
                <select value={formData.document_type_id} onChange={e => setFormData(p => ({ ...p, document_type_id: e.target.value }))} className={inputCls}>
                  <option value="">{arabicSource("common.choose")}</option>
                  {docTypes.filter(t => t.is_active).map(t => <option key={t.id} value={t.id}>{t.name_ar}</option>)}
                </select>
              </div>
              <div>
                <label className="text-foreground block mb-1" style={{ fontSize: 12 }}>{arabicSource("common.document_number")}</label>
                <input value={formData.document_number} onChange={e => setFormData(p => ({ ...p, document_number: e.target.value }))} className={inputCls} dir="ltr" />
              </div>
              <div>
                <label className="text-foreground block mb-1" style={{ fontSize: 12 }}>{arabicSource("common.release_date")}</label>
                <input type="date" value={formData.issue_date} onChange={e => setFormData(p => ({ ...p, issue_date: e.target.value }))} className={inputCls} dir="ltr" />
              </div>
              <div>
                <label className="text-foreground block mb-1" style={{ fontSize: 12 }}>{arabicSource("common.end_date")}</label>
                <input type="date" value={formData.expiry_date} onChange={e => setFormData(p => ({ ...p, expiry_date: e.target.value }))} className={inputCls} dir="ltr" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleCreate} disabled={saving} className="flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs cursor-pointer disabled:opacity-50">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} {arabicSource("common.save")}
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-border text-muted-foreground rounded-lg text-xs cursor-pointer">{arabicSource("common.cancel")}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Documents List */}
      <div className={cardCls}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/20 border-b border-border/20">
                {[arabicSource("common.employee"), arabicSource("lifecycle.document_type"), arabicSource("common.document_number"), arabicSource("common.release_date"), arabicSource("common.end_date"), arabicSource("common.status"), arabicSource("common.procedures")].map(h => (
                  <th key={h} className="text-start px-4 py-3 text-muted-foreground" style={{ fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((d, i) => {
                const emp = empMap[d.employee_id];
                const dt = docTypes.find(t => t.id === d.document_type_id);
                return (
                  <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }}>{emp ? empDisplayName(emp) : "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }}>{dt?.name_ar || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{d.document_number || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{d.issue_date || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{d.expiry_date || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md border ${statusColors[d.computedStatus] || ""}`} style={{ fontSize: 12 }}>
                        {statusLabels[d.computedStatus] || d.computedStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={async () => {
                        try {
                          await odooData.deleteDocument(d.id);
                          refetch();
                        } catch (e) {
                          console.error(e);
                          alert("خطأ في حذف الوثيقة");
                        }
                      }}
                        className="p-1 rounded hover:bg-destructive/20 cursor-pointer"><Trash2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    </td>
                  </motion.tr>
                );
              }) : (
                <tr><td colSpan={7}><EmptyState icon={FileText} message={arabicSource("lifecycle.no_documents")} /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════ Exit Process Tab ══════════════════════════

function ExitTab({
  processes, exitItems, empMap, employees, refetch,
  exitTypeLabels, statusLabels, statusColors, checklistCategoryLabels,
}: {
  processes: DbExitProcess[];
  exitItems: DbExitChecklistItem[];
  empMap: Record<string, any>;
  employees: any[];
  refetch: () => void;
  exitTypeLabels: Record<string, string>;
  statusLabels: Record<string, string>;
  statusColors: Record<string, string>;
  checklistCategoryLabels: Record<string, string>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    employee_id: "", exit_type: "resignation", exit_date: "",
    last_working_day: "", reason: "", notice_date: "",
  });
  const [saving, setSaving] = useState(false);

  // Fetch checklist for selected process
  const { checklist, refetch: refetchChecklist } = useExitChecklist(selectedProcess || undefined);

  const handleCreate = async () => {
    if (!formData.employee_id || !formData.exit_date) return;
    setSaving(true);

    // Calculate EOS
    const emp = empMap[formData.employee_id];
    let eosAmount = 0;
    if (emp?.join_date && emp?.monthly_salary) {
      eosAmount = calculateEOS(
        emp.join_date,
        emp.monthly_salary,
        emp.currency || "IQD",
        DEFAULT_EOS_CONFIG,
        formData.exit_date,
      )?.amount ?? 0;
    }

    try {
      // Backend auto-creates checklist lines from active checklist items.
      await odooData.createExitProcess({
        employee_id: formData.employee_id,
        exit_type: formData.exit_type,
        exit_date: formData.exit_date,
        last_working_day: formData.last_working_day || formData.exit_date,
        reason: formData.reason || null,
        notice_date: formData.notice_date || null,
        eos_amount: eosAmount,
        status: "in_progress",
      });
      refetch();
      setShowForm(false);
      setFormData({ employee_id: "", exit_type: "resignation", exit_date: "", last_working_day: "", reason: "", notice_date: "" });
    } catch (e) {
      console.error(e);
      alert("خطأ في إنشاء إجراء إنهاء الخدمة");
    }
    setSaving(false);
  };

  const handleChecklistToggle = async (checklistId: string, completed: boolean) => {
    try {
      await odooData.updateExitChecklistLine(checklistId, { is_completed: completed });
      refetchChecklist();
    } catch (e) {
      console.error(e);
      alert("خطأ في تحديث قائمة إخلاء الطرف");
    }
  };

  const handleStatusUpdate = async (processId: string, status: string) => {
    try {
      await odooData.updateExitProcess(processId, { status });
      if (status === "completed") {
        const proc = processes.find(p => p.id === processId);
        if (proc) {
          await odooData.setEmployeeStatus(proc.employee_id, "exited");
        }
      }
      refetch();
    } catch (e) {
      console.error(e);
      alert("خطأ في تحديث حالة إجراء الإنهاء");
    }
  };

  // Detail view
  if (selectedProcess) {
    const proc = processes.find(p => p.id === selectedProcess);
    if (!proc) { setSelectedProcess(null); return null; }
    const emp = empMap[proc.employee_id];

    const categoryLabels = checklistCategoryLabels;

    const completedCount = checklist.filter(c => c.is_completed).length;
    const totalCount = checklist.length;
    const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedProcess(null)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer">
          <ChevronRight className="w-4 h-4" /> {arabicSource("lifecycle.return")}
        </button>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <LogOut className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-foreground">{emp ? empDisplayName(emp) : "—"}</h2>
            <p className="text-muted-foreground" style={{ fontSize: 13 }}>
              {exitTypeLabels[proc.exit_type] || proc.exit_type} — {proc.exit_date}
            </p>
          </div>
          <div className="ms-auto flex items-center gap-2">
            <span className={`px-3 py-1 rounded-md border ${statusColors[proc.status] || ""}`} style={{ fontSize: 12 }}>
              {statusLabels[proc.status] || proc.status}
            </span>
          </div>
        </div>

        {/* Process Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`${cardCls} p-4`}>
            <p className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("lifecycle.end_of_service_benefits")}</p>
            <p className="text-gradient-gold mt-1" style={{ fontSize: 22 }} dir="ltr">
              {proc.eos_amount ? `${formatNumber(Number(proc.eos_amount))} ${proc.eos_currency}` : "—"}
            </p>
          </div>
          <div className={`${cardCls} p-4`}>
            <p className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("common.last_working_day")}</p>
            <p className="text-foreground mt-1" style={{ fontSize: 16 }} dir="ltr">{proc.last_working_day || proc.exit_date}</p>
          </div>
          <div className={`${cardCls} p-4`}>
            <p className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("common.disclaimer")}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-foreground" style={{ fontSize: 16 }}>{completedCount}/{totalCount}</span>
              <div className="flex-1 h-2 rounded-full bg-muted/30">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-muted-foreground" style={{ fontSize: 12 }}>{pct}%</span>
            </div>
          </div>
        </div>

        {/* Status Actions */}
        {proc.status !== "completed" && proc.status !== "cancelled" && (
          <div className="flex gap-2">
            {proc.status === "initiated" && (
              <button onClick={() => handleStatusUpdate(proc.id, "in_progress")} className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg text-xs cursor-pointer hover:bg-amber-500/30">{arabicSource("common.initiate_procedures")}</button>
            )}
            {proc.status === "in_progress" && (
              <button onClick={() => handleStatusUpdate(proc.id, "clearance")} className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-xs cursor-pointer hover:bg-blue-500/30">{arabicSource("common.disclaimer")}</button>
            )}
            {proc.status === "clearance" && (
              <button onClick={() => handleStatusUpdate(proc.id, "settlement")} className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-xs cursor-pointer hover:bg-purple-500/30">{arabicSource("lifecycle.financial_settlement")}</button>
            )}
            {proc.status === "settlement" && (
              <button onClick={() => handleStatusUpdate(proc.id, "completed")} className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs cursor-pointer hover:bg-emerald-500/30">{arabicSource("lifecycle.complete")}</button>
            )}
            <button onClick={() => handleStatusUpdate(proc.id, "cancelled")} className="px-4 py-2 bg-destructive/10 text-destructive rounded-lg text-xs cursor-pointer hover:bg-destructive/20">{arabicSource("common.cancel")}</button>
          </div>
        )}

        {/* Checklist */}
        <div className={`${cardCls} p-5`}>
          <h3 className="text-foreground mb-4 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            {arabicSource("lifecycle.disclaimer_list")}
          </h3>
          {Object.entries(categoryLabels).map(([cat, catLabel]) => {
            const catItems = checklist.filter(c => {
              const item = exitItems.find(i => i.id === c.checklist_item_id);
              return item?.category === cat;
            });
            if (catItems.length === 0) return null;
            return (
              <div key={cat} className="mb-4">
                <p className="text-muted-foreground mb-2" style={{ fontSize: 12 }}>{catLabel}:</p>
                <div className="space-y-1">
                  {catItems.map(c => {
                    const item = exitItems.find(i => i.id === c.checklist_item_id);
                    return (
                      <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/10 transition-colors">
                        <button
                          onClick={() => handleChecklistToggle(c.id, !c.is_completed)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${
                            c.is_completed ? "bg-emerald-500 border-emerald-500" : "border-muted-foreground/40"
                          }`}
                        >
                          {c.is_completed && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <span className={`flex-1 ${c.is_completed ? "text-muted-foreground line-through" : "text-foreground"}`} style={{ fontSize: 13 }}>
                          {item?.name_ar || "—"}
                        </span>
                        {c.completed_at && (
                          <span className="text-muted-foreground" style={{ fontSize: 10 }}>
                            {formatDate(c.completed_at)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg shadow-lg shadow-primary/20 hover:bg-gold-dark cursor-pointer" style={{ fontSize: 13 }}>
          <Plus className="w-4 h-4" /> {arabicSource("common.termination_of_service")}
        </button>
      </div>

      {/* New Exit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className={`${cardCls} p-5`}>
            <h3 className="text-foreground mb-4">{arabicSource("lifecycle.termination_of_an_employee")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-foreground block mb-1" style={{ fontSize: 12 }}>{arabicSource("common.employee_3")}</label>
                <EmployeeSelect
                  employees={employees}
                  value={formData.employee_id}
                  onChange={(id) => setFormData((p) => ({ ...p, employee_id: id }))}
                  filter={(e) => e.status !== arabicSource("common.finished")}
                />
              </div>
              <div>
                <label className="text-foreground block mb-1" style={{ fontSize: 12 }}>{arabicSource("lifecycle.termination_type_2")}</label>
                <select value={formData.exit_type} onChange={e => setFormData(p => ({ ...p, exit_type: e.target.value }))} className={inputCls}>
                  {Object.entries(exitTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-foreground block mb-1" style={{ fontSize: 12 }}>{arabicSource("lifecycle.termination_date_2")}</label>
                <input type="date" value={formData.exit_date} onChange={e => setFormData(p => ({ ...p, exit_date: e.target.value }))} className={inputCls} dir="ltr" />
              </div>
              <div>
                <label className="text-foreground block mb-1" style={{ fontSize: 12 }}>{arabicSource("common.last_working_day")}</label>
                <input type="date" value={formData.last_working_day} onChange={e => setFormData(p => ({ ...p, last_working_day: e.target.value }))} className={inputCls} dir="ltr" />
              </div>
              <div>
                <label className="text-foreground block mb-1" style={{ fontSize: 12 }}>{arabicSource("lifecycle.notice_date")}</label>
                <input type="date" value={formData.notice_date} onChange={e => setFormData(p => ({ ...p, notice_date: e.target.value }))} className={inputCls} dir="ltr" />
              </div>
              <div>
                <label className="text-foreground block mb-1" style={{ fontSize: 12 }}>{arabicSource("common.the_reason")}</label>
                <input value={formData.reason} onChange={e => setFormData(p => ({ ...p, reason: e.target.value }))} className={inputCls} placeholder={arabicSource("lifecycle.reason_for_termination")} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleCreate} disabled={saving} className="flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs cursor-pointer disabled:opacity-50">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} {arabicSource("common.initiate_procedures")}
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-border text-muted-foreground rounded-lg text-xs cursor-pointer">{arabicSource("common.cancel")}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit Processes List */}
      <div className={cardCls}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/20 border-b border-border/20">
                {[arabicSource("common.employee"), arabicSource("lifecycle.termination_type"), arabicSource("lifecycle.termination_date"), arabicSource("lifecycle.n_kh_receivables"), arabicSource("common.status"), arabicSource("common.width")].map(h => (
                  <th key={h} className="text-start px-4 py-3 text-muted-foreground" style={{ fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {processes.length > 0 ? processes.map((p, i) => {
                const emp = empMap[p.employee_id];
                return (
                  <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }}>{emp ? empDisplayName(emp) : "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }}>{exitTypeLabels[p.exit_type] || p.exit_type}</td>
                    <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{p.exit_date}</td>
                    <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }} dir="ltr">
                      {p.eos_amount ? `${formatNumber(Number(p.eos_amount))} ${p.eos_currency}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md border ${statusColors[p.status] || ""}`} style={{ fontSize: 12 }}>
                        {statusLabels[p.status] || p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelectedProcess(p.id)} className="p-1.5 rounded hover:bg-primary/10 text-primary cursor-pointer">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                );
              }) : (
                <tr><td colSpan={6}><EmptyState icon={UserX} message={arabicSource("lifecycle.no_termination_procedures")} /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
