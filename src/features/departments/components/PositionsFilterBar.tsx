import { memo } from "react";
import { SearchInput } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { ArabicSourceKey } from "@/i18n/source";
import type { PositionFilter } from "../types";
import PositionFilterChip from "./PositionFilterChip";

const FILTERS: ReadonlyArray<{ id: PositionFilter; labelKey: ArabicSourceKey }> = [
  { id: "all", labelKey: "hierarchy.filter_all_positions" },
  { id: "vacant", labelKey: "common.vacant" },
  { id: "partial", labelKey: "hierarchy.filter_partly_filled" },
  { id: "over", labelKey: "hierarchy.filter_over_capacity" },
];

type PositionsFilterBarProps = {
  posSearch: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  filter: PositionFilter;
  onFilterChange: (filter: PositionFilter) => void;
  counts: Record<PositionFilter, number>;
};

/** Search plus fill-state chips — the "what's still vacant?" answer, above the list. */
const PositionsFilterBar = ({
  posSearch,
  onSearchChange,
  onClearSearch,
  filter,
  onFilterChange,
  counts,
}: PositionsFilterBarProps) => (
  <div className="flex items-center gap-2 flex-wrap">
    <SearchInput
      wrapperClassName="relative flex-1 min-w-0"
      iconClassName="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"
      inputClassName="w-full bg-background border border-border/40 rounded-lg ps-8 pe-8 py-1.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
      value={posSearch}
      onChange={onSearchChange}
      onClear={onClearSearch}
      placeholder={arabicSource("hierarchy.search_positions_placeholder")}
      style={{ fontSize: 12 }}
    />
    {FILTERS.map(({ id, labelKey }) => (
      <PositionFilterChip
        key={id}
        id={id}
        label={arabicSource(labelKey)}
        count={counts[id]}
        active={filter === id}
        onSelect={onFilterChange}
      />
    ))}
  </div>
);

export default memo(PositionsFilterBar);
