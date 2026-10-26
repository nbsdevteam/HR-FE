import { memo, useMemo } from "react";
import { arabicSource } from "@/i18n/source";
import { EXIT_STAGE_FILTERS, type ExitListFilter } from "../utils/exitListFilter";
import ExitStageFilterChip from "./ExitStageFilterChip";

type ExitStageFilterBarProps = {
  filter: ExitListFilter;
  counts: Record<ExitListFilter, number>;
  statusLabels: Record<string, string>;
  onSelect: (id: ExitListFilter) => void;
};

/** Needs me, All open, then one chip per stage; the counts come from the loaded rows. */
const ExitStageFilterBar = ({ filter, counts, statusLabels, onSelect }: ExitStageFilterBarProps) => {
  const chips = useMemo<{ id: ExitListFilter; label: string }[]>(() => [
    { id: "needs_me", label: arabicSource("lifecycle.exit_progress_needs_me") },
    { id: "open", label: arabicSource("lifecycle.exit_progress_all_open") },
    ...EXIT_STAGE_FILTERS.map(stage => ({ id: stage, label: statusLabels[stage] ?? stage })),
  ], [statusLabels]);

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" data-exit-filter={filter}>
      {chips.map(chip => (
        <ExitStageFilterChip
          key={chip.id}
          id={chip.id}
          label={chip.label}
          count={counts[chip.id]}
          active={filter === chip.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};

export default memo(ExitStageFilterBar);
