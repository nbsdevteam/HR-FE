import { memo } from "react";

type CalendarLegendItemProps = {
  label: string;
  dotClassName: string;
};

const CalendarLegendItem = ({ label, dotClassName }: CalendarLegendItemProps) => (
  <div className="flex items-center gap-2">
    <div className={`w-2.5 h-2.5 rounded-full ${dotClassName}`} />
    <span className="text-muted-foreground" style={{ fontSize: 12 }}>{label}</span>
  </div>
);

export default memo(CalendarLegendItem);
