import { arabicSource } from "@/i18n/source";

export const DAY_HEADERS = [
  { label: arabicSource("common.sunday_2"), dow: 0 },
  { label: arabicSource("common.monday"), dow: 1 },
  { label: arabicSource("common.tuesday"), dow: 2 },
  { label: arabicSource("common.wednesday"), dow: 3 },
  { label: arabicSource("common.thursday"), dow: 4 },
  { label: arabicSource("common.friday"), dow: 5 },
  { label: arabicSource("common.saturday"), dow: 6 },
];

export const LEGEND_ITEMS = [
  { label: arabicSource("common.present"), dot: "bg-emerald-500" },
  { label: arabicSource("payroll.shortage_of_hours_2"), dot: "bg-amber-400" },
  { label: arabicSource("common.absence_2"), dot: "bg-destructive" },
  { label: arabicSource("payroll.overtime_2"), dot: "bg-emerald-400" },
  { label: arabicSource("payroll.excuse_me"), dot: "bg-emerald-400" },
  { label: arabicSource("common.leave"), dot: "bg-blue-400" },
  { label: arabicSource("common.without_salary"), dot: "bg-orange-400" },
  {
    label: arabicSource("common.a_day_of_rest"),
    dot: "bg-muted-foreground/30",
  },
];

export const SHORTFALL_TABLE_HEADINGS = [
  arabicSource("common.date"),
  arabicSource("common.today"),
  arabicSource("common.attendance"),
  arabicSource("common.dismissal"),
  arabicSource("common.working_hours"),
  arabicSource("common.shortage"),
  arabicSource("common.status"),
];

export const sortByData = [
  { label: arabicSource("common.employee"), key: "employee_name" },
  { label: arabicSource("common.section"), key: "department_name" },
  { label: arabicSource("common.basic_salary"), key: "basic_salary" },
  { label: arabicSource("common.working_days"), key: "days_worked" },
  { label: arabicSource("common.working_hours"), key: "total_hours" },
  { label: arabicSource("common.overtime"), key: "overtime_hours" },
  { label: arabicSource("common.shortage"), key: "shortfall_hours" },
  { label: arabicSource("common.absence"), key: "absence_days" },
  { label: arabicSource("common.net_salary"), key: "net_salary" },
] as const;
