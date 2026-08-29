type TypeAheadOptionProps = {
  label: string;
  description?: string | null;
  active: boolean;
  /** Label is backend data, not catalogued UI copy — keep the DOM localizer off it. */
  labelIsData?: boolean;
  onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

const TypeAheadOption = ({ label, description, active, labelIsData = false, onMouseDown }: TypeAheadOptionProps) => {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onMouseDown={onMouseDown}
      className={`w-full px-3 py-2 text-start hover:bg-primary/10 cursor-pointer border-b border-border/10 last:border-b-0 ${
        active ? "bg-primary/10 text-primary" : "text-foreground"
      }`}
      style={{ fontSize: 13 }}
    >
      <div className="truncate font-medium" dir="auto" data-i18n-ignore={labelIsData || undefined}>
        {label}
      </div>
      {description && (
        <div
          className="text-muted-foreground truncate"
          style={{ fontSize: 11 }}
          data-i18n-ignore={labelIsData || undefined}
        >
          {description}
        </div>
      )}
    </button>
  );
};

export default TypeAheadOption;
