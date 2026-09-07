import { forwardRef } from "react";
import { CalendarIcon, X, Clock } from "lucide-react";
import { cn } from "./cn";

type DatePickerTriggerProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "id" | "disabled" | "onKeyDown"> & {
  id?: string;
  disabled?: boolean;
  open: boolean;
  error?: string;
  displayLabel: string | null;
  placeholder: string;
  showTime: boolean;
  hasSelection: boolean;
  showClear: boolean;
  onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
  onClear: (e: React.MouseEvent) => void;
};

// The popover trigger `<button>`, split out of `DatePicker` to keep that
// file under the project's 300-line component limit. `PopoverTrigger asChild`
// clones its single child (this component) and merges in its own `onClick`
// and ARIA attributes — `...radixProps` carries those through to the real
// `<button>`; without it Radix's click handler never reaches the DOM node.
const DatePickerTrigger = forwardRef<HTMLButtonElement, DatePickerTriggerProps>(
  (
    { id, disabled, open, error, displayLabel, placeholder, showTime, hasSelection, showClear, onKeyDown, onClear, ...radixProps },
    ref,
  ) => (
    <button
      ref={ref}
      id={id}
      type="button"
      disabled={disabled}
      onKeyDown={onKeyDown}
      {...radixProps}
      className={cn(
        "flex w-full items-center gap-2 rounded-md border px-3 text-sm cursor-pointer",
        "h-9 bg-input-background outline-none transition-[color,box-shadow]",
        "border-border hover:border-ring/60",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring",
        open && "ring-2 ring-ring",
        error && "border-destructive/60 hover:border-destructive focus-visible:border-destructive",
        "disabled:cursor-not-allowed disabled:opacity-50",
      )}
      aria-invalid={!!error}
    >
      <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span
        dir="ltr"
        className={cn("flex-1 text-start truncate", displayLabel ? "text-foreground" : "text-muted-foreground/50")}
      >
        {displayLabel ?? placeholder}
      </span>
      {showTime && hasSelection && <Clock className="h-3 w-3 shrink-0 text-primary/60" />}
      {showClear && !disabled && (
        <X className="h-3.5 w-3.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors" onClick={onClear} />
      )}
    </button>
  ),
);
DatePickerTrigger.displayName = "DatePickerTrigger";

export default DatePickerTrigger;
