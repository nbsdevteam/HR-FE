import { memo } from "react";

type CalendarDayHeaderCellProps = {
  label: string;
  isRestDay: boolean;
};

const CalendarDayHeaderCell = ({ label, isRestDay }: CalendarDayHeaderCellProps) => (
  <div
    className={`text-center py-3 font-semibold ${isRestDay ? "text-muted-foreground/50 bg-muted/10" : "text-foreground/60"}`}
    style={{ fontSize: 13 }}
  >
    {label}
  </div>
);

export default memo(CalendarDayHeaderCell);
