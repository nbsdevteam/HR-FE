import Button from "./Button";

type FilterChipProps = {
  label: string;
  active: boolean;
  onClick: () => void;
  fontSize?: number;
  /**
   * Padding utilities. Override where a chip row is visually larger than the
   * default (e.g. the training filter bar), so the caller doesn't fork the
   * whole component just to change its size.
   */
  padding?: string;
  /** Corner rounding utility — override rather than fighting it via className. */
  rounded?: string;
  /** Extra classes appended after the variant classes (layout, flex behaviour). */
  className?: string;
};

const FilterChip = ({
  label,
  active,
  onClick,
  fontSize = 12,
  padding = "px-3 py-1.5",
  rounded = "rounded-md",
  className = "",
}: FilterChipProps) => (
  <Button
    variant="toggle"
    active={active}
    size="unstyled"
    rounded={rounded}
    onClick={onClick}
    className={`${padding} ${className}`}
    style={{ fontSize }}
  >
    {label}
  </Button>
);

export default FilterChip;
