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
  status: string | string | string | string;
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

export const dayNames: Record<string, string> = {
  sunday: arabicSource("common.sunday_2"), monday: arabicSource("common.monday"), tuesday: arabicSource("common.tuesday"),
  wednesday: arabicSource("common.wednesday"), thursday: arabicSource("common.thursday"), friday: arabicSource("common.friday"), saturday: arabicSource("common.saturday"),
};
