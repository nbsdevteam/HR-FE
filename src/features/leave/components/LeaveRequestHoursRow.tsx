import { arabicSource } from "@/i18n/source";
import { leaveInputClass as inputCls } from "../styles";

type LeaveRequestHoursRowProps = {
  hours: number;
  hourFrom: string;
  maxHours: number;
  onHoursChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onHourFromChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

/** Hours + optional start-time inputs shown when the request's duration unit is "hour". */
const LeaveRequestHoursRow = ({ hours, hourFrom, maxHours, onHoursChange, onHourFromChange }: LeaveRequestHoursRowProps) => (
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>
        {arabicSource("leave.number_of_hours")} * ({arabicSource("leave.maximum_hours_per_request")}: {maxHours})
      </label>
      <input
        type="number"
        value={hours}
        onChange={onHoursChange}
        min={0.5}
        max={maxHours}
        step={0.5}
        className={inputCls}
        dir="ltr"
      />
    </div>
    <div>
      <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("leave.start_time")}</label>
      <input
        type="number"
        value={hourFrom}
        onChange={onHourFromChange}
        min={0}
        max={23.99}
        step={0.5}
        placeholder="9"
        className={inputCls}
        dir="ltr"
      />
    </div>
  </div>
);

export default LeaveRequestHoursRow;
