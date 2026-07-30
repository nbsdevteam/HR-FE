import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail, Phone, MapPin, Building, Edit, Trash2, X, Wallet, Calendar,
  Save, Hash, Briefcase, User, PhoneCall, Smartphone, FileText, ClipboardList,
  CalendarCheck, CalendarX, Laptop, Paperclip, PlusCircle, Check, Loader2, Users, Plus,
  Fingerprint, ScanFace, AlertTriangle, ShieldOff
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { DEPARTMENTS, SYNC_API } from "../lib/constants";

interface Custody {
  id: number;
  item: string;
  description: string;
  dateReceived: string;
  serialNumber?: string;
}

interface LeaveRecord {
  id: number;
  type: string;
  from: string;
  to: string;
  days: number;
  status: string | string | string;
}

interface Attachment {
  id: number;
  name: string;
  type: string;
  date: string;
}

export interface Employee {
  id: number;
  dbId: string; // actual DB id (TEXT) for Supabase updates
  employeeNumber: string;
  name: string;
  position: string;
  department: string;
  email: string;
  personalPhone: string;
  companyPhone: string;
  phone: string;
  joinDate: string;
  startDate: string;
  endDate: string | null;
  status: string | string | string | string;
  salary: number;
  currency: string;
  photo: string;
  address: string;
  nationalId: string;
  emergencyContact: string;
  emergencyPhone: string;
  bloodType: string;
  managerId: string | null;
  managerName: string;
  custodies: Custody[];
  leaves: LeaveRecord[];
  attachments: Attachment[];
}

export interface EmployeeOption {
  dbId: string;
  name: string;
  position: string;
}

const departments: string[] = [...DEPARTMENTS];
import { formatCurrency } from "../lib/payslip-engine";
import { arabicSource } from "../i18n/source";

const statusColors: Record<string, string> = {
  [arabicSource("common.is_active")]: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
  [arabicSource("common.leave")]: "bg-primary/15 border-primary/30 text-primary",
  [arabicSource("common.finished")]: "bg-destructive/15 border-destructive/30 text-destructive",
};

const leaveStatusColors: Record<string, string> = {
  [arabicSource("common.agreed")]: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
  [arabicSource("common.pending_2")]: "bg-primary/15 border-primary/30 text-primary",
  [arabicSource("common.rejected")]: "bg-destructive/15 border-destructive/30 text-destructive",
};

type ModalTab = "info" | "custodies" | "leaves" | "attachments";

interface Props {
  employee: Employee;
  onClose: () => void;
  onSave?: () => void;
  allEmployees?: EmployeeOption[];
}

// Reusable field row component for the info tab
function FieldRow({
  icon: Icon,
  iconColor = "text-primary",
  label,
  value,
  dir,
  isEditing,
  editElement,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  label: string;
  value: React.ReactNode;
  dir?: "ltr";
  isEditing: boolean;
  editElement?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-3.5" style={{ borderBottom: "1px solid var(--border)", borderBottomStyle: "solid", opacity: 0.9 }}>
      <Icon className={`w-5 h-5 ${iconColor} shrink-0`} />
      <span className="text-muted-foreground shrink-0 min-w-[110px]" style={{ fontSize: 13 }}>{label}:</span>
      <div className="flex-1 min-w-0">
        {isEditing && editElement ? (
          editElement
        ) : (
          <span className={highlight ? "text-gradient-gold" : "text-foreground"} style={{ fontSize: 14 }} dir={dir}>
            {value}
          </span>
        )}
      </div>
    </div>
  );
}

const todayStr = () => new Date().toISOString().split("T")[0];

export function EmployeeDetailPanel({ employee, onClose, onSave, allEmployees = [] }: Props) {
  const [modalTab, setModalTab] = useState<ModalTab>("info");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Employee>({ ...employee });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [addingNewDept, setAddingNewDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");

  // Build the full department list: hardcoded + current employee's dept if not already included
  const allDepts = [...departments];
  if (employee.department && !allDepts.includes(employee.department)) {
    allDepts.push(employee.department);
  }
  if (editData.department && !allDepts.includes(editData.department)) {
    allDepts.push(editData.department);
  }

  // Add custody form
  const [showAddCustody, setShowAddCustody] = useState(false);
  const [newCustody, setNewCustody] = useState<{ item: string; description: string; dateReceived: string; serialNumber: string }>({
    item: "", description: "", dateReceived: todayStr(), serialNumber: "",
  });

  // Add attachment form
  const [showAddAttachment, setShowAddAttachment] = useState(false);
  const [newAttachment, setNewAttachment] = useState<{ name: string; type: string }>({
    name: "", type: "PDF",
  });

  // Termination flow
  const [showTerminationDialog, setShowTerminationDialog] = useState(false);
  const [terminationOptions, setTerminationOptions] = useState({ removeFace: true, removeFingerprint: true, removePerson: true });
  const [terminationLoading, setTerminationLoading] = useState(false);
  const [terminationResult, setTerminationResult] = useState<string | null>(null);

  const handleEditField = (field: keyof Employee, value: string | number) => {
    setEditData({ ...editData, [field]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const { error } = await supabase
        .from("employees")
        .update({
          arabic_name: editData.name,
          department: editData.department,
          position: editData.position,
          email: editData.email,
          personal_phone: editData.personalPhone,
          company_phone: editData.companyPhone,
          monthly_salary: editData.salary,
          join_date: editData.startDate || null,
          end_date: editData.endDate || null,
          status: editData.status,
          address: editData.address,
          national_id: editData.nationalId,
          emergency_contact: editData.emergencyContact,
          emergency_phone: editData.emergencyPhone,
          blood_type: editData.bloodType,
          manager_id: editData.managerId || null,
        })
        .eq("id", editData.dbId);

      if (error) {
        setSaveError(error.message);
        console.error("Save error:", error);
      } else {
        setIsEditing(false);
        onSave?.();

        // Trigger the termination flow when the employee status changes to ended.
        if (editData.status === arabicSource("common.finished") && employee.status !== arabicSource("common.finished")) {
          setShowTerminationDialog(true);
        } else if (editData.status !== arabicSource("common.finished")) {
          // Auto-sync name/info changes to biometric device
          try {
            fetch(`${SYNC_API}/device/sync-employee`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                employeeNo: String(employee.id),
                name: editData.name,
              }),
            }).catch(() => { /* device sync is best-effort */ });
          } catch { /* non-critical */ }
        }
      }
    } catch (e: any) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({ ...employee });
    setShowAddCustody(false);
    setShowAddAttachment(false);
  };

  const handleTermination = async () => {
    setTerminationLoading(true);
    setTerminationResult(null);
    try {
      const res = await fetch(`${SYNC_API}/device/remove-credentials/${employee.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(terminationOptions),
      });
      const data = await res.json();
      if (data.success) {
        const parts: string[] = [];
        if (data.results?.face === "removed") parts.push(arabicSource("common.face_image"));
        if (data.results?.fingerprint === "removed") parts.push(arabicSource("common.footprint"));
        if (data.results?.person === "removed") parts.push(arabicSource("shared.calculation_from_the_device"));
        setTerminationResult(parts.length > 0 ? `${arabicSource("shared.removed")} ${parts.join("، ")}` : arabicSource("shared.the_operation_was_completed"));
      } else {
        setTerminationResult(arabicSource("shared.removal_from_the_device_failed"));
      }
    } catch {
      setTerminationResult(arabicSource("shared.unable_to_connect_to_device_you_can_remove_later_from_the_finger"));
    }
    setTerminationLoading(false);
    // Close dialog after showing result
    setTimeout(() => {
      setShowTerminationDialog(false);
      setTerminationResult(null);
      onSave?.();
    }, 2500);
  };

  // ---- Custody handlers ----
  const handleAddCustody = () => {
    if (!newCustody.item.trim()) return;
    const nextId = editData.custodies.length > 0 ? Math.max(...editData.custodies.map(c => c.id)) + 1 : 1;
    const custody: Custody = {
      id: nextId,
      item: newCustody.item.trim(),
      description: newCustody.description.trim(),
      dateReceived: newCustody.dateReceived,
      ...(newCustody.serialNumber.trim() ? { serialNumber: newCustody.serialNumber.trim() } : {}),
    };
    setEditData({ ...editData, custodies: [...editData.custodies, custody] });
    setNewCustody({ item: "", description: "", dateReceived: todayStr(), serialNumber: "" });
    setShowAddCustody(false);
  };

  const handleDeleteCustody = (id: number) => {
    setEditData({ ...editData, custodies: editData.custodies.filter(c => c.id !== id) });
  };

  // ---- Attachment handlers ----
  const handleAddAttachment = () => {
    if (!newAttachment.name.trim()) return;
    const nextId = editData.attachments.length > 0 ? Math.max(...editData.attachments.map(a => a.id)) + 1 : 1;
    const att: Attachment = {
      id: nextId,
      name: newAttachment.name.trim(),
      type: newAttachment.type,
      date: todayStr(),
    };
    setEditData({ ...editData, attachments: [...editData.attachments, att] });
    setNewAttachment({ name: "", type: "PDF" });
    setShowAddAttachment(false);
  };

  const handleDeleteAttachment = (id: number) => {
    setEditData({ ...editData, attachments: editData.attachments.filter(a => a.id !== id) });
  };

  const inputClass = "w-full bg-transparent border-b-2 border-primary/40 focus:border-primary px-1 py-1.5 text-foreground outline-none transition-colors";
  const formInputClass = "w-full h-10 px-3 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      {/* Full-screen panel sliding from the start (right in RTL) */}
      <motion.div
        initial={{ x: 80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 80, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="ms-auto w-full max-w-[680px] h-full bg-card shadow-2xl flex flex-col overflow-hidden"
        style={{
          borderInlineStart: "1px solid var(--border)",
        }}
      >
        {/* ===== HEADER ===== */}
        <div className="shrink-0 px-6 pt-5 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
          {/* Top bar: title + actions */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-foreground" style={{ fontSize: 20 }}>{arabicSource("common.employee_details")}</h2>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-md shadow-primary/20 hover:opacity-90 transition-all cursor-pointer disabled:opacity-60"
                    style={{ fontSize: 13 }}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? arabicSource("common.saving") : arabicSource("common.save")}
                  </motion.button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    style={{ fontSize: 13 }}
                  >
                    {arabicSource("common.cancel")}
                  </button>
                </>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors cursor-pointer"
                  style={{ fontSize: 13 }}
                >
                  <Edit className="w-4 h-4" />
                  {arabicSource("common.edit")}
                </motion.button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Employee identity card */}
          <div className="flex items-center gap-4 bg-muted/10 rounded-xl p-4 border border-border/30">
            <div className="relative shrink-0">
              {editData.photo ? (
                <img
                  src={editData.photo}
                  alt={editData.name}
                  className="w-20 h-20 rounded-full object-cover shadow-lg"
                  style={{ border: "3px solid var(--primary)", boxShadow: "0 4px 20px rgba(var(--primary-rgb, 212,175,55), 0.25)" }}
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center bg-primary/20 shadow-lg"
                  style={{ border: "3px solid var(--primary)", boxShadow: "0 4px 20px rgba(var(--primary-rgb, 212,175,55), 0.25)" }}
                >
                  <span className="text-primary" style={{ fontSize: 28 }}>{editData.name.charAt(0)}</span>
                </div>
              )}
              <div className={`absolute -bottom-0.5 -end-0.5 w-5 h-5 rounded-full border-[2.5px] border-card ${
                editData.status === arabicSource("common.is_active") ? "bg-emerald-500" : editData.status === arabicSource("common.leave") ? "bg-primary" : editData.status === arabicSource("common.pending") ? "bg-amber-500" : "bg-destructive"
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-foreground truncate" style={{ fontSize: 18 }}>{editData.name}</h3>
              <p className="text-muted-foreground mt-0.5" style={{ fontSize: 14 }}>{editData.position}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2.5 py-0.5 rounded-md border ${statusColors[editData.status]}`} style={{ fontSize: 11 }}>
                  {editData.status}
                </span>
                <span className="text-muted-foreground px-2 py-0.5 rounded-md bg-muted/20" style={{ fontSize: 11 }} dir="ltr">
                  {editData.employeeNumber}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Save error message */}
        {saveError && (
          <div className="shrink-0 mx-6 mt-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive" style={{ fontSize: 13 }}>
            {arabicSource("shared.error_saving")} {saveError}
          </div>
        )}

        {/* ===== TABS ===== */}
        <div className="shrink-0 flex items-center gap-0.5 px-6 bg-muted/5" style={{ borderBottom: "1px solid var(--border)" }}>
          {([
            { key: "info" as ModalTab, label: arabicSource("shared.information"), icon: User, count: null },
            { key: "custodies" as ModalTab, label: arabicSource("shared.receivables"), icon: Laptop, count: editData.custodies.length },
            { key: "leaves" as ModalTab, label: arabicSource("common.vacations"), icon: CalendarCheck, count: editData.leaves.length },
            { key: "attachments" as ModalTab, label: arabicSource("shared.attachments"), icon: Paperclip, count: editData.attachments.length },
          ]).map(tab => {
            const TabIcon = tab.icon;
            const isActive = modalTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setModalTab(tab.key)}
                className={`relative flex items-center gap-1.5 px-4 py-3 transition-colors cursor-pointer ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
                style={{ fontSize: 13 }}
              >
                <TabIcon className="w-4 h-4" />
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full ${isActive ? "bg-primary/15 text-primary" : "bg-muted/30 text-muted-foreground"}`} style={{ fontSize: 10 }}>
                    {tab.count}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="emp-panel-tab"
                    className="absolute bottom-0 inset-x-2 h-[2px] bg-primary rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ===== CONTENT ===== */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* ---- INFO TAB ---- */}
            {modalTab === "info" && (
              <motion.div
                key="info"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="px-6 py-4"
              >
                <FieldRow
                  icon={Hash} label={arabicSource("common.job_number")} value={editData.employeeNumber} dir="ltr"
                  isEditing={isEditing}
                  editElement={
                    <input value={editData.employeeNumber} onChange={(e) => handleEditField("employeeNumber", e.target.value)}
                      className={inputClass} style={{ fontSize: 14 }} dir="ltr" />
                  }
                />
                <FieldRow
                  icon={Building} label={arabicSource("common.section")} value={editData.department}
                  isEditing={isEditing}
                  editElement={
                    addingNewDept ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={newDeptName}
                          onChange={(e) => setNewDeptName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newDeptName.trim()) {
                              handleEditField("department", newDeptName.trim());
                              setAddingNewDept(false);
                              setNewDeptName("");
                            } else if (e.key === "Escape") {
                              setAddingNewDept(false);
                              setNewDeptName("");
                            }
                          }}
                          placeholder={arabicSource("shared.write_the_name_of_the_new_section")}
                          className={inputClass}
                          style={{ fontSize: 14 }}
                        />
                        <button
                          onClick={() => {
                            if (newDeptName.trim()) {
                              handleEditField("department", newDeptName.trim());
                              setAddingNewDept(false);
                              setNewDeptName("");
                            }
                          }}
                          disabled={!newDeptName.trim()}
                          className="p-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setAddingNewDept(false); setNewDeptName(""); }}
                          className="p-1.5 rounded-lg hover:bg-muted/30 text-muted-foreground transition-colors cursor-pointer shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <select
                        value={editData.department}
                        onChange={(e) => {
                          if (e.target.value === "__NEW__") {
                            setAddingNewDept(true);
                            setNewDeptName("");
                          } else {
                            handleEditField("department", e.target.value);
                          }
                        }}
                        className={inputClass}
                        style={{ fontSize: 14 }}
                      >
                        {allDepts.map(d => <option key={d} value={d}>{d}</option>)}
                        <option disabled style={{ borderTop: "1px solid var(--border)", fontSize: 11 }}>──────────</option>
                        <option value="__NEW__">{arabicSource("shared.add_a_new_section")}</option>
                      </select>
                    )
                  }
                />
                <FieldRow
                  icon={Briefcase} label={arabicSource("shared.job_title")} value={editData.position}
                  isEditing={isEditing}
                  editElement={
                    <input value={editData.position} onChange={(e) => handleEditField("position", e.target.value)}
                      className={inputClass} style={{ fontSize: 14 }} />
                  }
                />
                <FieldRow
                  icon={Mail} label={arabicSource("common.email")} value={editData.email} dir="ltr"
                  isEditing={isEditing}
                  editElement={
                    <input value={editData.email} onChange={(e) => handleEditField("email", e.target.value)}
                      className={inputClass} style={{ fontSize: 14 }} dir="ltr" />
                  }
                />
                <FieldRow
                  icon={Smartphone} iconColor="text-primary" label={arabicSource("shared.employee_phone")} value={editData.personalPhone} dir="ltr"
                  isEditing={isEditing}
                  editElement={
                    <input value={editData.personalPhone} onChange={(e) => handleEditField("personalPhone", e.target.value)}
                      className={inputClass} style={{ fontSize: 14 }} dir="ltr" />
                  }
                />
                <FieldRow
                  icon={PhoneCall} iconColor="text-primary" label={arabicSource("common.company_phone")} value={editData.companyPhone} dir="ltr"
                  isEditing={isEditing}
                  editElement={
                    <input value={editData.companyPhone} onChange={(e) => handleEditField("companyPhone", e.target.value)}
                      className={inputClass} style={{ fontSize: 14 }} dir="ltr" />
                  }
                />
                <FieldRow
                  icon={MapPin} iconColor="text-primary" label={arabicSource("common.address")} value={editData.address}
                  isEditing={isEditing}
                  editElement={
                    <input value={editData.address} onChange={(e) => handleEditField("address", e.target.value)}
                      className={inputClass} style={{ fontSize: 14 }} />
                  }
                />
                <FieldRow
                  icon={Wallet} iconColor="text-primary" label={arabicSource("common.salary")} value={formatCurrency(editData.salary, editData.currency || "IQD")} dir="ltr" highlight
                  isEditing={isEditing}
                  editElement={
                    <input type="number" value={editData.salary} onChange={(e) => handleEditField("salary", Number(e.target.value))}
                      className={inputClass} style={{ fontSize: 14 }} dir="ltr" />
                  }
                />
                <FieldRow
                  icon={CalendarCheck} iconColor="text-emerald-400" label={arabicSource("common.direct_date")} value={editData.startDate} dir="ltr"
                  isEditing={isEditing}
                  editElement={
                    <input type="date" value={editData.startDate} onChange={(e) => handleEditField("startDate", e.target.value)}
                      className={inputClass} style={{ fontSize: 14 }} dir="ltr" />
                  }
                />
                <FieldRow
                  icon={CalendarX} iconColor="text-destructive" label={arabicSource("shared.departure_date")}
                  value={editData.endDate || arabicSource("shared.still_working")} dir="ltr"
                  isEditing={isEditing}
                  editElement={
                    <input type="date" value={editData.endDate || ""} onChange={(e) => handleEditField("endDate", e.target.value || "")}
                      className={inputClass} style={{ fontSize: 14 }} dir="ltr" />
                  }
                />
                <FieldRow
                  icon={FileText} label={arabicSource("common.id_number")} value={editData.nationalId} dir="ltr"
                  isEditing={isEditing}
                  editElement={
                    <input value={editData.nationalId} onChange={(e) => handleEditField("nationalId", e.target.value)}
                      className={inputClass} style={{ fontSize: 14 }} dir="ltr" />
                  }
                />
                {/* Emergency Contact — special two-part row */}
                <div className="flex items-center gap-3 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <Phone className="w-5 h-5 text-destructive shrink-0" />
                  <span className="text-muted-foreground shrink-0 min-w-[110px]" style={{ fontSize: 13 }}>{arabicSource("shared.emergency_contact")}</span>
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex gap-3">
                        <input value={editData.emergencyContact} onChange={(e) => handleEditField("emergencyContact", e.target.value)}
                          placeholder={arabicSource("common.name")} className={inputClass} style={{ fontSize: 14 }} />
                        <input value={editData.emergencyPhone} onChange={(e) => handleEditField("emergencyPhone", e.target.value)}
                          placeholder={arabicSource("shared.no")} className={`${inputClass} max-w-[160px]`} style={{ fontSize: 14 }} dir="ltr" />
                      </div>
                    ) : (
                      <span className="text-foreground" style={{ fontSize: 14 }}>
                        {editData.emergencyContact} <span className="text-muted-foreground mx-1">—</span> <span dir="ltr">{editData.emergencyPhone}</span>
                      </span>
                    )}
                  </div>
                </div>
                <FieldRow
                  icon={ClipboardList} iconColor="text-destructive" label={arabicSource("shared.blood_type")} value={editData.bloodType} dir="ltr"
                  isEditing={isEditing}
                  editElement={
                    <select value={editData.bloodType} onChange={(e) => handleEditField("bloodType", e.target.value)}
                      className={inputClass} style={{ fontSize: 14 }}>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bt => (
                        <option key={bt} value={bt}>{bt}</option>
                      ))}
                    </select>
                  }
                />
                <FieldRow
                  icon={Users} iconColor="text-primary" label={arabicSource("common.direct_manager")} value={editData.managerName}
                  isEditing={isEditing}
                  editElement={
                    <select value={editData.managerId || ""} onChange={(e) => {
                      const val = e.target.value || null;
                      setEditData({ ...editData, managerId: val, managerName: val ? (allEmployees.find(emp => emp.dbId === val)?.name || "—") : arabicSource("common.no_manager") });
                    }}
                      className={inputClass} style={{ fontSize: 14 }}>
                      <option value="">{arabicSource("shared.without_a_direct_manager")}</option>
                      {allEmployees.map(emp => (
                        <option key={emp.dbId} value={emp.dbId}>{emp.name} ({emp.position})</option>
                      ))}
                    </select>
                  }
                />
              </motion.div>
            )}

            {/* Custodies tab */}
            {modalTab === "custodies" && (
              <motion.div
                key="custodies"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="px-6 py-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground" style={{ fontSize: 13 }}>
                    {arabicSource("shared.covenant_and_items_received_by_employee")}
                  </p>
                  {isEditing && (
                    <button
                      onClick={() => setShowAddCustody(prev => !prev)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors cursor-pointer"
                      style={{ fontSize: 12 }}
                    >
                      <PlusCircle className="w-4 h-4" />
                      {arabicSource("common.addition")}
                    </button>
                  )}
                </div>

                {/* Add Custody Form */}
                <AnimatePresence>
                  {showAddCustody && isEditing && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 space-y-3">
                        <p className="text-primary" style={{ fontSize: 13 }}>{arabicSource("shared.add_a_new_liability")}</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-muted-foreground block mb-1" style={{ fontSize: 11 }}>{arabicSource("shared.purpose_name")}</label>
                            <input
                              value={newCustody.item}
                              onChange={(e) => setNewCustody({ ...newCustody, item: e.target.value })}
                              placeholder={arabicSource("shared.example_portable_calculator")}
                              className={formInputClass}
                              style={{ fontSize: 13 }}
                            />
                          </div>
                          <div>
                            <label className="text-muted-foreground block mb-1" style={{ fontSize: 11 }}>{arabicSource("common.description")}</label>
                            <input
                              value={newCustody.description}
                              onChange={(e) => setNewCustody({ ...newCustody, description: e.target.value })}
                              placeholder={arabicSource("shared.example_dell_latitude_5540")}
                              className={formInputClass}
                              style={{ fontSize: 13 }}
                            />
                          </div>
                          <div>
                            <label className="text-muted-foreground block mb-1" style={{ fontSize: 11 }}>{arabicSource("shared.date_of_receipt")}</label>
                            <input
                              type="date"
                              value={newCustody.dateReceived}
                              onChange={(e) => setNewCustody({ ...newCustody, dateReceived: e.target.value })}
                              className={formInputClass}
                              style={{ fontSize: 13 }}
                              dir="ltr"
                            />
                          </div>
                          <div>
                            <label className="text-muted-foreground block mb-1" style={{ fontSize: 11 }}>{arabicSource("common.serial_number")}</label>
                            <input
                              value={newCustody.serialNumber}
                              onChange={(e) => setNewCustody({ ...newCustody, serialNumber: e.target.value })}
                              placeholder={arabicSource("shared.optional")}
                              className={formInputClass}
                              style={{ fontSize: 13 }}
                              dir="ltr"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={handleAddCustody}
                            disabled={!newCustody.item.trim()}
                            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ fontSize: 12 }}
                          >
                            <Check className="w-3.5 h-3.5" />
                            {arabicSource("common.confirm")}
                          </button>
                          <button
                            onClick={() => { setShowAddCustody(false); setNewCustody({ item: "", description: "", dateReceived: todayStr(), serialNumber: "" }); }}
                            className="px-3 py-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            style={{ fontSize: 12 }}
                          >
                            {arabicSource("common.cancel")}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {editData.custodies.length > 0 ? editData.custodies.map((custody) => (
                  <motion.div
                    key={custody.id}
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    className="p-4 rounded-xl bg-muted/10 border border-border/30 hover:border-primary/20 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
                          <Laptop className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-foreground" style={{ fontSize: 14 }}>{custody.item}</p>
                          <p className="text-muted-foreground mt-0.5" style={{ fontSize: 13 }}>{custody.description}</p>
                        </div>
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => handleDeleteCustody(custody.id)}
                          className="p-1.5 rounded-lg hover:bg-destructive/15 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-5 mt-3 ps-11">
                      <span className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: 12 }}>
                        <Calendar className="w-3.5 h-3.5" />
                        {arabicSource("shared.received_date")} <span dir="ltr" className="text-foreground">{custody.dateReceived}</span>
                      </span>
                      {custody.serialNumber && (
                        <span className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: 12 }}>
                          <Hash className="w-3.5 h-3.5" />
                          <span dir="ltr" className="text-foreground">{custody.serialNumber}</span>
                        </span>
                      )}
                    </div>
                  </motion.div>
                )) : !showAddCustody && (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Laptop className="w-10 h-10 mb-3 opacity-30" />
                    <p style={{ fontSize: 14 }}>{arabicSource("shared.there_are_no_receivables_recorded")}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ---- LEAVES TAB ---- */}
            {modalTab === "leaves" && (
              <motion.div
                key="leaves"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="px-6 py-5 space-y-4"
              >
                <p className="text-muted-foreground" style={{ fontSize: 13 }}>{arabicSource("shared.vacation_record")}</p>

                {editData.leaves.length > 0 ? (
                  <>
                    {editData.leaves.map((leave) => (
                      <motion.div
                        key={leave.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-muted/10 border border-border/30"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <CalendarCheck className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-foreground" style={{ fontSize: 14 }}>{leave.type}</span>
                          </div>
                          <span className={`px-2.5 py-1 rounded-md border ${leaveStatusColors[leave.status]}`} style={{ fontSize: 12 }}>
                            {leave.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-6 mt-3 ps-11">
                          <span className="text-muted-foreground" style={{ fontSize: 13 }}>
                            {arabicSource("shared.from")} <span dir="ltr" className="text-foreground ms-1">{leave.from}</span>
                          </span>
                          <span className="text-muted-foreground" style={{ fontSize: 13 }}>
                            {arabicSource("shared.to")} <span dir="ltr" className="text-foreground ms-1">{leave.to}</span>
                          </span>
                          <span className="text-primary" style={{ fontSize: 13 }}>
                            {leave.days} {arabicSource("common.days")}
                          </span>
                        </div>
                      </motion.div>
                    ))}

                    {/* Leave Summary */}
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mt-2">
                      <p className="text-muted-foreground mb-3" style={{ fontSize: 13 }}>{arabicSource("common.vacation_summary")}</p>
                      <div className="flex items-center gap-8">
                        <div>
                          <span className="text-foreground" style={{ fontSize: 22 }}>
                            {editData.leaves.reduce((s, l) => s + l.days, 0)}
                          </span>
                          <span className="text-muted-foreground ms-1.5" style={{ fontSize: 13 }}>{arabicSource("shared.user_days")}</span>
                        </div>
                        <div>
                          <span className="text-primary" style={{ fontSize: 22 }}>
                            {Math.max(0, 30 - editData.leaves.filter(l => l.status === arabicSource("common.agreed")).reduce((s, l) => s + l.days, 0))}
                          </span>
                          <span className="text-muted-foreground ms-1.5" style={{ fontSize: 13 }}>{arabicSource("common.days_left")}</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <CalendarCheck className="w-10 h-10 mb-3 opacity-30" />
                    <p style={{ fontSize: 14 }}>{arabicSource("shared.no_vacations_recorded")}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ---- ATTACHMENTS TAB ---- */}
            {modalTab === "attachments" && (
              <motion.div
                key="attachments"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="px-6 py-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground" style={{ fontSize: 13 }}>{arabicSource("shared.documents_and_attachments")}</p>
                  {isEditing && (
                    <button
                      onClick={() => setShowAddAttachment(prev => !prev)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors cursor-pointer"
                      style={{ fontSize: 12 }}
                    >
                      <PlusCircle className="w-4 h-4" />
                      {arabicSource("shared.lifting_attachment")}
                    </button>
                  )}
                </div>

                {/* Add Attachment Form */}
                <AnimatePresence>
                  {showAddAttachment && isEditing && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 space-y-3">
                        <p className="text-primary" style={{ fontSize: 13 }}>{arabicSource("shared.add_a_new_attachment")}</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-muted-foreground block mb-1" style={{ fontSize: 11 }}>{arabicSource("shared.document_name")}</label>
                            <input
                              value={newAttachment.name}
                              onChange={(e) => setNewAttachment({ ...newAttachment, name: e.target.value })}
                              placeholder={arabicSource("shared.example_graduation_certificate")}
                              className={formInputClass}
                              style={{ fontSize: 13 }}
                            />
                          </div>
                          <div>
                            <label className="text-muted-foreground block mb-1" style={{ fontSize: 11 }}>{arabicSource("shared.file_type")}</label>
                            <select
                              value={newAttachment.type}
                              onChange={(e) => setNewAttachment({ ...newAttachment, type: e.target.value })}
                              className={formInputClass}
                              style={{ fontSize: 13 }}
                            >
                              <option value="PDF">PDF</option>
                              <option value={arabicSource("common.image")}>{arabicSource("common.image")}</option>
                              <option value="Word">Word</option>
                              <option value="Excel">Excel</option>
                              <option value={arabicSource("common.other")}>{arabicSource("shared.i_see")}</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={handleAddAttachment}
                            disabled={!newAttachment.name.trim()}
                            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ fontSize: 12 }}
                          >
                            <Check className="w-3.5 h-3.5" />
                            {arabicSource("common.confirm")}
                          </button>
                          <button
                            onClick={() => { setShowAddAttachment(false); setNewAttachment({ name: "", type: "PDF" }); }}
                            className="px-3 py-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            style={{ fontSize: 12 }}
                          >
                            {arabicSource("common.cancel")}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {editData.attachments.length > 0 ? editData.attachments.map((att) => (
                  <motion.div
                    key={att.id}
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-muted/10 border border-border/30 hover:border-primary/20 transition-colors cursor-pointer"
                  >
                    <div className="p-2.5 rounded-lg bg-primary/10">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground truncate" style={{ fontSize: 14 }}>{att.name}</p>
                      <p className="text-muted-foreground mt-0.5" style={{ fontSize: 12 }}>
                        {att.type} — <span dir="ltr">{att.date}</span>
                      </p>
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => handleDeleteAttachment(att.id)}
                        className="p-1.5 rounded-lg hover:bg-destructive/15 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    )}
                  </motion.div>
                )) : !showAddAttachment && (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Paperclip className="w-10 h-10 mb-3 opacity-30" />
                    <p style={{ fontSize: 14 }}>{arabicSource("shared.no_attachments")}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Termination Dialog */}
      <AnimatePresence>
        {showTerminationDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4"
            onClick={() => !terminationLoading && setShowTerminationDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <ShieldOff className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-foreground">{arabicSource("shared.termination_of_employee_service")}</h3>
                  <p className="text-xs text-muted-foreground">{arabicSource("shared.do_you_want_to_remove_employee_data_from_the_fingerprint_device")}</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 mb-4">
                <p className="text-xs text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  {arabicSource("shared.all_employee_data_attendance_records_evaluations_salaries_will_r")}
                </p>
              </div>

              <div className="space-y-3 mb-5">
                {[
                  { key: "removeFace" as const, label: arabicSource("shared.remove_face_image"), icon: ScanFace, desc: arabicSource("shared.delete_facial_recognition_data") },
                  { key: "removeFingerprint" as const, label: arabicSource("shared.removing_fingerprints"), icon: Fingerprint, desc: arabicSource("shared.delete_fingerprint_data") },
                  { key: "removePerson" as const, label: arabicSource("shared.delete_the_account_from_the_device_completely"), icon: ShieldOff, desc: arabicSource("shared.permanently_remove_the_employee_from_the_fingerprint_device") },
                ].map(opt => (
                  <label key={opt.key} className="flex items-center gap-3 p-3 rounded-lg border border-border/30 hover:bg-muted/10 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={terminationOptions[opt.key]}
                      onChange={(e) => setTerminationOptions(prev => ({ ...prev, [opt.key]: e.target.checked }))}
                      className="w-4 h-4 rounded accent-red-500"
                    />
                    <opt.icon className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-foreground">{opt.label}</p>
                      <p className="text-[11px] text-muted-foreground">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {terminationResult && (
                <div className={`p-3 rounded-lg border mb-4 text-sm ${
                  terminationResult.includes(arabicSource("common.done")) ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                }`}>
                  {terminationResult}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleTermination}
                  disabled={terminationLoading || (!terminationOptions.removeFace && !terminationOptions.removeFingerprint && !terminationOptions.removePerson)}
                  className="flex-1 h-10 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {terminationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
                  {terminationLoading ? arabicSource("shared.removing") : arabicSource("shared.confirm_removal")}
                </button>
                <button
                  onClick={() => { setShowTerminationDialog(false); setTerminationResult(null); }}
                  disabled={terminationLoading}
                  className="flex-1 h-10 rounded-lg border border-border text-muted-foreground hover:bg-muted/20 transition-colors text-sm disabled:opacity-50"
                >
                  {arabicSource("shared.skip_keep_access")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
