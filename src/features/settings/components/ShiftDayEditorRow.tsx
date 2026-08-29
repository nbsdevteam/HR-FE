import type { ShiftDaySchedule } from "../types";

type TShiftDayEditorRowProps = {
  dayKey: string;
  label: string;
  value: ShiftDaySchedule;
  onChange: (patch: Partial<ShiftDaySchedule>) => void;
};

const ShiftDayEditorRow = ({
  label,
  value,
  onChange,
}: TShiftDayEditorRowProps) => {
  const handleWorkingChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onChange({ is_working: e.target.checked });
  };

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onChange({ start: e.target.value });
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onChange({ end: e.target.value });
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/10 rounded-lg">
      <input
        type="checkbox"
        checked={value.is_working}
        onChange={handleWorkingChange}
        className="w-4 h-4 cursor-pointer"
      />
      <label className="text-foreground text-sm flex-1">{label}</label>
      {value.is_working && (
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={value.start}
            onChange={handleStartChange}
            className="px-2 py-1 bg-muted/30 border border-border/40 rounded text-foreground focus:outline-none focus:border-primary text-sm"
          />
          <span className="text-muted-foreground">-</span>
          <input
            type="time"
            value={value.end}
            onChange={handleEndChange}
            className="px-2 py-1 bg-muted/30 border border-border/40 rounded text-foreground focus:outline-none focus:border-primary text-sm"
          />
        </div>
      )}
    </div>
  );
};

export default ShiftDayEditorRow;
