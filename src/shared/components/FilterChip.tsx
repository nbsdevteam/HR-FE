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
  <button
    onClick={onClick}
    className={`${padding} ${rounded} transition-colors cursor-pointer ${
      active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
    } ${className}`}
    style={{ fontSize }}
  >
    {label}
  </button>
);

export default FilterChip;
