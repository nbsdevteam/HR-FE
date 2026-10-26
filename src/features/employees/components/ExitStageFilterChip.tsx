import { memo, useCallback } from "react";
import { FilterChip } from "@/shared/components";
import type { ExitListFilter } from "../utils/exitListFilter";

type ExitStageFilterChipProps = {
  id: ExitListFilter;
  label: string;
  count: number;
  active: boolean;
  onSelect: (id: ExitListFilter) => void;
};

const ExitStageFilterChip = ({ id, label, count, active, onSelect }: ExitStageFilterChipProps) => {
  const handleClick = useCallback((): void => {
    onSelect(id);
  }, [id, onSelect]);

  return (
    <FilterChip
      label={`${label} (${count})`}
      active={active}
      onClick={handleClick}
      className="whitespace-nowrap"
    />
  );
};

export default memo(ExitStageFilterChip);
