import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText, Plus, Loader2, Save, Trash2,
} from "lucide-react";
import * as odooData from "@/shared/api/odooData";
import { EmptyState, TableHeaderRow } from "@/shared/components";
import { EmployeeSelect } from "@/features/employees";
import {
  empDisplayName,
  type DbDocumentType, type DbEmployeeDocument,
} from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { lifecycleCardClass as cardCls, lifecycleInputClass as inputCls } from "../styles/lifecycle";
import FormFieldLabel from "./FormFieldLabel";

const DocumentsTab = ({
  documents, docTypes, empMap, employees, employeeLabels, refetch,
  statusLabels, statusColors,
}: {
  documents: DbEmployeeDocument[];
  docTypes: DbDocumentType[];
  empMap: Record<string, any>;
  employees: any[];
  employeeLabels: Record<string, string>;
  refetch: () => void;
  statusLabels: Record<string, string>;
  statusColors: Record<string, string>;
}) => {
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
    return documents.map((d: DbEmployeeDocument) => {
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
                <FormFieldLabel>{arabicSource("common.employee_3")}</FormFieldLabel>
                <EmployeeSelect
                  employees={employees}
                  labels={employeeLabels}
                  value={formData.employee_id}
                  onChange={(id) => setFormData((p) => ({ ...p, employee_id: String(id) }))}
                />
              </div>
              <div>
                <FormFieldLabel>{arabicSource("lifecycle.document_type_2")}</FormFieldLabel>
                <select value={formData.document_type_id} onChange={e => setFormData(p => ({ ...p, document_type_id: e.target.value }))} className={inputCls}>
                  <option value="">{arabicSource("common.choose")}</option>
                  {docTypes.filter(t => t.is_active).map(t => <option key={t.id} value={t.id}>{t.name_ar}</option>)}
                </select>
              </div>
              <div>
                <FormFieldLabel>{arabicSource("common.document_number")}</FormFieldLabel>
                <input value={formData.document_number} onChange={e => setFormData(p => ({ ...p, document_number: e.target.value }))} className={inputCls} dir="ltr" />
              </div>
              <div>
                <FormFieldLabel>{arabicSource("common.release_date")}</FormFieldLabel>
                <input type="date" value={formData.issue_date} onChange={e => setFormData(p => ({ ...p, issue_date: e.target.value }))} className={inputCls} dir="ltr" />
              </div>
              <div>
                <FormFieldLabel>{arabicSource("common.end_date")}</FormFieldLabel>
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
              <TableHeaderRow headings={[arabicSource("common.employee"), arabicSource("lifecycle.document_type"), arabicSource("common.document_number"), arabicSource("common.release_date"), arabicSource("common.end_date"), arabicSource("common.status"), arabicSource("common.procedures")]} />
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((d: DbEmployeeDocument & { computedStatus: string }, i: number) => {
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
};

export default DocumentsTab;

// ══════════════════════════ Exit Process Tab ══════════════════════════

