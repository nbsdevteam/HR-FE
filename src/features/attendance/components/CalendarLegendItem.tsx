type CalendarLegendItemProps = {
  label: string;
  dot: string;
};

const CalendarLegendItem = ({ label, dot }: CalendarLegendItemProps) => {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
      <span className="text-muted-foreground" style={{ fontSize: 12 }}>{label}</span>
    </div>
  );
};

export default CalendarLegendItem;
