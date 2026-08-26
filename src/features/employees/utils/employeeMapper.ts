import type { Employee } from "@/features/employees";
import type { DbEmployee } from "@/shared/hooks";
import { empDisplayName, empNumber } from "@/shared/hooks";
import { indexBy } from "@/shared/utils/collections";
import { arabicSource } from "@/i18n/source";

/** `dbEmployee.id` → row, so manager resolution is a Map hit instead of a full scan. */
export type ManagerIndex = ReadonlyMap<string, DbEmployee>;

export const buildManagerIndex = (allEmployees: readonly DbEmployee[]): ManagerIndex =>
  indexBy(allEmployees, e => e.id);

export const toEmployee = (employee: DbEmployee, managerIndex: ManagerIndex): Employee => {
  const name = empDisplayName(employee);
  const joinDate = employee.join_date || (employee.created_at ? employee.created_at.substring(0, 10) : "");
  const statusMap: Record<string, string> = {
    [arabicSource("common.is_active")]: arabicSource("common.is_active"),
    [arabicSource("common.leave")]: arabicSource("common.leave"),
    [arabicSource("common.finished")]: arabicSource("common.finished"),
    [arabicSource("common.pending")]: arabicSource("common.pending"),
  } as const;
  const manager = employee.manager_id ? managerIndex.get(employee.manager_id) : null;

  return {
    id: employee.person_id,
    dbId: employee.id,
    employeeNumber: empNumber(employee.person_id),
    name,
    position: employee.position || employee.department || "—",
    positionId: employee.position_id || null,
    department: employee.department || arabicSource("common.not_specified"),
    departmentId: employee.department_id || null,
    email: employee.email || `${employee.name?.replace(/\s+/g, ".").toLowerCase() || "emp"}@company.iq`,
    personalPhone: employee.personal_phone || "—",
    companyPhone: employee.company_phone || "—",
    phone: employee.personal_phone || "—",
    joinDate,
    startDate: joinDate,
    endDate: employee.end_date || null,
    status: (statusMap[employee.status || arabicSource("common.is_active")] || arabicSource("common.is_active")) as Employee["status"],
    salary: employee.monthly_salary || 0,
    currency: employee.currency || "IQD",
    photo: employee.profile_picture || "",
    address: employee.address || "—",
    addressRaw: employee.address_raw ?? null,
    nationalId: employee.national_id || "—",
    emergencyContact: employee.emergency_contact || "—",
    emergencyPhone: employee.emergency_phone || "—",
    bloodType: employee.blood_type || "—",
    managerId: employee.manager_id || null,
    managerName: manager ? empDisplayName(manager) : arabicSource("common.no_manager"),
    custodies: [],
    leaves: [],
    attachments: [],
  };
};

/** Map a whole roster in O(N): the manager index is built once, not once per row. */
export const toEmployees = (allEmployees: readonly DbEmployee[]): Employee[] => {
  const managerIndex = buildManagerIndex(allEmployees);
  return allEmployees.map(e => toEmployee(e, managerIndex));
};
