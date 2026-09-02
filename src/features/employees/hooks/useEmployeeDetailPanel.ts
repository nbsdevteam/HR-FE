import { useState, useMemo, useCallback } from "react";
import * as odooData from "@/shared/api/odooData";
import { SYNC_API } from "@/shared/constants";
import { todayInBaghdad } from "@/shared/utils/timezone";
import { arabicSource } from "@/i18n/source";
import type {
  DepartmentOption,
  Employee,
  EmployeeDetailModalTab,
  EmployeeDetailPanelProps,
  PositionOption,
} from "../types";
import { birthDateFieldError } from "../utils/birthDate";
import { employeeFieldErrors, NO_EMPLOYEE_FIELD_ERRORS, type EmployeeFieldErrors } from "../utils/employeeFieldErrors";
import { errorMessage } from "../utils/errorMessage";
import { buildEmployeeUpdatePayload } from "../utils/employeeUpdatePayload";
import { photoFieldError } from "../utils/photoFieldError";
import { useEmployeeAddressForm } from "./useEmployeeAddressForm";
import { useEmployeeAttachmentForm } from "./useEmployeeAttachmentForm";
import { useEmployeeCustodyForm } from "./useEmployeeCustodyForm";
import { useEmployeeLeaves } from "./useEmployeeLeaves";
import { useEmployeeTermination } from "./useEmployeeTermination";

const positionLabel = (p: { id: string; title_ar: string; title_en: string | null }): string =>
  p.title_ar || p.title_en || p.id;

export const useEmployeeDetailPanel = ({ employee, onSave, allEmployees = [], dbDepartments = [], designations = [], startInEditMode = false }: EmployeeDetailPanelProps) => {
  const [modalTab, setModalTab] = useState<EmployeeDetailModalTab>("info");
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [editData, setEditData] = useState<Employee>({ ...employee });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [birthDateError, setBirthDateError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<EmployeeFieldErrors>(NO_EMPLOYEE_FIELD_ERRORS);
  const [addingNewDept, setAddingNewDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [creatingDept, setCreatingDept] = useState(false);

  const custodyForm = useEmployeeCustodyForm(employee.dbId);
  const attachmentForm = useEmployeeAttachmentForm(setEditData);
  const leavesData = useEmployeeLeaves(employee.dbId);
  const termination = useEmployeeTermination(employee, onSave);
  const addressForm = useEmployeeAddressForm(isEditing, editData, setEditData);

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
    // Editing the date clears the rejection it caused, so a stale message never
    // sits under an input the user has already corrected.
    if (field === "birthDate") setBirthDateError(null);
    setEditData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Picking or clearing a photo clears the rejection it caused, so a stale
  // message never sits under an avatar the user has already corrected.
  const handlePhotoChange = useCallback((photo: string) => {
    setPhotoError(null);
    setEditData(prev => ({ ...prev, photo }));
  }, []);

  // Re-picking either foreign key clears the "no longer exists" rejection the
  // previous choice produced, so a stale message never sits under a select the
  // user has already corrected.
  const handleDepartmentSelect = useCallback((deptId: string, deptName: string) => {
    setFieldErrors(prev => ({ ...prev, department: null }));
    setEditData(prev => ({ ...prev, departmentId: deptId, department: deptName }));
  }, []);

  const handlePositionSelect = useCallback((positionId: string, positionName: string) => {
    setFieldErrors(prev => ({ ...prev, designation: null }));
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
    if (editData.startDate && editData.startDate > todayInBaghdad()) {
      setSaveError(arabicSource("employees.join_date_cannot_be_in_the_future"));
      return;
    }
    // The picker is already capped at today; this catches a typed-in date and
    // keeps `birth_date_in_future` a backstop rather than a round trip.
    if (editData.birthDate && editData.birthDate > todayInBaghdad()) {
      setBirthDateError(arabicSource("employees.birth_date_cannot_be_in_the_future"));
      return;
    }
    setSaving(true);
    setSaveError(null);
    setBirthDateError(null);
    setPhotoError(null);
    setFieldErrors(NO_EMPLOYEE_FIELD_ERRORS);
    try {
      await odooData.updateEmployee(
        editData.dbId,
        buildEmployeeUpdatePayload(editData, employee, resolvedDepartmentId, resolvedPositionId),
      );

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
      // A rejected birth date writes *nothing* — not one field of the patch —
      // so the message has to point at the input that has to be fixed and
      // resubmitted, rather than reading as a generic save failure.
      const birthError = birthDateFieldError(e);
      // A rejected `department_id`/`designation_id` writes nothing either
      // (backend §4) — usually a dropdown option deleted in another tab — so it
      // belongs on the select the user has to change, not in the form-level box.
      const rejectedFields = employeeFieldErrors(e);
      // A rejected photo also writes nothing (backend photo spec), so it
      // belongs under the avatar control rather than the form-level box.
      const photoErr = photoFieldError(e);
      if (birthError) setBirthDateError(birthError);
      else if (photoErr) setPhotoError(photoErr);
      else if (rejectedFields) setFieldErrors(rejectedFields);
      else setSaveError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }, [editData, employee, onSave, resolvedDepartmentId, resolvedPositionId, termination.setShowTerminationDialog]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setBirthDateError(null);
    setPhotoError(null);
    setFieldErrors(NO_EMPLOYEE_FIELD_ERRORS);
    setEditData({ ...employee });
    custodyForm.setShowAddCustody(false);
    attachmentForm.setShowAddAttachment(false);
  }, [employee, custodyForm.setShowAddCustody, attachmentForm.setShowAddAttachment]);

  return {
    addingNewDept,
    allDepts,
    allPositions,
    birthDateError,
    creatingDept,
    editData,
    fieldErrors,
    handleCancelEdit,
    handleCancelNewDept,
    handleConfirmNewDept,
    handleDepartmentSelect,
    handleEditField,
    handleManagerChange,
    handlePhotoChange,
    handlePositionSelect,
    handleSave,
    isEditing,
    modalTab,
    newDeptName,
    photoError,
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
    ...leavesData,
    ...addressForm,
    ...termination,
  };
};
