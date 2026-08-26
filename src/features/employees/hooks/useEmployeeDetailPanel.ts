import { useState, useMemo, useCallback } from "react";
import * as odooData from "@/shared/api/odooData";
import { SYNC_API } from "@/shared/constants";
import { arabicSource } from "@/i18n/source";
import type {
  Attachment,
  Custody,
  DepartmentOption,
  Employee,
  EmployeeDetailModalTab,
  EmployeeDetailPanelProps,
} from "../types";
import { errorMessage } from "../utils/errorMessage";

const todayStr = () => new Date().toISOString().split("T")[0];

export const useEmployeeDetailPanel = ({ employee, onSave, allEmployees = [], dbDepartments = [] }: EmployeeDetailPanelProps) => {
  const [modalTab, setModalTab] = useState<EmployeeDetailModalTab>("info");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Employee>({ ...employee });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [addingNewDept, setAddingNewDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [creatingDept, setCreatingDept] = useState(false);

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

  // Some endpoints (list/search) may only carry the department name, not its
  // numeric id, on a given row. Resolve the id from the backend department list
  // by name in that case, so the dropdown still shows the right selection and
  // `handleSave` never sends a stray `department_id: null` that would wipe out
  // an employee's real department just because this one field is unresolved.
  const resolvedDepartmentId = useMemo(() => {
    if (editData.departmentId) return editData.departmentId;
    return dbDepartments.find(d => d.name === editData.department)?.id || null;
  }, [editData.departmentId, editData.department, dbDepartments]);

  // Build the full department list from the backend, plus the employee's current
  // department if it's missing there (e.g. deactivated department). Memoized so the
  // array identity stays stable for the memoized tabs it is passed to.
  const allDepts = useMemo<DepartmentOption[]>(() => {
    const depts = [...dbDepartments];
    if (resolvedDepartmentId && !depts.some(d => d.id === resolvedDepartmentId)) {
      depts.push({ id: resolvedDepartmentId, name: editData.department });
    }
    return depts;
  }, [dbDepartments, resolvedDepartmentId, editData.department]);

  const handleEditField = useCallback((field: keyof Employee, value: string | number) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleDepartmentSelect = useCallback((deptId: string) => {
    const dept = allDepts.find(d => d.id === deptId);
    if (!dept) return;
    setEditData(prev => ({ ...prev, departmentId: dept.id, department: dept.name }));
  }, [allDepts]);

  const handleManagerChange = useCallback((managerId: string | null) => {
    setEditData(prev => ({
      ...prev,
      managerId,
      managerName: managerId ? (allEmployees.find(emp => emp.dbId === managerId)?.name || "—") : arabicSource("common.no_manager"),
    }));
  }, [allEmployees]);

  const handleConfirmNewDept = useCallback(async () => {
    const name = newDeptName.trim();
    if (!name) return;
    setCreatingDept(true);
    setSaveError(null);
    try {
      const created: any = await odooData.createDepartment({ name });
      const id = String(created?.data?.id ?? "");
      setEditData(prev => ({ ...prev, departmentId: id || null, department: name }));
      setAddingNewDept(false);
      setNewDeptName("");
    } catch (e: unknown) {
      setSaveError(errorMessage(e));
    } finally {
      setCreatingDept(false);
    }
  }, [newDeptName]);

  const handleCancelNewDept = useCallback(() => {
    setAddingNewDept(false);
    setNewDeptName("");
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await odooData.updateEmployee(editData.dbId, {
        name: editData.name,
        email: editData.email,
        personal_phone: editData.personalPhone,
        company_phone: editData.companyPhone,
        phone: editData.personalPhone || editData.companyPhone,
        monthly_salary: editData.salary,
        join_date: editData.startDate || null,
        end_date: editData.endDate || null,
        status: editData.status,
        department_id: resolvedDepartmentId,
        address: editData.address || null,
        national_id: editData.nationalId,
        emergency_contact: editData.emergencyContact,
        emergency_phone: editData.emergencyPhone,
        blood_type: editData.bloodType || null,
        manager_id: editData.managerId || null,
      });

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
    } catch (e: unknown) {
      setSaveError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }, [editData, employee, onSave, resolvedDepartmentId]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditData({ ...employee });
    setShowAddCustody(false);
    setShowAddAttachment(false);
  }, [employee]);

  const handleTermination = useCallback(async () => {
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
  }, [employee, terminationOptions, onSave]);

  const handleCloseTerminationDialog = useCallback(() => {
    setShowTerminationDialog(false);
    setTerminationResult(null);
  }, []);

  // ---- Custody handlers ----
  const handleAddCustody = useCallback(() => {
    if (!newCustody.item.trim()) return;
    setEditData(prev => {
      const nextId = prev.custodies.length > 0 ? Math.max(...prev.custodies.map(c => c.id)) + 1 : 1;
      const custody: Custody = {
        id: nextId,
        item: newCustody.item.trim(),
        description: newCustody.description.trim(),
        dateReceived: newCustody.dateReceived,
        ...(newCustody.serialNumber.trim() ? { serialNumber: newCustody.serialNumber.trim() } : {}),
      };
      return { ...prev, custodies: [...prev.custodies, custody] };
    });
    setNewCustody({ item: "", description: "", dateReceived: todayStr(), serialNumber: "" });
    setShowAddCustody(false);
  }, [newCustody]);

  const handleCancelAddCustody = useCallback(() => {
    setShowAddCustody(false);
    setNewCustody({ item: "", description: "", dateReceived: todayStr(), serialNumber: "" });
  }, []);

  const handleDeleteCustody = useCallback((id: number) => {
    setEditData(prev => ({ ...prev, custodies: prev.custodies.filter(c => c.id !== id) }));
  }, []);

  // ---- Attachment handlers ----
  const handleAddAttachment = useCallback(() => {
    if (!newAttachment.name.trim()) return;
    setEditData(prev => {
      const nextId = prev.attachments.length > 0 ? Math.max(...prev.attachments.map(a => a.id)) + 1 : 1;
      const att: Attachment = {
        id: nextId,
        name: newAttachment.name.trim(),
        type: newAttachment.type,
        date: todayStr(),
      };
      return { ...prev, attachments: [...prev.attachments, att] };
    });
    setNewAttachment({ name: "", type: "PDF" });
    setShowAddAttachment(false);
  }, [newAttachment]);

  const handleCancelAddAttachment = useCallback(() => {
    setShowAddAttachment(false);
    setNewAttachment({ name: "", type: "PDF" });
  }, []);

  const handleDeleteAttachment = useCallback((id: number) => {
    setEditData(prev => ({ ...prev, attachments: prev.attachments.filter(a => a.id !== id) }));
  }, []);

  return {
    addingNewDept,
    allDepts,
    creatingDept,
    editData,
    handleAddAttachment,
    handleAddCustody,
    handleCancelAddAttachment,
    handleCancelAddCustody,
    handleCancelEdit,
    handleCancelNewDept,
    handleCloseTerminationDialog,
    handleConfirmNewDept,
    handleDeleteAttachment,
    handleDeleteCustody,
    handleDepartmentSelect,
    handleEditField,
    handleManagerChange,
    handleSave,
    handleTermination,
    isEditing,
    modalTab,
    newAttachment,
    newCustody,
    newDeptName,
    resolvedDepartmentId,
    saveError,
    saving,
    setAddingNewDept,
    setEditData,
    setIsEditing,
    setModalTab,
    setNewAttachment,
    setNewCustody,
    setNewDeptName,
    setShowAddAttachment,
    setShowAddCustody,
    setTerminationOptions,
    showAddAttachment,
    showAddCustody,
    showTerminationDialog,
    terminationLoading,
    terminationOptions,
    terminationResult,
  };
};
