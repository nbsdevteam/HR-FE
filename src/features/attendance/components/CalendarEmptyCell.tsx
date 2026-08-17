type CalendarEmptyCellProps = {
  weekIndex: number;
};

export const CalendarEmptyCell = ({ weekIndex }: CalendarEmptyCellProps) => (
  <div className={`min-h-[68px] border-b border-e border-border/20 ${weekIndex % 2 === 1 ? "bg-muted/[0.03]" : ""}`} />
);
