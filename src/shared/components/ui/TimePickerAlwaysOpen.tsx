import { useMemo, useCallback } from "react";
import ClockFace from "./ClockFace";
import { parseHhMm } from "./datePickerUtils";

type TimePickerAlwaysOpenProps = {
  selectedTime: string;
  onTimeChange: (t: string) => void;
};

// Analog time picker used when the date picker is in `showTime` mode — stays
// open beside the calendar rather than behind its own popover trigger.
const TimePickerAlwaysOpen = ({ selectedTime, onTimeChange }: TimePickerAlwaysOpenProps) => {
  const [hours, minutes] = useMemo(() => parseHhMm(selectedTime), [selectedTime]);

  const handleChange = useCallback(
    (h: number, m: number): void => onTimeChange(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`),
    [onTimeChange],
  );

  return (
    <div className="px-3 py-3 flex flex-col gap-3">
      <ClockFace hours={hours} minutes={minutes} onChange={handleChange} />
    </div>
  );
};

export default TimePickerAlwaysOpen;
