import { memo, useCallback } from "react";
import { FilterChip } from "@/shared/components";
import type { PositionFilter } from "../types";

type PositionFilterChipProps = {
  id: PositionFilter;
  label: string;
  count: number;
  active: boolean;
  onSelect: (filter: PositionFilter) => void;
};

const PositionFilterChip = ({ id, label, count, active, onSelect }: PositionFilterChipProps) => {
  const handleClick = useCallback((): void => {
    onSelect(id);
  }, [id, onSelect]);

  return <FilterChip label={`${label} (${count})`} active={active} onClick={handleClick} />;
};

export default memo(PositionFilterChip);
