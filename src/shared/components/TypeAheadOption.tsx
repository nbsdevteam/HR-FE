type TypeAheadOptionProps = {
  label: string;
  description?: string | null;
  active: boolean;
  onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

const TypeAheadOption = ({ label, description, active, onMouseDown }: TypeAheadOptionProps) => {
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
      <div className="truncate font-medium" dir="auto">
        {label}
      </div>
      {description && (
        <div className="text-muted-foreground truncate" style={{ fontSize: 11 }}>
          {description}
        </div>
      )}
    </button>
  );
};

export default TypeAheadOption;
