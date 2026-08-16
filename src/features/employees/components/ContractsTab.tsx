import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText, Plus, Check, X, Clock, Loader2, Search, Eye,
  ChevronRight, AlertCircle, Briefcase, Shield, UserX, Save,
  Trash2, Calendar, FileCheck, CheckCircle,
  ClipboardList, DollarSign, RefreshCw,
} from "lucide-react";
import * as odooData from "@/shared/api/odooData";
import { EmptyState } from "@/shared/components/EmptyState";
import { EmployeeSelect } from "@/features/employees";
import {
  empDisplayName, useExitChecklist,
  type DbContractType, type DbEmployeeContract, type DbDocumentType,
  type DbEmployeeDocument, type DbExitProcess, type DbExitChecklistItem,
} from "@/shared/hooks";
import { calculateEOS, DEFAULT_EOS_CONFIG } from "@/features/payroll";
import { formatDate, formatNumber } from "@/i18n/format";
import { arabicSource } from "@/i18n/source";
import { lifecycleCardClass as cardCls, lifecycleInputClass as inputCls } from "../styles/lifecycle";

export const ContractsTab = function ContractsTab({
  contracts, contractTypes, empMap, employees, employeeLabels, refetch, search, onSearchChange,
  statusLabels, statusColors,
}: {
  contracts: DbEmployeeContract[];
  contractTypes: DbContractType[];
  empMap: Record<string, any>;
  employees: any[];
  employeeLabels: Record<string, string>;
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
    // Calendar-day arithmetic (avoid UTC shift from toISOString).
    const probEnd = (() => {
      if (!ct || !(ct.probation_days > 0) || !formData.start_date) return null;
      const [y, m, d] = formData.start_date.split("-").map(Number);
      const end = new Date(y, m - 1, d + Number(ct.probation_days));
      return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
    })();

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
                  labels={employeeLabels}
                  value={formData.employee_id}
                  onChange={(id) => setFormData((p) => ({ ...p, employee_id: String(id) }))}
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

