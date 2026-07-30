import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, Plus, Filter, Edit, Trash2, Eye, X, Calendar, Loader2,
  Fingerprint, CheckCircle2, AlertCircle, Upload, Users
} from "lucide-react";
import { ViewToggle } from "../components/ViewToggle";
import { SortableHeaderRow, toggleSort } from "../components/SortableHeader";
import { EmployeeDetailPanel } from "../components/EmployeeDetailPanel";
import type { Employee, EmployeeOption } from "../components/EmployeeDetailPanel";
import { useEmployees, empNumber, empDisplayName } from "../lib/hooks";
import { supabase } from "../lib/supabase";
import { DEPT_BORDER_COLORS, DEPT_DOT_COLORS, SYNC_API } from "../lib/constants";
import type { DbEmployee } from "../lib/hooks";
import { employeeStatusKeys, translateBackendCode } from "../i18n/status";
import { localizedAlert } from "../i18n/native";

const deptColors = DEPT_BORDER_COLORS;
const deptDots = DEPT_DOT_COLORS;
const accentColors = ["#F0C419", "#22C55E", "#3B82F6", "#8B5CF6", "#06B6D4", "#EC4899", "#F97316", "#E74C3C"];
import { formatCurrency } from "../lib/payslip-engine";
import { arabicSource } from "../i18n/source";
const statusColors: Record<string, string> = {
  [arabicSource("common.is_active")]: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  [arabicSource("common.leave")]: "bg-primary/10 border-primary/20 text-primary",
  [arabicSource("common.finished")]: "bg-destructive/10 border-destructive/20 text-destructive",
  [arabicSource("common.pending")]: "bg-amber-500/10 border-amber-500/20 text-amber-400",
};

/** Convert a DB employee to the UI Employee type */
function toEmployee(e: DbEmployee, allDb: DbEmployee[]): Employee {
  const name = empDisplayName(e);
  const joinDate = e.join_date || (e.created_at ? e.created_at.substring(0, 10) : "");
  const statusMap: Record<string, string> = {
    [arabicSource("common.is_active")]: arabicSource("common.is_active"),
    [arabicSource("common.leave")]: arabicSource("common.leave"),
    [arabicSource("common.finished")]: arabicSource("common.finished"),
    [arabicSource("common.pending")]: arabicSource("common.pending"),
  } as const;
  const manager = e.manager_id ? allDb.find(m => m.id === e.manager_id) : null;
  return {
    id: e.person_id,
    dbId: e.id,
    employeeNumber: empNumber(e.person_id),
    name,
    position: e.position || e.department || "—",
    department: e.department || arabicSource("common.not_specified"),
    email: e.email || `${e.name?.replace(/\s+/g, ".").toLowerCase() || "emp"}@company.iq`,
    personalPhone: e.personal_phone || "—",
    companyPhone: e.company_phone || "—",
    phone: e.personal_phone || "—",
    joinDate: joinDate,
    startDate: joinDate,
    endDate: e.end_date || null,
    status: (statusMap[e.status || arabicSource("common.is_active")] || arabicSource("common.is_active")) as Employee["status"],
    salary: e.monthly_salary || 0,
    currency: e.currency || "IQD",
    photo: e.profile_picture || "",
    address: e.address || "—",
    nationalId: e.national_id || "—",
    emergencyContact: e.emergency_contact || "—",
    emergencyPhone: e.emergency_phone || "—",
    bloodType: e.blood_type || "—",
    managerId: e.manager_id || null,
    managerName: manager ? empDisplayName(manager) : arabicSource("common.no_manager"),
    custodies: [],
    leaves: [],
    attachments: [],
  };
}

export function Employees() {
  const { employees: dbEmployees, loading: dbLoading, refetch } = useEmployees();
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState(arabicSource("common.all"));
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [sortBy, setSortBy] = useState<"name" | "employeeNumber" | "deviceNo" | "department" | "position" | "status" | "joinDate" | "salary">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Add Employee form state
  const [addForm, setAddForm] = useState({
    name: "", email: "", personalPhone: "", companyPhone: "",
    position: "", address: "", department: "", salary: "",
    joinDate: "", nationalId: "", gender: "male" as "male" | "female",
  });
  const [addSaving, setAddSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [deviceSyncStatus, setDeviceSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [nextEmployeeId, setNextEmployeeId] = useState<number | null>(null);
  const [loadingNextId, setLoadingNextId] = useState(false);
  const [facePhotoBase64, setFacePhotoBase64] = useState<string | null>(null);
  const [facePhotoPreview, setFacePhotoPreview] = useState<string | null>(null);

  const resetAddForm = () => {
    setAddForm({ name: "", email: "", personalPhone: "", companyPhone: "", position: "", address: "", department: "", salary: "", joinDate: "", nationalId: "", gender: "male" });
    setAddError(null);
    setDeviceSyncStatus("idle");
    setNextEmployeeId(null);
    setFacePhotoBase64(null);
    setFacePhotoPreview(null);
  };

  // Fetch next available employee ID when modal opens
  const fetchNextId = async () => {
    setLoadingNextId(true);
    try {
      const res = await fetch(`${SYNC_API}/device/next-employee-id`);
      const data = await res.json();
      if (data.success) setNextEmployeeId(data.nextId);
      else {
        // Fallback: use local max + 1
        const maxPerson = dbEmployees.reduce((max, e) => Math.max(max, e.person_id || 0), 0);
        setNextEmployeeId(maxPerson + 1);
      }
    } catch {
      const maxPerson = dbEmployees.reduce((max, e) => Math.max(max, e.person_id || 0), 0);
      setNextEmployeeId(maxPerson + 1);
    }
    setLoadingNextId(false);
  };

  const handleFacePhoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFacePhotoPreview(result);
      // Extract base64 data (remove data:image/...;base64, prefix)
      setFacePhotoBase64(result.split(",")[1] || "");
    };
    reader.readAsDataURL(file);
  };

  const handleAddEmployee = async () => {
    if (!addForm.name.trim()) { setAddError(arabicSource("employees.name_required")); return; }
    if (!nextEmployeeId) { setAddError(arabicSource("employees.employee_number_not_specified")); return; }
    setAddSaving(true);
    setAddError(null);

    try {
      const newPersonId = nextEmployeeId;

      // Insert into Supabase
      const { data, error } = await supabase.from("employees").insert({
        person_id: newPersonId,
        name: addForm.name,
        arabic_name: addForm.name,
        email: addForm.email || null,
        personal_phone: addForm.personalPhone || null,
        company_phone: addForm.companyPhone || null,
        position: addForm.position || null,
        address: addForm.address || null,
        department: addForm.department || arabicSource("common.not_specified"),
        monthly_salary: parseFloat(addForm.salary) || 0,
        currency: "IQD",
        join_date: addForm.joinDate || null,
        national_id: addForm.nationalId || null,
        status: arabicSource("common.is_active"),
        overtime_rate: 1.5,
        overtime_enabled: false,
        allowed_late_minutes: 15,
        device_employee_no: String(newPersonId),
      }).select("*").single();

      if (error) { setAddError(error.message); setAddSaving(false); return; }

      // Auto-push to biometric device
      setDeviceSyncStatus("syncing");
      try {
        const syncRes = await fetch(`${SYNC_API}/device/sync-employee`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeNo: String(newPersonId),
            name: addForm.name,
            gender: addForm.gender,
            facePhoto: facePhotoBase64 || undefined,
          }),
        });
        const syncData = await syncRes.json();
        setDeviceSyncStatus(syncData.success ? "success" : "error");
      } catch {
        setDeviceSyncStatus("error");
      }

      // Refresh employee list
      refetch();

      // Close modal after a brief delay to show sync status
      setTimeout(() => {
        setShowAddModal(false);
        resetAddForm();
      }, 1500);
    } catch (e: any) {
      setAddError(e.message);
    }
    setAddSaving(false);
  };

  const handleDeleteEmployee = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      // Try to remove from biometric device first
      const dbEmp = dbEmployees.find(e => e.id === deleteConfirm.id);
      if (dbEmp?.device_employee_no) {
        try {
          await fetch(`${SYNC_API}/device/persons/${dbEmp.device_employee_no}`, { method: "DELETE" });
        } catch { /* device removal is best-effort */ }
      }
      // Soft-delete: mark as inactive instead of hard-delete to preserve referential integrity
      const { error } = await supabase.from("employees").update({ status: arabicSource("common.is_inactive"), termination_date: new Date().toISOString().substring(0, 10) }).eq("id", deleteConfirm.id);
      if (error) throw error;
      refetch();
      setDeleteConfirm(null);
    } catch (e: any) {
      console.error("Delete failed:", e.message);
      localizedAlert(arabicSource("employees.error_deleting_employee") + " " + e.message);
    }
    setDeleting(false);
  };

  // Convert DB employees to UI employees
  const allEmployees = useMemo(() => dbEmployees.map(e => toEmployee(e, dbEmployees)), [dbEmployees]);

  // Build employee options for the detail panel's manager dropdown
  const employeeOptions: EmployeeOption[] = useMemo(() => 
    dbEmployees.map(e => ({
      dbId: e.id,
      name: empDisplayName(e),
      position: e.position || e.department || "—",
    })), [dbEmployees]);

  // Extract unique departments from real data
  const realDepts = useMemo(() => {
    const depts = new Set(allEmployees.map(e => e.department));
    return [arabicSource("common.all"), ...Array.from(depts)];
  }, [allEmployees]);

  // Track which employees have device_employee_no set (synced to device)
  const deviceSyncedSet = useMemo(() => {
    const set = new Set<number>();
    dbEmployees.forEach(e => {
      if (e.device_employee_no) set.add(e.person_id);
    });
    return set;
  }, [dbEmployees]);

  // Track pending employees that were auto-created from the device.
  const pendingEmployees = useMemo(() => {
    return new Set(dbEmployees.filter(e => e.status === arabicSource("common.pending")).map(e => e.person_id));
  }, [dbEmployees]);

  const filtered = useMemo(() => {
    let list = allEmployees.filter(emp => {
      const matchSearch = emp.name.includes(search) || emp.position.includes(search) || emp.employeeNumber.includes(search);
      const matchDept = selectedDept === arabicSource("common.all") || emp.department === selectedDept;
      return matchSearch && matchDept;
    });
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortBy === "name") return dir * a.name.localeCompare(b.name, "ar");
      if (sortBy === "employeeNumber") return dir * a.employeeNumber.localeCompare(b.employeeNumber);
      if (sortBy === "deviceNo") return dir * (parseInt(a.employeeNumber || "0") - parseInt(b.employeeNumber || "0"));
      if (sortBy === "department") return dir * a.department.localeCompare(b.department, "ar");
      if (sortBy === "position") return dir * a.position.localeCompare(b.position, "ar");
      if (sortBy === "status") return dir * a.status.localeCompare(b.status, "ar");
      if (sortBy === "joinDate") return dir * (a.joinDate || "").localeCompare(b.joinDate || "");
      if (sortBy === "salary") return dir * ((a as any).salary - (b as any).salary);
      return 0;
    });
    return list;
  }, [allEmployees, search, selectedDept, sortBy, sortDir]);

  const kanbanDepts = realDepts.filter(d => d !== arabicSource("common.all"));

  if (dbLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-muted-foreground ms-3">{arabicSource("employees.loading_employee_data")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gradient-gold">{arabicSource("common.employees")}</h1>
          <p className="text-muted-foreground mt-1">{arabicSource("employees.employee_data_management")}</p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle view={viewMode} onChange={setViewMode} />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setShowAddModal(true); fetchNextId(); }}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg shadow-lg shadow-primary/20 hover:bg-gold-dark transition-colors cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            {arabicSource("common.add_an_employee")}
          </motion.button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: arabicSource("common.total_employees"), value: allEmployees.length, icon: Users },
          { label: arabicSource("employees.are_active"), value: allEmployees.filter(e => e.status === arabicSource("common.is_active")).length, icon: CheckCircle2 },
          { label: arabicSource("employees.is_on_vacation"), value: allEmployees.filter(e => e.status === arabicSource("common.leave")).length, icon: Calendar },
          { label: arabicSource("employees.are_synchronized_with_the_device"), value: deviceSyncedSet.size, icon: Fingerprint },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
          <input
            type="text"
            placeholder={arabicSource("common.search_for_an_employee")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 ps-10 pe-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {realDepts.map(dept => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                selectedDept === dept
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
              style={{ fontSize: 13 }}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "list" ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl overflow-hidden shadow-lg"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <SortableHeaderRow
                    columns={[
                      { label: arabicSource("common.employee"), key: "name" },
                      { label: arabicSource("common.job_number"), key: "employeeNumber" },
                      { label: arabicSource("common.fingerprint_number"), key: "deviceNo", center: true },
                      { label: arabicSource("common.section"), key: "department" },
                      { label: arabicSource("common.position"), key: "position" },
                      { label: arabicSource("common.status"), key: "status" },
                      { label: arabicSource("common.footprint"), key: null },
                      { label: arabicSource("common.direct_date"), key: "joinDate" },
                      { label: arabicSource("common.salary"), key: "salary" },
                      { label: arabicSource("common.procedures"), key: null },
                    ]}
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSort={(key) => toggleSort(key, sortBy, sortDir, setSortBy, setSortDir)}
                  />
                </thead>
                <tbody>
                  {filtered.map((emp, i) => (
                    <motion.tr
                      key={emp.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-border/20 hover:bg-muted/10 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {emp.photo ? (
                            <img src={emp.photo} alt={emp.name} className="w-9 h-9 rounded-full object-cover border border-primary/30" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                              <span className="text-primary" style={{ fontSize: 14 }}>{emp.name.charAt(0)}</span>
                            </div>
                          )}
                          <div>
                            <p className="text-foreground">{emp.name}</p>
                            <p className="text-muted-foreground" style={{ fontSize: 12 }}>{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{emp.employeeNumber}</td>
                      <td className="px-4 py-3 text-center">
                        {(() => {
                          const dbEmp = dbEmployees.find(e => e.person_id === emp.id);
                          const devNo = dbEmp?.device_employee_no;
                          return devNo ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted/30 border border-border/30 font-mono text-foreground" style={{ fontSize: 12 }}>
                              <Fingerprint className="w-3 h-3 text-primary/60" />
                              #{devNo}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40" style={{ fontSize: 11 }}>—</span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }}>{emp.department}</td>
                      <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }}>{emp.position}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-md border ${statusColors[emp.status]}`} style={{ fontSize: 12 }}>
                          {translateBackendCode(emp.status, employeeStatusKeys)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {pendingEmployees.has(emp.id) ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-400" style={{ fontSize: 11 }}>
                            <AlertCircle className="w-3 h-3" /> {arabicSource("employees.missing_data")}
                          </span>
                        ) : deviceSyncedSet.has(emp.id) ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-400" style={{ fontSize: 11 }}>
                            <Fingerprint className="w-3 h-3" /> {arabicSource("employees.registered")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-muted-foreground/20 bg-muted/10 text-muted-foreground" style={{ fontSize: 11 }}>
                            <Fingerprint className="w-3 h-3" /> {arabicSource("employees.is_not_registered")}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{emp.startDate}</td>
                      <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }} dir="ltr">{formatCurrency(emp.salary, emp.currency)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setSelectedEmployee(emp)} className="p-1.5 rounded hover:bg-secondary transition-colors cursor-pointer">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button onClick={() => setSelectedEmployee(emp)} className="p-1.5 rounded hover:bg-secondary transition-colors cursor-pointer">
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button onClick={() => { const dbEmp = dbEmployees.find(d => d.person_id === emp.id); if (dbEmp) setDeleteConfirm({ id: dbEmp.id, name: emp.name }); }} className="p-1.5 rounded hover:bg-destructive/20 transition-colors cursor-pointer">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="kanban"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3"
          >
            {kanbanDepts.map((dept, ci) => {
              const items = filtered.filter(e => e.department === dept);
              if (selectedDept !== arabicSource("common.all") && selectedDept !== dept) return null;
              return (
                <motion.div
                  key={dept}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: ci * 0.08 }}
                  className={`bg-card/20 backdrop-blur-md border ${deptColors[dept] || "border-border/40"} rounded-xl shadow-lg overflow-hidden`}
                >
                  <div className="p-3 border-b border-border/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${deptDots[dept] || "bg-primary"}`} />
                      <span className="text-foreground" style={{ fontSize: 13 }}>{dept}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground" style={{ fontSize: 11 }}>
                      {items.length}
                    </span>
                  </div>
                  <div className="p-3 space-y-8 min-h-[140px] pt-8">
                    {items.length > 0 ? items.map((emp, i) => {
                      const accent = accentColors[(emp.id - 1) % accentColors.length];
                      return (
                        <motion.div
                          key={emp.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          whileHover={{ y: -4, transition: { duration: 0.2 } }}
                          onClick={() => setSelectedEmployee(emp)}
                          className="relative pt-7 cursor-pointer group"
                        >
                          <div className="absolute top-0 inset-x-0 flex justify-center z-10">
                            <div className="relative">
                              <div className="absolute -inset-1 rounded-full opacity-40 group-hover:opacity-70 transition-opacity blur-sm" style={{ background: accent }} />
                              <div className="relative w-13 h-13 rounded-full overflow-hidden border-[3px] shadow-lg" style={{ borderColor: accent, boxShadow: `0 4px 14px ${accent}40` }}>
                                {emp.photo ? (
                                  <img src={emp.photo} alt={emp.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-card">
                                    <span className="text-primary" style={{ fontSize: 18 }}>{emp.name.charAt(0)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="relative rounded-xl overflow-hidden border border-white/[0.08] shadow-md group-hover:shadow-xl transition-all" style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(8px)" }}>
                            <div className="absolute top-0 start-0 bottom-0 w-1 z-[5]" style={{ background: accent, borderStartStartRadius: 12 }} />
                            <div className="absolute top-0 start-0 z-10 flex items-center justify-center" style={{ background: accent, borderStartStartRadius: 11, borderEndEndRadius: 8, padding: '4px 8px 5px 6px', minWidth: 28, boxShadow: `0 2px 6px ${accent}50` }}>
                              <span className="text-white" style={{ fontSize: 9, lineHeight: 1 }}>{String(emp.id).padStart(2, "0")}</span>
                            </div>
                            <div className="h-0.5 w-full" style={{ background: `linear-gradient(to left, ${accent}, transparent)` }} />
                            <div className="px-3 pt-7 pb-2.5 text-center">
                              <p className="text-foreground truncate" style={{ fontSize: 12 }}>{emp.name}</p>
                              <p className="text-muted-foreground truncate mt-0.5" style={{ fontSize: 10 }}>{emp.position}</p>
                              <div className="flex items-center justify-center gap-2 mt-2">
                                <span className={`px-1.5 py-0.5 rounded border ${statusColors[emp.status]}`} style={{ fontSize: 9 }}>{translateBackendCode(emp.status, employeeStatusKeys)}</span>
                                {(() => {
                                  const dbEmp = dbEmployees.find(e => e.person_id === emp.id);
                                  return dbEmp?.device_employee_no ? (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted/20 border border-border/20 font-mono text-muted-foreground" style={{ fontSize: 8 }}>
                                      <Fingerprint className="w-2.5 h-2.5 text-primary/50" />
                                      #{dbEmp.device_employee_no}
                                    </span>
                                  ) : null;
                                })()}
                              </div>
                              {emp.phone !== "—" && (
                                <p className="text-muted-foreground/50 truncate mt-1" style={{ fontSize: 8 }} dir="ltr">{emp.phone}</p>
                              )}
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.06]">
                                <span className="flex items-center gap-0.5 text-muted-foreground/60" style={{ fontSize: 9 }}>
                                  <Calendar className="w-2.5 h-2.5" />
                                  <span dir="ltr">{emp.joinDate}</span>
                                </span>
                                <span className="text-muted-foreground" style={{ fontSize: 9 }} dir="ltr">{formatCurrency(emp.salary, emp.currency)}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    }) : (
                      <div className="flex items-center justify-center h-[80px] text-muted-foreground" style={{ fontSize: 13 }}>{arabicSource("employees.there_are_no_employees")}</div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Employee Detail Panel — Full-screen slide-in */}
      <AnimatePresence>
        {selectedEmployee && (
          <EmployeeDetailPanel
            employee={selectedEmployee}
            onClose={() => setSelectedEmployee(null)}
            onSave={() => {
              refetch();
              setSelectedEmployee(null);
            }}
            allEmployees={employeeOptions.filter(e => e.dbId !== selectedEmployee.dbId)}
          />
        )}
      </AnimatePresence>

      {/* Add Employee Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { if (!addSaving) { setShowAddModal(false); resetAddForm(); } }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-lg max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-foreground">{arabicSource("common.add_a_new_employee")}</h2>
                <button onClick={() => { if (!addSaving) { setShowAddModal(false); resetAddForm(); } }} className="p-1 rounded hover:bg-secondary cursor-pointer">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="space-y-4">
                {/* Section: Device Registration */}
                <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                  <p className="text-xs text-primary mb-3 flex items-center gap-1.5"><Fingerprint className="w-3.5 h-3.5" /> {arabicSource("employees.fingerprint_device_data_mandatory")}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Employee ID — auto-generated, read-only */}
                    <div>
                      <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>{arabicSource("employees.employee_number")}</label>
                      <div className="w-full h-11 px-4 rounded-lg border border-border bg-muted/30 text-foreground flex items-center font-mono" dir="ltr">
                        {loadingNextId ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : nextEmployeeId ? `#${nextEmployeeId}` : "—"}
                        <span className="text-muted-foreground text-[10px] ms-2">{arabicSource("employees.automatic")}</span>
                      </div>
                    </div>
                    {/* Gender */}
                    <div>
                      <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>{arabicSource("employees.gender")}</label>
                      <select
                        value={addForm.gender}
                        onChange={(e) => setAddForm(f => ({ ...f, gender: e.target.value as "male" | "female" }))}
                        className="w-full h-11 px-4 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none"
                      >
                        <option value="male">{arabicSource("common.male")}</option>
                        <option value="female">{arabicSource("common.female")}</option>
                      </select>
                    </div>
                  </div>
                  {/* Face photo upload */}
                  <div className="mt-3">
                    <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>{arabicSource("common.face_image")} <span className="text-muted-foreground">{arabicSource("employees.optional_can_be_added_later")}</span></label>
                    <div className="flex items-center gap-3">
                      {facePhotoPreview ? (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-primary/30">
                          <img src={facePhotoPreview} alt="Face" className="w-full h-full object-cover" />
                          <button onClick={() => { setFacePhotoPreview(null); setFacePhotoBase64(null); }} className="absolute top-0 end-0 p-0.5 bg-black/60 rounded-bl text-white hover:bg-black/80">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border hover:border-primary/40 cursor-pointer transition-colors">
                          <Upload className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{arabicSource("employees.upload_an_image")}</span>
                          <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFacePhoto(f); e.target.value = ""; }} />
                        </label>
                      )}
                      <span className="text-[10px] text-muted-foreground/60">{arabicSource("employees.jpg_or_png_max_200kb")}</span>
                    </div>
                  </div>
                </div>

                {/* Section: HR Information */}
                <div className="border-t border-border/20 pt-3">
                  <p className="text-xs text-muted-foreground mb-3">{arabicSource("employees.employee_data")}</p>
                  {/* Name — mandatory */}
                  <div className="mb-3">
                    <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>{arabicSource("common.full_name")}</label>
                    <input type="text" value={addForm.name} onChange={(e) => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder={arabicSource("employees.enter_the_employee_s_name")} className="w-full h-11 px-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>{arabicSource("common.id_number")}</label>
                      <input type="text" value={addForm.nationalId} onChange={(e) => setAddForm(f => ({ ...f, nationalId: e.target.value }))} placeholder={arabicSource("employees.national_id_number")} className="w-full h-11 px-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none" />
                    </div>
                    <div>
                      <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>{arabicSource("common.email")}</label>
                      <input type="text" value={addForm.email} onChange={(e) => setAddForm(f => ({ ...f, email: e.target.value }))} placeholder="example@company.iq" className="w-full h-11 px-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none" />
                    </div>
                    <div>
                      <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>{arabicSource("employees.personal_phone")}</label>
                      <input type="text" value={addForm.personalPhone} onChange={(e) => setAddForm(f => ({ ...f, personalPhone: e.target.value }))} placeholder="07XXXXXXXXX" className="w-full h-11 px-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none" />
                    </div>
                    <div>
                      <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>{arabicSource("common.company_phone")}</label>
                      <input type="text" value={addForm.companyPhone} onChange={(e) => setAddForm(f => ({ ...f, companyPhone: e.target.value }))} placeholder="07XXXXXXXXX" className="w-full h-11 px-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none" />
                    </div>
                    <div>
                      <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>{arabicSource("employees.job_position")}</label>
                      <input type="text" value={addForm.position} onChange={(e) => setAddForm(f => ({ ...f, position: e.target.value }))} placeholder={arabicSource("common.position")} className="w-full h-11 px-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none" />
                    </div>
                    <div>
                      <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>{arabicSource("common.section")}</label>
                      <select value={addForm.department} onChange={(e) => setAddForm(f => ({ ...f, department: e.target.value }))} className="w-full h-11 px-4 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none">
                        <option value="">{arabicSource("employees.select_the_section")}</option>
                        {realDepts.filter(d => d !== arabicSource("common.all")).map(d => (<option key={d} value={d}>{d}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>{arabicSource("employees.salary_iqd")}</label>
                      <input type="number" value={addForm.salary} onChange={(e) => setAddForm(f => ({ ...f, salary: e.target.value }))} placeholder="0" className="w-full h-11 px-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none" dir="ltr" />
                    </div>
                    <div>
                      <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>{arabicSource("common.direct_date")}</label>
                      <input type="date" value={addForm.joinDate} onChange={(e) => setAddForm(f => ({ ...f, joinDate: e.target.value }))} className="w-full h-11 px-4 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none" dir="ltr" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>{arabicSource("common.address")}</label>
                    <input type="text" value={addForm.address} onChange={(e) => setAddForm(f => ({ ...f, address: e.target.value }))} placeholder={arabicSource("employees.baghdad_region")} className="w-full h-11 px-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none" />
                  </div>
                </div>

                {/* Device sync status indicator */}
                {deviceSyncStatus !== "idle" && (
                  <div className={`flex items-center gap-2 p-3 rounded-lg border ${
                    deviceSyncStatus === "syncing" ? "border-blue-500/30 bg-blue-500/10 text-blue-400" :
                    deviceSyncStatus === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" :
                    "border-amber-500/30 bg-amber-500/10 text-amber-400"
                  }`}>
                    {deviceSyncStatus === "syncing" && <><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">{arabicSource("employees.synchronizing_data_with_the_fingerprint_device")}</span></>}
                    {deviceSyncStatus === "success" && <><CheckCircle2 className="w-4 h-4" /><span className="text-sm">{arabicSource("employees.the_employee_was_successfully_created_and_registered_on_the_fing")}</span></>}
                    {deviceSyncStatus === "error" && <><AlertCircle className="w-4 h-4" /><span className="text-sm">{arabicSource("employees.saved_to_the_system_but_synchronization_with_the_device_failed_w")}</span></>}
                  </div>
                )}

                {addError && (
                  <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">{addError}</div>
                )}

                <div className="flex gap-3 pt-3">
                  <button
                    onClick={handleAddEmployee}
                    disabled={addSaving || !addForm.name.trim() || !nextEmployeeId}
                    className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground hover:bg-gold-dark transition-colors shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {addSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Fingerprint className="w-4 h-4" /><Plus className="w-4 h-4" /></>}
                    {addSaving ? arabicSource("common.saving") : arabicSource("employees.save_and_record_on_the_device")}
                  </button>
                  <button
                    onClick={() => { if (!addSaving) { setShowAddModal(false); resetAddForm(); } }}
                    disabled={addSaving}
                    className="flex-1 h-11 rounded-lg border-2 border-border text-foreground hover:bg-secondary transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {arabicSource("common.cancel")}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !deleting && setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-destructive/10">
                  <Trash2 className="w-5 h-5 text-destructive" />
                </div>
                <h3 className="text-foreground font-semibold" style={{ fontSize: 16 }}>{arabicSource("employees.confirm_deletion")}</h3>
              </div>
              <p className="text-muted-foreground mb-6" style={{ fontSize: 14 }}>
                {arabicSource("employees.are_you_sure_you_want_to_delete_the_employee")} <span className="text-foreground font-medium">{deleteConfirm.name}</span>{arabicSource("employees.all_his_data_will_be_deleted_from_the_system_and_he_will_be_remo")}
              </p>
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-secondary transition-colors cursor-pointer"
                  style={{ fontSize: 13 }}
                >
                  {arabicSource("common.cancel")}
                </button>
                <button
                  onClick={handleDeleteEmployee}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors cursor-pointer flex items-center gap-2"
                  style={{ fontSize: 13 }}
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deleting ? arabicSource("employees.deleting") : arabicSource("employees.delete_employee")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
