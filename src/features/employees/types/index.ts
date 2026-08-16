export type EmployeeViewMode = "list" | "kanban";

export type EmployeeSortKey =
  | "name"
  | "employeeNumber"
  | "deviceNo"
  | "department"
  | "position"
  | "status"
  | "joinDate"
  | "salary";

export type EmployeeAddForm = {
  name: string;
  email: string;
  personalPhone: string;
  companyPhone: string;
  designationId: string;
  address: string;
  departmentId: string;
  salary: string;
  joinDate: string;
  nationalId: string;
  gender: "male" | "female";
};

export type DeviceSyncStatus = "idle" | "syncing" | "success" | "error";

export type DeleteEmployeeTarget = {
  id: string;
  name: string;
};
