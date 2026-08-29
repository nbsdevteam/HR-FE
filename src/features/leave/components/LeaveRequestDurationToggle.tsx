import { memo } from "react";
import { arabicSource } from "@/i18n/source";
import type { LeaveDurationUnit } from "../hooks/useLeaveHourlyAttachment";
import LeaveDurationOptionButton from "./LeaveDurationOptionButton";

type LeaveRequestDurationToggleProps = {
  durationUnit: LeaveDurationUnit;
  onSelect: (unit: LeaveDurationUnit) => void;
};

const OPTIONS: readonly (readonly [LeaveDurationUnit, string])[] = [
  ["day", arabicSource("common.days_2")],
  ["hour", arabicSource("common.hours")],
];

const LeaveRequestDurationToggle = ({ durationUnit, onSelect }: LeaveRequestDurationToggleProps) => (
  <div className="flex gap-2">
    {OPTIONS.map(([unit, label]) => (
      <LeaveDurationOptionButton key={unit} unit={unit} label={label} isSelected={durationUnit === unit} onSelect={onSelect} />
    ))}
  </div>
);

export default memo(LeaveRequestDurationToggle);
