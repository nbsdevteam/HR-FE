import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import type { Employee, EmployeeOption } from "@/features/employees";
import { empDisplayName, useEmployees, usePositions } from "@/shared/hooks";
import type { DbDepartment } from "@/shared/hooks";
import * as odooData from "@/shared/api/odooData";
import { SYNC_API } from "@/shared/constants";
import { localizedAlert } from "@/i18n/native";
import { arabicSource } from "@/i18n/source";
import { toEmployee } from "../utils/employeeMapper";
import type { DeleteEmployeeTarget, DeviceSyncStatus, EmployeeAddForm, EmployeeSortKey, EmployeeViewMode } from "../types";

const defaultAddForm: EmployeeAddForm = {
  name: "",
  email: "",
  personalPhone: "",
  companyPhone: "",
  designationId: "",
  address: "",
  departmentId: "",
  salary: "",
  joinDate: "",
  nationalId: "",
  gender: "male",
};

export const useEmployeesPage = () => {
  const { employees: dbEmployees, loading: dbLoading, refetch } = useEmployees();
  const { positions: designations } = usePositions();

  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState(arabicSource("common.all"));
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [viewMode, setViewMode] = useState<EmployeeViewMode>("list");
  const [sortBy, setSortBy] = useState<EmployeeSortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [addForm, setAddForm] = useState<EmployeeAddForm>(defaultAddForm);
  const [addSaving, setAddSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteEmployeeTarget | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [deviceSyncStatus, setDeviceSyncStatus] = useState<DeviceSyncStatus>("idle");
  const [nextEmployeeId, setNextEmployeeId] = useState<number | null>(null);
  const [loadingNextId, setLoadingNextId] = useState(false);
  const [facePhotoBase64, setFacePhotoBase64] = useState<string | null>(null);
  const [facePhotoPreview, setFacePhotoPreview] = useState<string | null>(null);
  const [dbDepartmentOptions, setDbDepartmentOptions] = useState<DbDepartment[]>([]);
  const closeAddTimeoutRef = useRef<number | null>(null);

  const designationOptions = useMemo(
    () => addForm.departmentId
      ? designations.filter(p => !p.department_id || p.department_id === addForm.departmentId)
      : designations,
    [designations, addForm.departmentId],
  );

  const allEmployees = useMemo(() => dbEmployees.map(e => toEmployee(e, dbEmployees)), [dbEmployees]);

  const employeeOptions: EmployeeOption[] = useMemo(() =>
    dbEmployees.map(e => ({
      dbId: e.id,
      name: empDisplayName(e),
      position: e.position || e.department || "—",
    })), [dbEmployees]);

  const realDepts = useMemo(() => {
    const depts = new Set(allEmployees.map(e => e.department));
    return [arabicSource("common.all"), ...Array.from(depts)];
  }, [allEmployees]);

  const deviceSyncedSet = useMemo(() => {
    const set = new Set<number>();
    dbEmployees.forEach(e => {
      if (e.device_employee_no) set.add(e.person_id);
    });
    return set;
  }, [dbEmployees]);

  const pendingEmployees = useMemo(() => {
    return new Set(dbEmployees.filter(e => e.status === arabicSource("common.pending")).map(e => e.person_id));
  }, [dbEmployees]);

  const filtered = useMemo(() => {
    const list = allEmployees.filter(emp => {
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
      if (sortBy === "salary") return dir * (a.salary - b.salary);
      return 0;
    });
    return list;
  }, [allEmployees, search, selectedDept, sortBy, sortDir]);

  const kanbanDepts = useMemo(
    () => realDepts.filter(dept => dept !== arabicSource("common.all")),
    [realDepts],
  );

  const selectedEmployeeOptions = useMemo(
    () => selectedEmployee ? employeeOptions.filter(e => e.dbId !== selectedEmployee.dbId) : employeeOptions,
    [employeeOptions, selectedEmployee],
  );

  const resetAddForm = useCallback(() => {
    setAddForm(defaultAddForm);
    setAddError(null);
    setDeviceSyncStatus("idle");
    setNextEmployeeId(null);
    setFacePhotoBase64(null);
    setFacePhotoPreview(null);
  }, []);

  const fetchNextId = useCallback(async () => {
    setLoadingNextId(true);
    try {
      const res = await fetch(`${SYNC_API}/device/next-employee-id`);
      const data = await res.json();
      if (data.success) setNextEmployeeId(data.nextId);
      else {
        const maxPerson = dbEmployees.reduce((max, e) => Math.max(max, e.person_id || 0), 0);
        setNextEmployeeId(maxPerson + 1);
      }
    } catch {
      const maxPerson = dbEmployees.reduce((max, e) => Math.max(max, e.person_id || 0), 0);
      setNextEmployeeId(maxPerson + 1);
    }
    setLoadingNextId(false);
  }, [dbEmployees]);

  const openAddModal = useCallback(() => {
    setShowAddModal(true);
    void fetchNextId();
  }, [fetchNextId]);

  const closeAddModal = useCallback(() => {
    if (addSaving) return;
    setShowAddModal(false);
    resetAddForm();
  }, [addSaving, resetAddForm]);

  const updateAddForm = useCallback((updates: Partial<EmployeeAddForm>) => {
    setAddForm(current => ({ ...current, ...updates }));
  }, []);

  const handleClearFacePhoto = useCallback(() => {
    setFacePhotoPreview(null);
    setFacePhotoBase64(null);
  }, []);

  const handleFacePhoto = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFacePhotoPreview(result);
      setFacePhotoBase64(result.split(",")[1] || "");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAddEmployee = useCallback(async () => {
    if (!addForm.name.trim()) { setAddError(arabicSource("employees.name_required")); return; }
    if (!nextEmployeeId) { setAddError(arabicSource("employees.employee_number_not_specified")); return; }
    setAddSaving(true);
    setAddError(null);

    try {
      const newPersonId = nextEmployeeId;

      await odooData.createEmployee({
        name: addForm.name,
        email: addForm.email || null,
        personal_phone: addForm.personalPhone || null,
        phone: addForm.personalPhone || addForm.companyPhone || null,
        address: addForm.address || null,
        monthly_salary: parseFloat(addForm.salary) || 0,
        join_date: addForm.joinDate || null,
        national_id: addForm.nationalId || null,
        status: "active",
        person_id: newPersonId,
        device_employee_no: String(newPersonId),
        gender: addForm.gender || null,
        department_id: addForm.departmentId || null,
        designation_id: addForm.designationId || null,
      });

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

      refetch();
      closeAddTimeoutRef.current = window.setTimeout(() => {
        setShowAddModal(false);
        resetAddForm();
      }, 1500);
    } catch (error: any) {
      setAddError(error.message);
    }
    setAddSaving(false);
  }, [addForm, facePhotoBase64, nextEmployeeId, refetch, resetAddForm]);

  const handleDeleteEmployee = useCallback(async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const dbEmp = dbEmployees.find(e => e.id === deleteConfirm.id);
      if (dbEmp?.device_employee_no) {
        try {
          await fetch(`${SYNC_API}/device/persons/${dbEmp.device_employee_no}`, { method: "DELETE" });
        } catch {
          // Device removal is best-effort.
        }
      }
      await odooData.setEmployeeStatus(deleteConfirm.id, "suspended");
      refetch();
      setDeleteConfirm(null);
    } catch (error: any) {
      console.error("Delete failed:", error.message);
      localizedAlert(arabicSource("employees.error_deleting_employee") + " " + error.message);
    }
    setDeleting(false);
  }, [dbEmployees, deleteConfirm, refetch]);

  const closeDeleteModal = useCallback(() => setDeleteConfirm(null), []);

  const handleDetailClose = useCallback(() => setSelectedEmployee(null), []);

  const handleDetailSave = useCallback(() => {
    refetch();
    setSelectedEmployee(null);
  }, [refetch]);

  useEffect(() => {
    odooData.fetchDepartments().then(setDbDepartmentOptions).catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      if (closeAddTimeoutRef.current) window.clearTimeout(closeAddTimeoutRef.current);
    };
  }, []);

  return {
    addError,
    addForm,
    addSaving,
    allEmployees,
    closeAddModal,
    closeDeleteModal,
    dbDepartmentOptions,
    dbEmployees,
    dbLoading,
    deleteConfirm,
    deleting,
    designationOptions,
    deviceSyncedSet,
    deviceSyncStatus,
    employeeOptions: selectedEmployeeOptions,
    facePhotoPreview,
    filtered,
    handleAddEmployee,
    handleClearFacePhoto,
    handleDeleteEmployee,
    handleDetailClose,
    handleDetailSave,
    handleFacePhoto,
    kanbanDepts,
    loadingNextId,
    nextEmployeeId,
    openAddModal,
    pendingEmployees,
    realDepts,
    search,
    selectedDept,
    selectedEmployee,
    setDeleteConfirm,
    setSearch,
    setSelectedDept,
    setSelectedEmployee,
    setSortBy,
    setSortDir,
    setViewMode,
    showAddModal,
    sortBy,
    sortDir,
    updateAddForm,
    viewMode,
  };
};
