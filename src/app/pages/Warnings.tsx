import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Plus, X, Eye, FileWarning, ShieldAlert, Clock, Search, Filter, Trash2, CheckCircle, XCircle } from "lucide-react";
import { ViewToggle } from "../components/ViewToggle";
import { useWarnings, useEmployees, useConfigurations, empDisplayName, DbWarning, DbEmployee } from "../lib/hooks";
import { supabase } from "../lib/supabase";
import { EmptyState } from "../components/EmptyState";

// Color gradients for warning types — auto-assigned by severity index (lightest → most severe)
const typeColorPalette = [
  "bg-blue-500/10 border-blue-500/20 text-blue-400",
  "bg-primary/10 border-primary/20 text-primary",
  "bg-red-400/10 border-red-400/20 text-red-400",
  "bg-red-600/10 border-red-600/20 text-red-500",
  "bg-destructive/10 border-destructive/20 text-destructive",
];

// Status color palette (first = active/destructive, second = expired/muted, third+ = canceled/green)
const statusColorPalette = [
  "bg-destructive/10 border-destructive/20 text-destructive",
  "bg-muted/30 border-border text-muted-foreground",
  "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
];

interface FormData {
  employeeId: string;
  type: string;
  reason: string;
  details: string;
  expiryDate: string;
}

interface WarningWithEmployee extends DbWarning {
  employeeName?: string;
  employeeDepartment?: string;
}

export function Warnings() {
  const { warnings, loading, refetch } = useWarnings();
  const { employees } = useEmployees();
  const { getValue } = useConfigurations();

  // Warning types and statuses from configurations table (NOT hard-coded)
  const warningTypes = (getValue('warnings.types', 'شفهي,كتابي أول,كتابي ثاني,كتابي نهائي,فصل')).split(',').map(s => s.trim());
  const warningStatuses = (getValue('warnings.statuses', 'نشط,منتهي,ملغي')).split(',').map(s => s.trim());

  // Auto-build color and severity maps from the ordered type list
  const typeColors: Record<string, string> = {};
  const typeSeverity: Record<string, number> = {};
  warningTypes.forEach((t, i) => {
    typeColors[t] = typeColorPalette[Math.min(i, typeColorPalette.length - 1)];
    typeSeverity[t] = i + 1;
  });
  const statusColors: Record<string, string> = {};
  warningStatuses.forEach((s, i) => {
    statusColors[s] = statusColorPalette[Math.min(i, statusColorPalette.length - 1)];
  });

  const [showForm, setShowForm] = useState(false);
  const [selectedWarning, setSelectedWarning] = useState<WarningWithEmployee | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [formData, setFormData] = useState<FormData>({
    employeeId: "",
    type: "",
    reason: "",
    details: "",
    expiryDate: "",
  });
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [employeeSearch, setEmployeeSearch] = useState("");

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Enrich warnings with employee data
  const enrichedWarnings: WarningWithEmployee[] = warnings.map(w => {
    const emp = employees.find(e => e.id === w.employee_id);
    return {
      ...w,
      employeeName: emp ? empDisplayName(emp) : w.employee_id,
      employeeDepartment: emp?.department || "—",
    };
  });

  // Filter and search
  const filteredWarnings = enrichedWarnings.filter(w => {
    const matchesSearch = searchQuery === "" ||
      (w.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       w.reason?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === "" || w.type === filterType;
    const matchesStatus = filterStatus === "" || w.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const kanbanStatusCols: { key: string; label: string; accent: string; dotColor: string }[] = [
    { key: "نشط", label: "نشط", accent: "border-destructive/40", dotColor: "bg-destructive" },
    { key: "منتهي", label: "منتهي", accent: "border-muted-foreground/40", dotColor: "bg-muted-foreground" },
    { key: "ملغي", label: "ملغي", accent: "border-emerald-500/40", dotColor: "bg-emerald-500" },
  ];

  // Stats calculations
  const stats = {
    total: filteredWarnings.length,
    active: filteredWarnings.filter(w => w.status === "نشط").length,
    expired: filteredWarnings.filter(w => w.status === "منتهي").length,
    cancelled: filteredWarnings.filter(w => w.status === "ملغي").length,
    byType: warningTypes.map(t => ({
      type: t,
      count: filteredWarnings.filter(w => w.type === t && w.status === "نشط").length,
    })),
  };

  // Escalation indicator: count active warnings per employee
  const warningsByEmployee = enrichedWarnings
    .filter(w => w.status === "نشط")
    .reduce((acc: Record<string, number>, w) => {
      acc[w.employee_id] = (acc[w.employee_id] || 0) + 1;
      return acc;
    }, {});

  const handleCreateWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.type || !formData.reason) {
      setToast("الرجاء ملء جميع الحقول المطلوبة");
      return;
    }

    setSaving(true);
    try {
      const currentUser = await supabase.auth.getUser();
      const issuedById = currentUser?.data?.user?.id || "system";

      if (editingId) {
        // Update existing warning
        const { error } = await supabase
          .from("warnings")
          .update({
            employee_id: formData.employeeId,
            type: formData.type,
            reason: formData.reason,
            details: formData.details || null,
            expiry_date: formData.expiryDate || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingId);

        if (error) throw error;
        setToast("تم تحديث الإنذار بنجاح");
      } else {
        // Create new warning
        const { error } = await supabase
          .from("warnings")
          .insert({
            employee_id: formData.employeeId,
            type: formData.type,
            reason: formData.reason,
            details: formData.details || null,
            date: new Date().toISOString().split("T")[0],
            issued_by: issuedById,
            status: "نشط",
            expiry_date: formData.expiryDate || null,
          });

        if (error) throw error;
        setToast("تم إصدار الإنذار بنجاح");
      }

      resetForm();
      setShowForm(false);
      refetch();
    } catch (err) {
      setToast(`خطأ: ${err instanceof Error ? err.message : "فشل العملية"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (warningId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("warnings")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", warningId);

      if (error) throw error;
      setToast(`تم تغيير الحالة إلى "${newStatus}"`);
      refetch();
    } catch (err) {
      setToast(`خطأ: ${err instanceof Error ? err.message : "فشل التحديث"}`);
    }
  };

  const handleDelete = async (warningId: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الإنذار؟")) return;

    try {
      const { error } = await supabase
        .from("warnings")
        .delete()
        .eq("id", warningId);

      if (error) throw error;
      setToast("تم حذف الإنذار بنجاح");
      refetch();
    } catch (err) {
      setToast(`خطأ: ${err instanceof Error ? err.message : "فشل الحذف"}`);
    }
  };

  const handleEditWarning = (warning: WarningWithEmployee) => {
    setEditingId(warning.id);
    setFormData({
      employeeId: warning.employee_id,
      type: warning.type,
      reason: warning.reason,
      details: warning.details || "",
      expiryDate: warning.expiry_date || "",
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      employeeId: "",
      type: "",
      reason: "",
      details: "",
      expiryDate: "",
    });
    setEditingId(null);
    setEmployeeSearch("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gradient-gold">الإنذارات</h1>
          <p className="text-muted-foreground mt-1">إدارة ومتابعة الإنذارات الإدارية</p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle view={viewMode} onChange={setViewMode} />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg shadow-lg shadow-primary/20 hover:bg-gold-dark transition-colors cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            إصدار إنذار
          </motion.button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Total */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)" }}
          className="relative bg-card backdrop-blur-sm border border-border rounded-xl p-4 shadow-lg text-center overflow-hidden hover:border-primary/30 transition-colors"
        >
          <div className="absolute top-0 end-0 w-28 h-28 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
          <div className="flex justify-center mb-2 relative z-10">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <FileWarning className="w-5 h-5" />
            </div>
          </div>
          <p className="text-muted-foreground relative z-10" style={{ fontSize: 12 }}>الإجمالي</p>
          <span className="text-gradient-gold block mt-1 relative z-10" style={{ fontSize: 24 }}>{stats.total}</span>
        </motion.div>

        {/* By Type Stats */}
        {stats.byType.map((item, i) => (
          <motion.div
            key={item.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (i + 1) * 0.1 }}
            whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)" }}
            className="relative bg-card backdrop-blur-sm border border-border rounded-xl p-4 shadow-lg text-center overflow-hidden hover:border-primary/30 transition-colors"
          >
            <div className="absolute top-0 end-0 w-28 h-28 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
            <div className="flex justify-center mb-2 relative z-10">
              <div className={`p-2 rounded-lg ${typeColors[item.type]}`}>
                {i < 3 ? <AlertTriangle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
              </div>
            </div>
            <p className="text-muted-foreground relative z-10" style={{ fontSize: 12 }}>{item.type}</p>
            <span className="text-gradient-gold block mt-1 relative z-10" style={{ fontSize: 24 }}>{item.count}</span>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl p-4 shadow-lg"
      >
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute end-3 top-3 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="ابحث عن موظف أو سبب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 px-4 pe-10 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-11 px-4 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none"
          >
            <option value="">جميع الأنواع</option>
            {warningTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-11 px-4 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none"
          >
            <option value="">جميع الحالات</option>
            {warningStatuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Warning Escalation Path */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl p-6 shadow-lg"
      >
        <h3 className="text-foreground mb-4">مسار تصعيد الإنذارات</h3>
        <div className="flex items-center justify-between">
          {warningTypes.map((type, i) => (
            <div key={type} className="flex items-center gap-2">
              <div className={`flex flex-col items-center`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  i < 2 ? "border-blue-400 bg-blue-400/10" :
                  i < 4 ? "border-red-400 bg-red-400/10" :
                  "border-destructive bg-destructive/10"
                }`}>
                  <span className="text-foreground" style={{ fontSize: 13 }}>{i + 1}</span>
                </div>
                <p className="text-muted-foreground mt-2 text-center" style={{ fontSize: 11 }}>{type}</p>
              </div>
              {i < warningTypes.length - 1 && (
                <div className="w-12 h-0.5 bg-border mb-6" />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center h-[300px] text-muted-foreground"
        >
          <div className="text-center">
            <div className="animate-spin mb-4">
              <Clock className="w-8 h-8 mx-auto" />
            </div>
            جاري تحميل الإنذارات...
          </div>
        </motion.div>
      )}

      {/* Warnings Table / Kanban */}
      {!loading && (
        <AnimatePresence mode="wait">
          {viewMode === "list" ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, delay: 0.7 }}
              className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl overflow-hidden shadow-lg"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/20 border-b border-border/20">
                      {["الموظف", "القسم", "نوع الإنذار", "السبب", "التاريخ", "صادر من", "الحالة", "إجراءات"].map(h => (
                        <th key={h} className="text-start px-4 py-3 text-muted-foreground" style={{ fontSize: 12 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWarnings.length > 0 ? (
                      filteredWarnings.map((warning, i) => (
                        <motion.tr
                          key={warning.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="border-b border-border/20 hover:bg-muted/10 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: typeSeverity[warning.type] >= 3 ? "#DC2626" : typeSeverity[warning.type] >= 2 ? "#D4AF37" : "#3B82F6" }} />
                              <div>
                                <span className="text-foreground">{warning.employeeName}</span>
                                {warningsByEmployee[warning.employee_id] > 1 && (
                                  <span className="ml-2 px-2 py-0.5 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded">
                                    {warningsByEmployee[warning.employee_id]} إنذارات
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }}>{warning.employeeDepartment}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-md border ${typeColors[warning.type]}`} style={{ fontSize: 12 }}>
                              {warning.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }}>{warning.reason}</td>
                          <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{warning.date}</td>
                          <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }}>{warning.issued_by || "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-md border ${statusColors[warning.status]}`} style={{ fontSize: 12 }}>
                              {warning.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedWarning(warning)}
                                className="p-1.5 rounded hover:bg-secondary transition-colors cursor-pointer"
                                title="عرض التفاصيل"
                              >
                                <Eye className="w-4 h-4 text-muted-foreground" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8}><EmptyState icon={ShieldAlert} message="لا توجد إنذارات" /></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            /* Kanban View - grouped by status */
            <motion.div
              key="kanban"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {kanbanStatusCols.map((col, ci) => {
                const items = filteredWarnings.filter(w => w.status === col.key);
                return (
                  <motion.div
                    key={col.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: ci * 0.1 }}
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
                      {items.length > 0 ? items.map((w, i) => (
                        <motion.div
                          key={w.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          whileHover={{ y: -2 }}
                          className="bg-card/60 border border-border/30 rounded-lg p-3 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: typeSeverity[w.type] >= 3 ? "#DC2626" : typeSeverity[w.type] >= 2 ? "#D4AF37" : "#3B82F6" }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-foreground truncate" style={{ fontSize: 13 }}>{w.employeeName}</p>
                              <p className="text-muted-foreground truncate" style={{ fontSize: 11 }}>{w.employeeDepartment}</p>
                            </div>
                          </div>
                          <div className="space-y-1.5 mb-3">
                            <span className={`inline-block px-2 py-0.5 rounded-md border ${typeColors[w.type]}`} style={{ fontSize: 11 }}>
                              {w.type}
                            </span>
                            <p className="text-muted-foreground" style={{ fontSize: 11 }}>{w.reason}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground" style={{ fontSize: 10 }}>{w.issued_by || "—"}</span>
                              <span className="text-muted-foreground" style={{ fontSize: 10 }} dir="ltr">{w.date}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2 border-t border-border/20">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setSelectedWarning(w)}
                              className="flex-1 py-1 text-xs rounded hover:bg-primary/20 transition-colors cursor-pointer text-primary"
                            >
                              التفاصيل
                            </motion.button>
                          </div>
                        </motion.div>
                      )) : (
                        <EmptyState icon={ShieldAlert} message="لا توجد إنذارات" className="py-8" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedWarning(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-foreground">تفاصيل الإنذار</h2>
                <button onClick={() => setSelectedWarning(null)} className="p-1 rounded hover:bg-secondary cursor-pointer">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/20">
                  <span className="text-muted-foreground" style={{ fontSize: 13 }}>الموظف: </span>
                  <span className="text-foreground">{selectedWarning.employeeName}</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/20">
                  <span className="text-muted-foreground" style={{ fontSize: 13 }}>القسم: </span>
                  <span className="text-foreground">{selectedWarning.employeeDepartment}</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/20">
                  <span className="text-muted-foreground" style={{ fontSize: 13 }}>نوع الإنذار: </span>
                  <span className={`px-2 py-0.5 rounded-md border ${typeColors[selectedWarning.type]}`} style={{ fontSize: 12 }}>
                    {selectedWarning.type}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-muted/20">
                  <span className="text-muted-foreground" style={{ fontSize: 13 }}>السبب: </span>
                  <span className="text-foreground">{selectedWarning.reason}</span>
                </div>
                {selectedWarning.details && (
                  <div className="p-3 rounded-lg bg-muted/20">
                    <span className="text-muted-foreground" style={{ fontSize: 13 }}>التفاصيل: </span>
                    <p className="text-foreground mt-1">{selectedWarning.details}</p>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-muted/20">
                  <span className="text-muted-foreground" style={{ fontSize: 13 }}>التاريخ: </span>
                  <span className="text-foreground" dir="ltr">{selectedWarning.date}</span>
                </div>
                {selectedWarning.expiry_date && (
                  <div className="p-3 rounded-lg bg-muted/20">
                    <span className="text-muted-foreground" style={{ fontSize: 13 }}>تاريخ الانتهاء: </span>
                    <span className="text-foreground" dir="ltr">{selectedWarning.expiry_date}</span>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-muted/20">
                  <span className="text-muted-foreground" style={{ fontSize: 13 }}>صادر من: </span>
                  <span className="text-foreground">{selectedWarning.issued_by || "—"}</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/20">
                  <span className="text-muted-foreground" style={{ fontSize: 13 }}>الحالة: </span>
                  <span className={`px-2 py-0.5 rounded-md border ${statusColors[selectedWarning.status]}`} style={{ fontSize: 12 }}>
                    {selectedWarning.status}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-6 pt-6 border-t border-border/20">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { handleEditWarning(selectedWarning); setSelectedWarning(null); }}
                  className="flex-1 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors cursor-pointer"
                >
                  تعديل
                </motion.button>
                {selectedWarning.status !== "نشط" && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { handleStatusChange(selectedWarning.id, "نشط"); setSelectedWarning(null); }}
                    className="flex-1 py-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    تفعيل
                  </motion.button>
                )}
                {selectedWarning.status !== "منتهي" && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { handleStatusChange(selectedWarning.id, "منتهي"); setSelectedWarning(null); }}
                    className="flex-1 py-2 rounded-lg bg-muted/30 text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    إنهاء
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { handleDelete(selectedWarning.id); setSelectedWarning(null); }}
                  className="flex-1 py-2 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/30 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Warning Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setShowForm(false); resetForm(); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-foreground">{editingId ? "تعديل الإنذار" : "إصدار إنذار جديد"}</h2>
                <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1 rounded hover:bg-secondary cursor-pointer">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <form onSubmit={handleCreateWarning} className="space-y-4">
                <div>
                  <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>الموظف</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="ابحث عن الموظف..."
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      className="w-full h-11 px-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
                    />
                    {employeeSearch && (
                      <div className="border border-border rounded-lg bg-input-background max-h-48 overflow-y-auto">
                        {employees
                          .filter(e => empDisplayName(e).includes(employeeSearch))
                          .map(emp => (
                            <button
                              key={emp.id}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, employeeId: emp.id }));
                                setEmployeeSearch("");
                              }}
                              className="w-full text-right px-4 py-2 hover:bg-muted/20 transition-colors border-b border-border/20 last:border-b-0 cursor-pointer"
                            >
                              <div className="text-foreground">{empDisplayName(emp)}</div>
                              <div className="text-xs text-muted-foreground">{emp.department}</div>
                            </button>
                          ))}
                      </div>
                    )}
                    {formData.employeeId && (
                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm">
                        ✓ {employees.find(e => e.id === formData.employeeId)?.arabic_name || "موظف مختار"}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>نوع الإنذار</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full h-11 px-4 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none"
                  >
                    <option value="">اختر نوع الإنذار</option>
                    {warningTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>السبب</label>
                  <input
                    type="text"
                    placeholder="سبب الإنذار"
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full h-11 px-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
                  />
                </div>

                <div>
                  <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>التفاصيل</label>
                  <textarea
                    rows={3}
                    placeholder="تفاصيل الإنذار..."
                    value={formData.details}
                    onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>تاريخ الانتهاء (اختياري)</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="w-full h-11 px-4 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <motion.button
                    type="submit"
                    disabled={saving}
                    whileHover={{ scale: !saving ? 1.05 : 1 }}
                    whileTap={{ scale: !saving ? 0.95 : 1 }}
                    className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground hover:bg-gold-dark transition-colors shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "جاري الحفظ..." : (editingId ? "تحديث الإنذار" : "إصدار الإنذار")}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => { setShowForm(false); resetForm(); }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 h-11 rounded-lg border-2 border-border text-foreground hover:bg-secondary transition-colors cursor-pointer"
                  >
                    إلغاء
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 end-6 bg-card border border-border rounded-lg p-4 shadow-lg max-w-xs z-50"
          >
            <p className="text-foreground text-sm">{toast}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
