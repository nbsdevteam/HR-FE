import { memo, useCallback } from "react";
import { FilterChip } from "@/shared/components";

type LeaveRequestFilterChipProps = {
  label: string;
  active: boolean;
  onSelect: (label: string) => void;
};

/**
 * Binds its own label on click, so the filter row can render the chips from a
 * `.map()` without building a fresh closure per chip on every render.
 */
const LeaveRequestFilterChip = ({ label, active, onSelect }: LeaveRequestFilterChipProps) => {
  const handleClick = useCallback((): void => {
    onSelect(label);
  }, [onSelect, label]);

  return <FilterChip label={label} active={active} onClick={handleClick} fontSize={13} />;
};

export default memo(LeaveRequestFilterChip);
