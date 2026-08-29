type SelectOptionRowProps = {
  label: string;
  active: boolean;
  disabled?: boolean;
  /** Label is backend data, not catalogued UI copy — keep the DOM localizer off it. */
  labelIsData?: boolean;
  onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

const SelectOptionRow = ({ label, active, disabled = false, labelIsData = false, onMouseDown }: SelectOptionRowProps) => {
  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>): void => {
    if (disabled) return;
    onMouseDown(e);
  };

  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      aria-disabled={disabled || undefined}
      onMouseDown={handleMouseDown}
      className={`w-full px-3 py-2 text-start border-b border-border/10 last:border-b-0 ${
        disabled
          ? "opacity-40 cursor-not-allowed text-muted-foreground"
          : active
            ? "bg-gold/25 text-gold font-medium cursor-pointer"
            : "text-foreground hover:bg-gold/15 cursor-pointer"
      }`}
      style={{ fontSize: 13 }}
    >
      <span className="truncate block" dir="auto" data-i18n-ignore={labelIsData || undefined}>
        {label}
      </span>
    </button>
  );
};

export default SelectOptionRow;
