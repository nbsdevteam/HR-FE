import { useCallback } from "react";
import { FilterChip } from "@/shared/components";

type AttendanceStatusFilterChipProps = {
  label: string;
  active: boolean;
  onSelect: (label: string) => void;
};

/** Wraps the shared chip so each option owns a stable click handler. */
const AttendanceStatusFilterChip = ({
  label,
  active,
  onSelect,
}: AttendanceStatusFilterChipProps) => {
  const handleClick = useCallback((): void => {
    onSelect(label);
  }, [onSelect, label]);

  return <FilterChip label={label} active={active} onClick={handleClick} />;
};

export default AttendanceStatusFilterChip;
