import { arabicSource } from "@/i18n/source";
import { countBy } from "@/shared/utils/collections";
import type { WarningWithEmployee } from "../types";

export interface WarningStats {
  total: number;
  active: number;
  expired: number;
  cancelled: number;
  byType: { type: string; count: number }[];
}

/**
 * Two O(rows) passes instead of `3 + warningTypes.length` full scans — the
 * per-type `byType` filter alone re-walked every warning once per type.
 */
export const computeWarningStats = (
  filteredWarnings: WarningWithEmployee[],
  warningTypes: string[],
): WarningStats => {
  const activeLabel = arabicSource("common.is_active");
  const statusCounts = countBy(filteredWarnings, (w) => w.status);
  const activeCountsByType = countBy(filteredWarnings, (w) => (w.status === activeLabel ? w.type : null));

  return {
    total: filteredWarnings.length,
    active: statusCounts.get(activeLabel) ?? 0,
    expired: statusCounts.get(arabicSource("common.finished")) ?? 0,
    cancelled: statusCounts.get(arabicSource("common.canceled")) ?? 0,
    byType: warningTypes.map((type) => ({
      type,
      count: activeCountsByType.get(type) ?? 0,
    })),
  };
};
