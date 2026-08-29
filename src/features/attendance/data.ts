import { arabicSource } from "@/i18n/source";
import { Calendar, Clock, UserCheck, UserX } from "lucide-react";
import type { AttendanceSortKey } from "./types";

export const attendanceLegendData = [
  { label: arabicSource("common.present"), dot: "bg-emerald-500" },
  { label: arabicSource("common.late"), dot: "bg-amber-400" },
  { label: arabicSource("attendance.login_only"), dot: "bg-orange-400" },
  { label: arabicSource("common.absence_2"), dot: "bg-destructive" },
  { label: arabicSource("common.leave"), dot: "bg-blue-400" },
  { label: arabicSource("common.a_day_of_rest"), dot: "bg-muted-foreground/30" },
];

export const kanbanColumns = [
  { key: arabicSource("common.present"), label: arabicSource("common.present"), accent: "border-emerald-500/40", textColor: "text-emerald-500", icon: UserCheck },
  { key: arabicSource("common.late"), label: arabicSource("common.late"), accent: "border-primary/40", textColor: "text-primary", icon: Clock },
  { key: arabicSource("common.absent"), label: arabicSource("common.absent"), accent: "border-destructive/40", textColor: "text-destructive", icon: UserX },
  { key: arabicSource("common.leave"), label: arabicSource("common.leave"), accent: "border-blue-500/40", textColor: "text-blue-500", icon: Calendar },
];

export const tableRowData = [
  arabicSource("common.employee_number"),
  arabicSource("common.name"),
  arabicSource("common.time"),
  arabicSource("devicemanagement.verification_method"),
  arabicSource("devicemanagement.card_number"),
  arabicSource("devicemanagement.the_door"),
]

export const attendanceMonthNamesByNumber: Record<string, string> = {
  "01": arabicSource("common.january"), "02": arabicSource("common.february"), "03": arabicSource("common.march"), "04": arabicSource("common.april"),
  "05": arabicSource("common.may"), "06": arabicSource("common.jun"), "07": arabicSource("common.july"), "08": arabicSource("common.august"),
  "09": arabicSource("common.september"), "10": arabicSource("common.october_additional"), "11": arabicSource("common.november"), "12": arabicSource("common.december"),
};

export const monthlyBreakdownTableHeadings = [
  arabicSource("attendance.month"),
  arabicSource("attendance.days"),
  arabicSource("common.hours_2"),
  arabicSource("attendance.average"),
  arabicSource("common.additional_label"),
  arabicSource("common.delay"),
  arabicSource("common.absence"),
];

export const attendanceStatusFilterOptions = [
  arabicSource("common.all"),
  arabicSource("common.present"),
  arabicSource("common.late"),
  arabicSource("common.absent"),
  arabicSource("common.leave"),
];

export const attendanceSortOptions: { key: AttendanceSortKey; label: string }[] = [
  { key: "checkIn", label: arabicSource("common.time") },
  { key: "name", label: arabicSource("common.name") },
  { key: "hours", label: arabicSource("common.hours_2") },
];

export const attendanceDayNamesShort: Record<string, string> = {
  sunday: arabicSource("common.sunday"), monday: arabicSource("attendance.two"), tuesday: arabicSource("attendance.tuesday"),
  wednesday: arabicSource("attendance.wed"), thursday: arabicSource("attendance.thursday"), friday: arabicSource("attendance.friday"), saturday: arabicSource("common.sat"),
};

export const dailyRecordsTableHeadings = [
  arabicSource("common.date"),
  arabicSource("common.today"),
  arabicSource("common.attendance"),
  arabicSource("common.dismissal"),
  arabicSource("common.hours_2"),
  arabicSource("common.additional_label"),
  arabicSource("common.status"),
];

// Ordered to match the `days` weekday-key array in ShiftDropZone.tsx
export const shiftDayLabelsAr = [
  arabicSource("common.sunday"),
  arabicSource("shared.monday"),
  arabicSource("shared.three"),
  arabicSource("shared.arb"),
  arabicSource("shared.khmi"),
  arabicSource("shared.plural"),
  arabicSource("common.sat"),
];