import { useState, useMemo, useCallback } from "react";
import * as odooData from "@/shared/api/odooData";
import { SYNC_API } from "@/shared/constants";
import { arabicSource } from "@/i18n/source";
import type {
  DepartmentOption,
  Employee,
  EmployeeDetailModalTab,
  EmployeeDetailPanelProps,
  PositionOption,
} from "../types";
import { errorMessage } from "../utils/errorMessage";
import { useEmployeeAttachmentForm } from "./useEmployeeAttachmentForm";
import { useEmployeeCustodyForm } from "./useEmployeeCustodyForm";
import { useEmployeeTermination } from "./useEmployeeTermination";

const positionLabel = (p: { id: string; title_ar: string; title_en: string | null }): string =>
  p.title_ar || p.title_en || p.id;

export const useEmployeeDetailPanel = ({ employee, onSave, allEmployees = [], dbDepartments = [], designations = [], startInEditMode = false }: EmployeeDetailPanelProps) => {
  const [modalTab, setModalTab] = useState<EmployeeDetailModalTab>("info");
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [editData, setEditData] = useState<Employee>({ ...employee });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [addingNewDept, setAddingNewDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [creatingDept, setCreatingDept] = useState(false);

  const custodyForm = useEmployeeCustodyForm(employee.dbId);
  const attachmentForm = useEmployeeAttachmentForm(setEditData);
  const termination = useEmployeeTermination(employee, onSave);

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
  // department if it's missing there (e.g. deactivated department). Deduped by id —
  // the backend has returned duplicate rows for the same department before, and a
  // repeated id in the option list corrupts which entry a click actually resolves to.
  // Memoized so the array identity stays stable for the memoized tabs it is passed to.
  const allDepts = useMemo<DepartmentOption[]>(() => {
    const seen = new Set<string>();
    const depts: DepartmentOption[] = [];
    for (const d of dbDepartments) {
      if (seen.has(d.id)) continue;
      seen.add(d.id);
      depts.push(d);
    }
    if (resolvedDepartmentId && !seen.has(resolvedDepartmentId)) {
      depts.push({ id: resolvedDepartmentId, name: editData.department });
    }
    return depts;
  }, [dbDepartments, resolvedDepartmentId, editData.department]);

  // Same id-resolution safety net as department, applied to job title: the backend
  // field is `designation_id`, not free text, so a missing id must never become a
  // blind `null` on save.
  const resolvedPositionId = useMemo(() => {
    if (editData.positionId) return editData.positionId;
    return designations.find(p => positionLabel(p) === editData.position)?.id || null;
  }, [editData.positionId, editData.position, designations]);

  const allPositions = useMemo<PositionOption[]>(() => {
    const seen = new Set<string>();
    const positions: PositionOption[] = [];
    for (const p of designations) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      positions.push({ id: p.id, name: positionLabel(p) });
    }
    if (resolvedPositionId && !seen.has(resolvedPositionId)) {
      positions.push({ id: resolvedPositionId, name: editData.position });
    }
    return positions;
  }, [designations, resolvedPositionId, editData.position]);

  const handleEditField = useCallback((field: keyof Employee, value: string | number) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleDepartmentSelect = useCallback((deptId: string, deptName: string) => {
    setEditData(prev => ({ ...prev, departmentId: deptId, department: deptName }));
  }, []);

  const handlePositionSelect = useCallback((positionId: string, positionName: string) => {
    setEditData(prev => ({ ...prev, positionId, position: positionName }));
  }, []);

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
      // The backend returns `address` as a structured object ({street, city, ...}),
      // not a flat string — sending back a bare string silently failed to update
      // it. The employee list this form is built from doesn't carry the other
      // sub-fields, so spread whatever raw record we do have (in case a richer
      // fetch adds them later) and always overwrite `street`, the one line this
      // form edits.
      const address = {
        ...(editData.addressRaw && typeof editData.addressRaw === "object" ? editData.addressRaw : {}),
        street: editData.address || "",
      };

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
        designation_id: resolvedPositionId,
        address,
        // Odoo's underlying employee/partner record stores this as a flat
        // field, not nested under `address` — send both shapes since it's
        // unclear which one the update handler actually reads from.
        street: editData.address || "",
        // The read API returns this field as `identification_id`; send both
        // names since it's unclear which one the update handler consumes.
        national_id: editData.nationalId,
        identification_id: editData.nationalId,
        emergency_contact: editData.emergencyContact,
        emergency_phone: editData.emergencyPhone,
        blood_type: editData.bloodType || null,
        manager_id: editData.managerId || null,
      });

      setIsEditing(false);
      onSave?.(editData);

      // Trigger the termination flow when the employee status changes to ended.
      if (editData.status === arabicSource("common.finished") && employee.status !== arabicSource("common.finished")) {
        termination.setShowTerminationDialog(true);
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
  }, [editData, employee, onSave, resolvedDepartmentId, resolvedPositionId, termination.setShowTerminationDialog]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditData({ ...employee });
    custodyForm.setShowAddCustody(false);
    attachmentForm.setShowAddAttachment(false);
  }, [employee, custodyForm.setShowAddCustody, attachmentForm.setShowAddAttachment]);

  return {
    addingNewDept,
    allDepts,
    allPositions,
    creatingDept,
    editData,
    handleCancelEdit,
    handleCancelNewDept,
    handleConfirmNewDept,
    handleDepartmentSelect,
    handleEditField,
    handleManagerChange,
    handlePositionSelect,
    handleSave,
    isEditing,
    modalTab,
    newDeptName,
    resolvedDepartmentId,
    resolvedPositionId,
    saveError,
    saving,
    setAddingNewDept,
    setEditData,
    setIsEditing,
    setModalTab,
    setNewDeptName,
    ...custodyForm,
    ...attachmentForm,
    ...termination,
  };
};
