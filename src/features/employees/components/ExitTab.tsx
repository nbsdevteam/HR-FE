import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText, Plus, Check, X, Clock, Loader2, Search, Eye,
  ChevronRight, AlertCircle, Briefcase, Shield, UserX, Save,
  Trash2, Calendar, FileCheck, CheckCircle,
  ClipboardList, LogOut, DollarSign, RefreshCw,
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

export const ExitTab = function ExitTab({
  processes, exitItems, empMap, employees, employeeLabels, refetch,
  exitTypeLabels, statusLabels, statusColors, checklistCategoryLabels,
}: {
  processes: DbExitProcess[];
  exitItems: DbExitChecklistItem[];
  empMap: Record<string, any>;
  employees: any[];
  employeeLabels: Record<string, string>;
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
          // Return open custodies so exit clears outstanding assets.
          try {
            const open = await odooData.fetchCustodies(proc.employee_id);
            const today = new Date().toISOString().slice(0, 10);
            await Promise.all(
              (open || [])
                .filter((c: any) => !c.return_date && c.status !== "returned")
                .map((c: any) =>
                  odooData.updateCustody(c.id, {
                    status: "returned",
                    return_date: today,
                  }),
                ),
            );
          } catch (custodyErr) {
            console.error(custodyErr);
          }
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
                  labels={employeeLabels}
                  value={formData.employee_id}
                  onChange={(id) => setFormData((p) => ({ ...p, employee_id: String(id) }))}
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
