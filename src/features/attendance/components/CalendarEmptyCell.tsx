type CalendarEmptyCellProps = {
  weekIndex: number;
};

const CalendarEmptyCell = ({ weekIndex }: CalendarEmptyCellProps) => (
  <div className={`min-h-[68px] border-b border-e border-border/20 ${weekIndex % 2 === 1 ? "bg-muted/[0.03]" : ""}`} />
);

export default CalendarEmptyCell;
