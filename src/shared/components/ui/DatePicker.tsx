import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { format, parseISO, isValid } from "date-fns";
import { cn } from "./cn";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import PickerCalendar from "./PickerCalendar";
import TimePickerAlwaysOpen from "./TimePickerAlwaysOpen";
import DatePickerTrigger from "./DatePickerTrigger";
import { extractDateString, extractTime, focusFirstCalendarDay, parseHhMm } from "./datePickerUtils";

export { parseDatePickerValueToLocalDate } from "./datePickerUtils";

export interface DatePickerProps {
  /** ISO date string "YYYY-MM-DD", or ISO datetime "YYYY-MM-DDTHH:mm" when showTime=true */
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Error message shown below the trigger */
  error?: string;
  id?: string;
  /**
   * When true, an analog time picker is shown below the calendar.
   * value / onChange use ISO datetime format "YYYY-MM-DDTHH:mm".
   * The popover stays open after date selection so the user can pick a time.
   */
  showTime?: boolean;
  /**
   * Earliest selectable day, "YYYY-MM-DD". Everything before it is disabled.
   *
   * A STRING and not a `Date` on purpose — the same contract `value` already
   * has, so no caller has to reason about which midnight a Date object means.
   * The caller owns what the floor is: pass today's LOCAL date to forbid the
   * past (`format(new Date(), 'yyyy-MM-dd')`, never `toISOString().slice(0,10)`
   * — UTC midnight is yesterday for the first three hours of a Baghdad day and
   * would let a past date straight through).
   *
   * Omitted by default, so every existing picker keeps the full calendar.
   */
  minDate?: string;
  /** Latest selectable day, "YYYY-MM-DD", same contract as `minDate`. */
  maxDate?: string;
}

const DatePicker = ({
  value,
  onChange,
  placeholder = "Select date",
  className,
  disabled,
  error,
  id,
  showTime = false,
  minDate,
  maxDate,
}: DatePickerProps) => {
  const [open, setOpen] = useState(false);
  const [internalTime, setInternalTime] = useState<string>(() => (showTime ? extractTime(value) : "09:00"));

  const datePart = extractDateString(value);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const selected: Date | undefined = useMemo(() => {
    if (!datePart) return undefined;
    const d = parseISO(datePart);
    return isValid(d) ? d : undefined;
  }, [datePart]);

  /** Parsed the same way `selected` is, so both land on the same local midnight. */
  const minDay: Date | undefined = useMemo(() => {
    if (!minDate) return undefined;
    const d = parseISO(minDate);
    return isValid(d) ? d : undefined;
  }, [minDate]);

  const maxDay: Date | undefined = useMemo(() => {
    if (!maxDate) return undefined;
    const d = parseISO(maxDate);
    return isValid(d) ? d : undefined;
  }, [maxDate]);

  // Display in trigger button
  const displayLabel = useMemo(() => {
    if (!selected) return null;
    const dateStr = format(selected, "dd / MM / yyyy");
    if (showTime && internalTime) {
      const [h, m] = parseHhMm(internalTime);
      const d12 = h % 12 === 0 ? 12 : h % 12;
      const ampm = h < 12 ? "AM" : "PM";
      return `${dateStr}  —  ${String(d12).padStart(2, "0")}:${String(m ?? 0).padStart(2, "0")} ${ampm}`;
    }
    return dateStr;
  }, [selected, showTime, internalTime]);

  const handleSelect = useCallback(
    (day: Date | undefined) => {
      if (!day) {
        onChange("");
        return;
      }
      const dateStr = format(day, "yyyy-MM-dd");
      if (showTime) {
        onChange(`${dateStr}T${internalTime}`);
        // Stay open so user can pick time
      } else {
        onChange(dateStr);
        setOpen(false);
      }
    },
    [onChange, showTime, internalTime],
  );

  const handleTimeChange = useCallback(
    (t: string) => {
      setInternalTime(t);
      if (datePart) onChange(`${datePart}T${t}`);
    },
    [datePart, onChange],
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange("");
      if (showTime) setInternalTime("09:00");
    },
    [onChange, showTime],
  );

  const handleConfirm = useCallback(() => {
    setOpen(false);
  }, []);

  const handleTriggerKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "Enter" && !open) {
        e.preventDefault();
        setOpen(true);
      }
    },
    [open],
  );

  const handleCalendarKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const root = calendarRef.current;
    if (!root) return;
    const active = document.activeElement as HTMLElement | null;

    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      return;
    }

    const prevNav = root.querySelector<HTMLButtonElement>('button[name="previous-month"]');
    const nextNav = root.querySelector<HTMLButtonElement>('button[name="next-month"]');

    if (e.key === "ArrowRight" && active === prevNav && nextNav && !nextNav.disabled) {
      e.preventDefault();
      nextNav.focus();
      return;
    }
    if (e.key === "ArrowLeft" && active === nextNav && prevNav && !prevNav.disabled) {
      e.preventDefault();
      prevNav.focus();
      return;
    }
    if (e.key === "ArrowDown" && (active === prevNav || active === nextNav)) {
      e.preventDefault();
      root.querySelector<HTMLButtonElement>("tbody tr:first-child button:not([disabled])")?.focus();
      return;
    }

    const isDayButton =
      active != null && active.tagName === "BUTTON" && active.closest("tbody") != null && root.contains(active);

    if (e.key === "ArrowUp" && isDayButton) {
      const tr = active.closest("tr");
      const tbody = active.closest("tbody");
      if (!tr || !tbody) return;
      if (tr === tbody.querySelector("tr")) {
        e.preventDefault();
        prevNav?.focus();
      }
    }
  }, []);

  useEffect(() => {
    if (showTime && value) setInternalTime(extractTime(value));
  }, [showTime, value]);

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      if (calendarRef.current) focusFirstCalendarDay(calendarRef.current);
    });
  }, [open]);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
        <PopoverTrigger asChild>
          <DatePickerTrigger
            ref={triggerRef}
            id={id}
            disabled={disabled}
            open={open}
            error={error}
            displayLabel={displayLabel}
            placeholder={placeholder}
            showTime={showTime}
            hasSelection={!!selected}
            showClear={!!(selected || (showTime && datePart))}
            onKeyDown={handleTriggerKeyDown}
            onClear={handleClear}
          />
        </PopoverTrigger>

        <PopoverContent
          className={cn(
            "p-0 rounded-xl border border-border/50 shadow-xl",
            // Popover base uses `w-72`; datetime mode needs full calendar + clock width.
            showTime ? "w-max min-w-0 max-w-[calc(100vw-1rem)] overflow-x-auto" : "overflow-hidden",
          )}
          align="start"
          sideOffset={6}
        >
          <div className="flex flex-col">
            {/* Main content: calendar + optional time picker */}
            <div className={cn("flex", showTime ? "w-max flex-row flex-nowrap gap-0" : "flex-col")}>
              {/* Calendar section */}
              <div
                className={cn("p-3 pb-2 shrink-0", showTime && "border-e border-border/40")}
                ref={calendarRef}
                onKeyDown={handleCalendarKeyDown}
              >
                <PickerCalendar selected={selected} onSelect={handleSelect} minDay={minDay} maxDay={maxDay} />
              </div>

              {/* Time picker - always open when showTime */}
              {showTime && (
                <div className="flex min-w-[230px] shrink-0 flex-col">
                  <TimePickerAlwaysOpen selectedTime={internalTime} onTimeChange={handleTimeChange} />
                </div>
              )}
            </div>

            {/* Confirm button - only when showTime */}
            {showTime && (
              <div className="px-3 pb-3 pt-2 border-t border-border/30">
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="w-full h-8 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  Confirm
                </button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {error && <p className="text-[11px] text-destructive leading-none">{error}</p>}
    </div>
  );
};

export default DatePicker;
