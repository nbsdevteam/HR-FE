import type { DbEmployee, DbDepartment, DepartmentTreeNode, DepartmentMetadata } from "../../hooks";
import { sid, sornull, num, bool, empty, isActive } from "./mapHelpers";

export const mapEmployee = (r: any): DbEmployee => {
  const addressObj = r.address && typeof r.address === "object" ? r.address : null;
  const address =
    typeof r.address === "string"
      ? r.address
      : addressObj
        ? [addressObj.residence || addressObj.street, addressObj.city].filter(Boolean).join(", ")
        : null;
  return {
    id: sid(r.id),
    person_id: num(r.person_id),
    name: r.name || "",
    arabic_name: r.arabic_name || "",
    department: r.department_name || r.department || "",
    department_id: sornull(r.department_id),
    monthly_salary: num(r.monthly_salary),
    currency: r.currency || "IQD",
    overtime_rate: num(r.overtime_rate),
    overtime_enabled: bool(r.overtime_enabled),
    allowed_late_minutes: num(r.allowed_late_minutes),
    profile_picture: r.photo || r.profile_picture || null,
    position: r.designation_name || r.position || null,
    email: r.email || null,
    personal_phone: r.personal_phone || r.phone || null,
    company_phone: r.company_phone || null,
    join_date: r.joining_date || r.join_date || null,
    end_date: r.end_date || null,
    status: r.status || null,
    address,
    address_raw: r.address ?? null,
    work_location: r.work_location || "",
    national_id: r.identification_id || r.national_id || null,
    emergency_contact: r.emergency_contact || null,
    emergency_phone: r.emergency_phone || null,
    blood_type: r.blood_type || null,
    manager_id: sornull(r.manager_id),
    shift_id: sornull(r.shift_id),
    position_id: sornull(r.designation_id || r.position_id),
    direct_manager_id: sornull(r.manager_id || r.direct_manager_id),
    device_employee_no: r.device_employee_no || null,
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}

export const mapDepartment = (r: any): DbDepartment => {
  return {
    id: sid(r.id),
    legacy_id: r.legacy_id || "",
    name: r.name_ar || r.name || "",
    name_en: r.name || "",
    name_ar: r.name_ar || null,
    complete_name: r.complete_name || r.name || "",
    color: r.color || "#888888",
    description: r.description || null,
    manager_id: sornull(r.manager_id),
    default_shift_id: sornull(r.default_shift_id),
    parent_id: sornull(r.parent_id),
    parent_name: r.parent_name || null,
    sort_order: num(r.sort_order),
    employee_count: num(r.employee_count),
    is_active: isActive(r),
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}

export const mapDepartmentTree = (r: any): DepartmentTreeNode => {
  return {
    ...mapDepartment(r),
    total_employee_count: num(r.total_employee_count),
    children: Array.isArray(r.children) ? r.children.map(mapDepartmentTree) : [],
  };
}

export const mapDepartmentMetadata = (r: any): DepartmentMetadata => {
  return {
    shifts: r.shifts || [],
    canManage: bool(r.can_manage),
    canCreate: bool(r.can_create),
    canEdit: bool(r.can_edit),
    canDelete: bool(r.can_delete),
  };
}
