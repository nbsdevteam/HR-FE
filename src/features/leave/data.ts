import { arabicSource } from "@/i18n/source";
import type { SortDefaults } from "@/shared/components/SortableHeader";
import type { LeaveSortKey } from "./types";

export const DEFAULT_LEAVE_SORT: SortDefaults<LeaveSortKey> = { key: "start", dir: "desc" };

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
