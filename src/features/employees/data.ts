import { arabicSource } from "@/i18n/source";
import type { SortDefaults } from "@/shared/components/SortableHeader";
import { ReadonlyArray, type EmployeeSortKey } from "./types";

export const DEFAULT_EMPLOYEE_SORT: SortDefaults<EmployeeSortKey> = { key: "name", dir: "asc" };

export const TAPSDATA = {
  INFO: "info",
  CUSTODIES: "custodies",
  LEAVES: "leaves",
  ATTACHMENTS: "attachments",
};

export const EMPLOYEE_COLUMNS: ReadonlyArray[] = [
  { label: arabicSource("common.employee"), key: "name" },
  { label: arabicSource("common.job_number"), key: "employeeNumber" },
  {
    label: arabicSource("common.fingerprint_number"),
    key: "deviceNo",
    center: true,
  },
  { label: arabicSource("common.section"), key: "department" },
  { label: arabicSource("common.position"), key: "position" },
  { label: arabicSource("common.status"), key: "status" },
  { label: arabicSource("common.footprint"), key: null },
  { label: arabicSource("common.direct_date"), key: "joinDate" },
  { label: arabicSource("common.salary"), key: "salary" },
  { label: arabicSource("common.procedures"), key: null },
];
