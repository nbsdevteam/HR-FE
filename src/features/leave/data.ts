import { arabicSource } from "@/i18n/source";

export const leaveData = [
  { label: arabicSource("common.employee"), key: "employee" },
  { label: arabicSource("leave.leave_type"), key: "type" },
  { label: arabicSource("common.from"), key: "start" },
  { label: arabicSource("common.to"), key: "end" },
  { label: arabicSource("common.duration"), key: "days" },
  { label: arabicSource("common.the_reason"), key: null },
  { label: arabicSource("common.status"), key: "status" },
  { label: arabicSource("common.procedures"), key: null },
] as const;
