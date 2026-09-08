import { DayPicker } from "react-day-picker";
import { useDirection } from "./useDirection";
import { cn } from "./cn";
import { buttonVariants } from "./buttonVariants";

type PickerCalendarProps = {
  selected?: Date;
  onSelect: (d: Date | undefined) => void;
  minDay?: Date;
  maxDay?: Date;
};

const CalendarIconLeft = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("flex items-center justify-center", className)} {...props}>‹</span>
);

const CalendarIconRight = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("flex items-center justify-center", className)} {...props}>›</span>
);

// Inline calendar (avoids a circular dep with a generic calendar.tsx).
const PickerCalendar = ({ selected, onSelect, minDay, maxDay }: PickerCalendarProps) => {
  // react-day-picker only mirrors its prev/next glyphs off its own `dir` prop —
  // it does not read the document direction, so pass it explicitly.
  const { dir } = useDirection();

  const disabled =
    minDay && maxDay
      ? { before: minDay, after: maxDay }
      : minDay
        ? { before: minDay }
        : maxDay
          ? { after: maxDay }
          : undefined;

  return (
    <DayPicker
      dir={dir}
      mode="single"
      selected={selected}
      onSelect={onSelect}
      /*
        Greyed and unclickable rather than hidden, and the months before/after
        it are still reachable: a task that is already overdue has to keep
        SHOWING the date it missed. `fromDate`/`toDate` would have clamped the
        calendar and hidden that date from the person looking for it.
      */
      disabled={disabled}
      showOutsideDays
      fixedWeeks
      className="p-0"
      classNames={{
        months: "flex flex-col",
        month: "flex flex-col gap-3",
        caption: "flex justify-center pt-1 relative items-center w-full px-8",
        caption_label: "text-xs font-semibold text-foreground",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 p-0 opacity-60 hover:opacity-100",
        ),
        nav_button_previous: "absolute start-1",
        nav_button_next: "absolute end-1",
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell: "text-muted-foreground w-8 font-normal text-[0.7rem] text-center",
        row: "flex w-full mt-1",
        cell: cn(
          "relative p-0 text-center text-xs",
          "[&:has([aria-selected])]:bg-primary/10 [&:has([aria-selected])]:rounded-md",
        ),
        // `ghost` already carries `hover:bg-secondary hover:text-secondary-foreground`
        // — the app's standard hover treatment. Day cells used to override it with
        // `hover:bg-accent`, but `--accent` is a light cream badge color reserved
        // for the "today" cell below; using it for every hover flashed a bright,
        // off-theme box in dark mode.
        day: cn(buttonVariants({ variant: "ghost" }), "h-8 w-8 p-0 font-normal text-xs text-foreground"),
        day_selected:
          "!bg-primary !text-primary-foreground hover:!bg-primary hover:!text-primary-foreground rounded-md",
        day_today: "bg-accent text-accent-foreground font-semibold rounded-md",
        day_outside: "text-muted-foreground/40 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground/30 cursor-not-allowed",
        day_hidden: "invisible",
      }}
      components={{
        IconLeft: CalendarIconLeft,
        IconRight: CalendarIconRight,
      }}
    />
  );
};

export default PickerCalendar;
