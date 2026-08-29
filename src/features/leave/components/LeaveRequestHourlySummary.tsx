import { Clock } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { formatHourFloat } from "../utils/hourFloat";

type LeaveRequestHourlySummaryProps = {
  hours: number;
  hourFromFloat: number | null;
};

/** "Duration: N hours (09:00–12:00)" strip — the hour-mode counterpart of the day summary. */
const LeaveRequestHourlySummary = ({ hours, hourFromFloat }: LeaveRequestHourlySummaryProps) => {
  if (hours <= 0) return null;

  const window =
    hourFromFloat !== null && hourFromFloat + hours <= 24
      ? `${formatHourFloat(hourFromFloat)}–${formatHourFloat(hourFromFloat + hours)}`
      : null;

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
      <Clock className="w-4 h-4 text-primary" />
      <span className="text-primary" style={{ fontSize: 13 }}>
        {arabicSource("common.duration_2")} {hours} {arabicSource("common.hours")}
      </span>
      {window && (
        <span className="text-muted-foreground" style={{ fontSize: 12 }} dir="ltr">
          {window}
        </span>
      )}
    </div>
  );
};

export default LeaveRequestHourlySummary;
