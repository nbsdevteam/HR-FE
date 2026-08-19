import { arabicSource } from "@/i18n/source";

export interface AttendanceRow {
  id: string;
  employeeId: string;
  employee: string;
  department: string;
  deviceNo: string;
  date: string;
  checkIn: string;
  checkOut: string;
  rawCheckIn: string | null;
  rawCheckOut: string | null;
  status: string;
  rawStatus: string;
  workHours: string;
  workHoursNum: number;
  source: "device" | "manual" | "system" | null;
  verifyMode: string | null;
  lateMinutes: number;
  autoCheckout: boolean;
  overtimeHours: number;
  breakMinutes: number;
  deptColor: string | null;
  excusedLate: boolean;
  excusedAbsence: boolean;
  excusedShortfall: boolean;
  excuseNote: string | null;
}

export type AttendanceSortKey =
  | "name"
  | "deviceNo"
  | "department"
  | "checkIn"
  | "checkOut"
  | "hours"
  | "status";

export type AttendanceViewMode = "list" | "kanban";

export type ExcuseForm = {
  late: boolean;
  absence: boolean;
  shortfall: boolean;
  note: string;
};

export type AttendanceEmployeeMap = Record<
  string,
  {
    name: string;
    dept: string;
    deviceNo: string;
    photo: string | null;
    position: string | null;
    deptColor?: string | null;
  }
>;

export type TodayAttendanceStats = {
  present: number;
  late: number;
  absent: number;
  leave: number;
  total: number;
  avgHours: string;
  autoCheckouts: number;
};

export type AttendanceStatusCountKey = "present" | "late" | "absent" | "leave";

export type DeviceInfo = {
  deviceName: string;
  model: string;
  serialNumber: string;
  firmwareVersion: string;
  macAddress: string;
};

export type DeviceCapacity = {
  person: { used: number; total: number };
  face: { used: number; total: number };
  fingerprint: { used: number; total: number };
  card: { used: number; total: number };
  event: { used: number; total: number };
};

export type DevicePerson = {
  employeeNo: string;
  name: string;
  userType: string;
  gender: string | null;
  numOfCard: number;
  numOfFP: number;
  numOfFace: number;
};

export type DeviceEvent = {
  employeeNo: string;
  name: string;
  time: string;
  verifyMode: string;
  cardNo: string;
  doorNo: number;
};

export type BiometricDevice = {
  id: string;
  name: string;
  model: string;
  ip_address: string;
  is_active: boolean;
};

export type DeviceManagementTab = "overview" | "persons" | "events" | "face";

export type DeviceFacePreview = {
  empNo: string;
  image: string;
};

export type MonthlyBreakdownEntry = {
  month: string;
  days: number;
  hours: number;
  overtime: number;
  late: number;
  absent: number;
};

export const dayNames: Record<string, string> = {
  sunday: arabicSource("common.sunday_2"), monday: arabicSource("common.monday"), tuesday: arabicSource("common.tuesday"),
  wednesday: arabicSource("common.wednesday"), thursday: arabicSource("common.thursday"), friday: arabicSource("common.friday"), saturday: arabicSource("common.saturday"),
};
