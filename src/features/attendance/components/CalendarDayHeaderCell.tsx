type CalendarDayHeaderCellProps = {
  label: string;
  isRestDow: boolean;
};

const CalendarDayHeaderCell = ({ label, isRestDow }: CalendarDayHeaderCellProps) => (
  <div
    className={`text-center py-3 font-semibold ${isRestDow ? "text-muted-foreground/50 bg-muted/10" : "text-foreground/60"}`}
    style={{ fontSize: 13 }}
  >
    {label}
  </div>
);

export default CalendarDayHeaderCell;
