import { useState, useCallback } from "react";
import * as odooData from "@/shared/api/odooData";
import { DEPARTMENTS, SYNC_API } from "@/shared/constants";
import { arabicSource } from "@/i18n/source";
import type {
  Attachment,
  Custody,
  Employee,
  EmployeeDetailModalTab,
  EmployeeDetailPanelProps,
} from "../types";

const departments: string[] = [...DEPARTMENTS];

const todayStr = () => new Date().toISOString().split("T")[0];

export const useEmployeeDetailPanel = ({ employee, onSave, allEmployees = [] }: EmployeeDetailPanelProps) => {
  const [modalTab, setModalTab] = useState<EmployeeDetailModalTab>("info");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Employee>({ ...employee });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [addingNewDept, setAddingNewDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");

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

  // Build the full department list: hardcoded + current employee's dept if not already included
  const allDepts = [...departments];
  if (employee.department && !allDepts.includes(employee.department)) {
    allDepts.push(employee.department);
  }
  if (editData.department && !allDepts.includes(editData.department)) {
    allDepts.push(editData.department);
  }

  const handleEditField = useCallback((field: keyof Employee, value: string | number) => {
    setEditData({ ...editData, [field]: value });
  }, [editData]);

  const handleManagerChange = useCallback((managerId: string | null) => {
    setEditData({
      ...editData,
      managerId,
      managerName: managerId ? (allEmployees.find(emp => emp.dbId === managerId)?.name || "—") : arabicSource("common.no_manager"),
    });
  }, [editData, allEmployees]);

  const handleConfirmNewDept = useCallback(() => {
    if (!newDeptName.trim()) return;
    handleEditField("department", newDeptName.trim());
    setAddingNewDept(false);
    setNewDeptName("");
  }, [newDeptName, handleEditField]);

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
        phone: editData.personalPhone || editData.companyPhone,
        monthly_salary: editData.salary,
        join_date: editData.startDate || null,
        status: editData.status,
        address: editData.address || null,
        national_id: editData.nationalId,
        emergency_contact: editData.emergencyContact,
        emergency_phone: editData.emergencyPhone,
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
    } catch (e: any) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  }, [editData, employee, onSave]);

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
  }, [newCustody, editData]);

  const handleCancelAddCustody = useCallback(() => {
    setShowAddCustody(false);
    setNewCustody({ item: "", description: "", dateReceived: todayStr(), serialNumber: "" });
  }, []);

  const handleDeleteCustody = useCallback((id: number) => {
    setEditData({ ...editData, custodies: editData.custodies.filter(c => c.id !== id) });
  }, [editData]);

  // ---- Attachment handlers ----
  const handleAddAttachment = useCallback(() => {
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
  }, [newAttachment, editData]);

  const handleCancelAddAttachment = useCallback(() => {
    setShowAddAttachment(false);
    setNewAttachment({ name: "", type: "PDF" });
  }, []);

  const handleDeleteAttachment = useCallback((id: number) => {
    setEditData({ ...editData, attachments: editData.attachments.filter(a => a.id !== id) });
  }, [editData]);

  return {
    addingNewDept,
    allDepts,
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
    handleEditField,
    handleManagerChange,
    handleSave,
    handleTermination,
    isEditing,
    modalTab,
    newAttachment,
    newCustody,
    newDeptName,
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
