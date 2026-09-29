import type { DbEmployeeAddress, DbPosition, DeviceEnrollment } from "@/shared/hooks";

export type { DeviceCredentialKind, DeviceEnrollment, DeviceEnrollmentState, EmployeeStatusCode } from "@/shared/hooks";

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

export type WorkLocation = "local" | "remote" | "";

export type EmployeeAddForm = {
  name: string;
  email: string;
  personalPhone: string;
  companyPhone: string;
  designationId: string;
  departmentId: string;
  salary: string;
  joinDate: string;
  birthDate: string;
  nationalId: string;
  gender: "male" | "female";
  managerId: string;
  nationality: string;
  country: string;
  countryId: string;
  state: string;
  stateId: string;
  city: string;
  cityId: string;
  residence: string;
  workLocation: WorkLocation;
  /** Manual entry — no reader hardware integration; sent only to device-sync, never to Odoo (backend §3). */
  cardNumber: string;
  /** Capture-on-terminal toggle; no client-side biometric data at all (backend §3/§6). */
  enrollFingerprint: boolean;
};

export type DeleteEmployeeTarget = {
  id: string;
  name: string;
};

/** Counts returned by an `employee_in_use` refusal — direct reports / managed departments (backend §3.2). */
export type EmployeeInUseGuard = {
  reportCount: number;
  departmentCount: number;
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
  /**
   * The Hikvision terminal number, independent of `id`/`employeeNumber`
   * (person_id) since they diverge post-B.5 (Hikvision employee-number
   * hand-off §1). `null` means the employee has no device number — not yet
   * enrolled — and every device call must be skipped, never fall back to
   * `id`.
   */
  deviceEmployeeNo: string | null;
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
  /** ISO `YYYY-MM-DD`, or "" when no birth date is on file. */
  birthDate: string;
  endDate: string | null;
  status: string;
  salary: number;
  currency: string;
  photo: string;
  address: string;
  addressRaw: DbEmployeeAddress | string | null;
  country: string;
  countryId: string;
  state: string;
  stateId: string;
  city: string;
  cityId: string;
  residence: string;
  workLocation: WorkLocation;
  nationalId: string;
  emergencyContact: string;
  emergencyPhone: string;
  bloodType: string;
  managerId: string | null;
  managerName: string;
  leaves: LeaveRecord[];
  attachments: Attachment[];
  /** Locked profile while deactivated — hide Edit/Enrol/Retry, render every tab view-only (backend §5). */
  readOnly: boolean;
  deviceEnrollment: DeviceEnrollment | null;
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

export type EmployeeDetailModalTab =
  | "info"
  | "custodies"
  | "leaves"
  | "attachments";

export type EmployeeDetailPanelProps = {
  employee: Employee;
  onClose: () => void;
  onSave?: (saved?: Employee) => void;
  allEmployees?: EmployeeOption[];
  dbDepartments?: DepartmentOption[];
  designations?: DbPosition[];
  startInEditMode?: boolean;
};

export interface ReadonlyArray {
  label: string;
  key: EmployeeSortKey | null;
  center?: boolean;
}
