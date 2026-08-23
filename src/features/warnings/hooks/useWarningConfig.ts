import { useMemo } from "react";
import { arabicSource } from "@/i18n/source";
import { useConfigurations } from "@/shared/hooks";
import { buildStatusColorMap } from "@/shared/utils/statusColors";
import { statusColorPalette, typeColorPalette } from "../constants/warnings";
import type { KanbanStatusCol } from "../types";

// Warning types and statuses from configurations table (NOT hard-coded)
export const useWarningConfig = () => {
  const { getValue } = useConfigurations();

  const warningTypes = useMemo(() => (
    getValue("warnings.types", arabicSource("warnings.oral_first_written_second_written_final_written_chapter")).split(",").map((s) => s.trim())
  ), [getValue]);
  const warningStatuses = useMemo(() => (
    getValue("warnings.statuses", arabicSource("warnings.active_expired_canceled")).split(",").map((s) => s.trim())
  ), [getValue]);

  // Auto-build color and severity maps from the ordered type list
  const typeColors = useMemo(
    () => buildStatusColorMap(warningTypes, typeColorPalette),
    [warningTypes],
  );

  const typeSeverity = useMemo(() => {
    const map: Record<string, number> = {};
    warningTypes.forEach((t, i) => {
      map[t] = i + 1;
    });
    return map;
  }, [warningTypes]);

  const statusColors = useMemo(
    () => buildStatusColorMap(warningStatuses, statusColorPalette),
    [warningStatuses],
  );

  const kanbanStatusCols: KanbanStatusCol[] = useMemo(() => [
    { key: arabicSource("common.is_active"), label: arabicSource("common.is_active"), accent: "border-destructive/40", dotColor: "bg-destructive" },
    { key: arabicSource("common.finished"), label: arabicSource("common.finished"), accent: "border-muted-foreground/40", dotColor: "bg-muted-foreground" },
    { key: arabicSource("common.canceled"), label: arabicSource("common.canceled"), accent: "border-emerald-500/40", dotColor: "bg-emerald-500" },
  ], []);

  return { warningTypes, warningStatuses, typeColors, typeSeverity, statusColors, kanbanStatusCols };
};
