import { arabicSource } from "@/i18n/source";
import { Calendar, Clock, UserCheck, UserX } from "lucide-react";

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