import type { DbEmployeeAddress, DbPosition } from "@/shared/hooks";

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

export type CustodyStatus = "active" | "returned" | "damaged" | "lost";

export type Custody = {
  id: string;
  item: string;
  description: string;
  dateReceived: string;
  serialNumber?: string;
  status: CustodyStatus;
  notes: string;
  returnDate: string | null;
};

export type LeaveRecord = {
  id: number;
  type: string;
  from: string;
  to: string;
  days: number;
  status: string;
};

export type Attachment = {
  id: number;
  name: string;
  type: string;
  date: string;
};

export type Employee = {
  id: number;
  dbId: string; // actual DB id (TEXT) for Supabase updates
  employeeNumber: string;
  name: string;
  position: string;
  positionId: string | null;
  department: string;
  departmentId: string | null;
  email: string;
  personalPhone: string;
  companyPhone: string;
  phone: string;
  joinDate: string;
  startDate: string;
  endDate: string | null;
  status: string;
  salary: number;
  currency: string;
  photo: string;
  address: string;
  addressRaw: DbEmployeeAddress | string | null;
  nationalId: string;
  emergencyContact: string;
  emergencyPhone: string;
  bloodType: string;
  managerId: string | null;
  managerName: string;
  leaves: LeaveRecord[];
  attachments: Attachment[];
};

export type EmployeeOption = {
  dbId: string;
  name: string;
  position: string;
};

export type DepartmentOption = {
  id: string;
  name: string;
};

export type PositionOption = {
  id: string;
  name: string;
};

export type EmployeeDetailModalTab = "info" | "custodies" | "leaves" | "attachments";

export type EmployeeDetailPanelProps = {
  employee: Employee;
  onClose: () => void;
  onSave?: (saved?: Employee) => void;
  allEmployees?: EmployeeOption[];
  dbDepartments?: DepartmentOption[];
  designations?: DbPosition[];
};
