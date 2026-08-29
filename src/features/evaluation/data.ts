import { arabicSource } from "@/i18n/source";

export const sortData = [
  { label: arabicSource("common.employee"), key: "employee" },
  { label: arabicSource("common.section"), key: "department" },
  { label: arabicSource("evaluation.assessor_2"), key: "evaluator" },
  { label: arabicSource("common.period"), key: "period" },
  { label: arabicSource("common.evaluation"), key: "rating" },
  { label: arabicSource("common.status"), key: "status" },
  { label: arabicSource("common.procedures"), key: null },
] as const;
