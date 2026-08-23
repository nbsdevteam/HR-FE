import { arabicSource } from "@/i18n/source";
import HalfDayPeriodButton from "./HalfDayPeriodButton";

export type HalfDayPeriod = "morning" | "afternoon";

const HALF_DAY_PERIODS: readonly (readonly [HalfDayPeriod, string])[] = [
  ["morning", arabicSource("leave.morning")],
  ["afternoon", arabicSource("leave.evening")],
];

type LeaveRequestHalfDayRowProps = {
  isHalfDay: boolean;
  halfDayPeriod: HalfDayPeriod;
  onIsHalfDayChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onHalfDayPeriodChange: (period: HalfDayPeriod) => void;
};

const LeaveRequestHalfDayRow = ({
  isHalfDay,
  halfDayPeriod,
  onIsHalfDayChange,
  onHalfDayPeriodChange,
}: LeaveRequestHalfDayRowProps) => (
  <div className="flex items-center gap-4">
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={isHalfDay}
        onChange={onIsHalfDayChange}
        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
      />
      <span className="text-foreground" style={{ fontSize: 13 }}>
        {arabicSource("common.half_a_day")}
      </span>
    </label>
    {isHalfDay && (
      <div className="flex gap-2">
        {HALF_DAY_PERIODS.map(([value, label]) => (
          <HalfDayPeriodButton
            key={value}
            value={value}
            label={label}
            isSelected={halfDayPeriod === value}
            onSelect={onHalfDayPeriodChange}
          />
        ))}
      </div>
    )}
  </div>
);

export default LeaveRequestHalfDayRow;
