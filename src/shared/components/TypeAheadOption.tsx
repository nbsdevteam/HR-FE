import { useState, useRef, useCallback } from "react";

type TypeAheadOptionProps = {
  label: string;
  description?: string | null;
  active: boolean;
  /** Label is backend data, not catalogued UI copy — keep the DOM localizer off it. */
  labelIsData?: boolean;
  onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

const TypeAheadOption = ({ label, description, active, labelIsData = false, onMouseDown }: TypeAheadOptionProps) => {
  const [isLabelTruncated, setIsLabelTruncated] = useState(false);
  const [isDescriptionTruncated, setIsDescriptionTruncated] = useState(false);
  const labelRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback((): void => {
    const labelEl = labelRef.current;
    if (labelEl) setIsLabelTruncated(labelEl.scrollWidth > labelEl.clientWidth);
    const descriptionEl = descriptionRef.current;
    if (descriptionEl) setIsDescriptionTruncated(descriptionEl.scrollWidth > descriptionEl.clientWidth);
  }, []);

  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onMouseDown={onMouseDown}
      onMouseEnter={handleMouseEnter}
      className={`w-full px-3 py-2 text-start hover:bg-primary/10 cursor-pointer border-b border-border/10 last:border-b-0 ${
        active ? "bg-primary/10 text-primary" : "text-foreground"
      }`}
      style={{ fontSize: 13 }}
    >
      <div
        ref={labelRef}
        className="truncate font-medium"
        dir="auto"
        data-i18n-ignore={labelIsData || undefined}
        title={isLabelTruncated ? label : undefined}
      >
        {label}
      </div>
      {description && (
        <div
          ref={descriptionRef}
          className="text-muted-foreground truncate"
          style={{ fontSize: 11 }}
          data-i18n-ignore={labelIsData || undefined}
          title={isDescriptionTruncated ? description : undefined}
        >
          {description}
        </div>
      )}
    </button>
  );
};

export default TypeAheadOption;
