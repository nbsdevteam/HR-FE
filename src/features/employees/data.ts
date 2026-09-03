import { arabicSource } from "@/i18n/source";
import { ReadonlyArray } from "./types";

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
