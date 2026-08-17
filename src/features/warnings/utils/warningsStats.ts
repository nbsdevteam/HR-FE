import { arabicSource } from "@/i18n/source";
import type { WarningWithEmployee } from "../types";

export interface WarningStats {
  total: number;
  active: number;
  expired: number;
  cancelled: number;
  byType: { type: string; count: number }[];
}

export const computeWarningStats = (filteredWarnings: WarningWithEmployee[], warningTypes: string[]): WarningStats => ({
  total: filteredWarnings.length,
  active: filteredWarnings.filter((w) => w.status === arabicSource("common.is_active")).length,
  expired: filteredWarnings.filter((w) => w.status === arabicSource("common.finished")).length,
  cancelled: filteredWarnings.filter((w) => w.status === arabicSource("common.canceled")).length,
  byType: warningTypes.map((t) => ({
    type: t,
    count: filteredWarnings.filter((w) => w.type === t && w.status === arabicSource("common.is_active")).length,
  })),
});
