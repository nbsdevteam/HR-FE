import type { DbEmployee, DbDepartment } from "../../hooks";
import { sid, sornull, num, bool, empty } from "./mapHelpers";

export const mapEmployee = (r: any): DbEmployee => {
  const address =
    typeof r.address === "string"
      ? r.address
      : r.address
        ? [r.address.street, r.address.street2, r.address.city].filter(Boolean).join(", ")
        : null;
  return {
    id: sid(r.id),
    person_id: num(r.person_id),
    name: r.name || "",
    arabic_name: r.arabic_name || "",
    department: r.department_name || r.department || "",
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
    name: r.name_ar || r.name || "",
    color: r.color || "#888888",
    description: r.description || null,
    manager_id: sornull(r.manager_id),
    default_shift_id: sornull(r.default_shift_id),
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}
