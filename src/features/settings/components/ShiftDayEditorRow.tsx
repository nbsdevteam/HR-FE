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
    <div className="flex items-center flex-wrap gap-3 p-3 bg-muted/10 rounded-lg">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <input
          type="checkbox"
          checked={value.is_working}
          onChange={handleWorkingChange}
          className="w-4 h-4 cursor-pointer shrink-0"
        />
        <label className="text-foreground text-sm truncate">{label}</label>
      </div>
      {value.is_working && (
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="time"
            value={value.start}
            onChange={handleStartChange}
            className="flex-1 sm:flex-initial px-2 py-1 bg-muted/30 border border-border/40 rounded text-foreground focus:outline-none focus:border-primary text-sm"
          />
          <span className="text-muted-foreground shrink-0">-</span>
          <input
            type="time"
            value={value.end}
            onChange={handleEndChange}
            className="flex-1 sm:flex-initial px-2 py-1 bg-muted/30 border border-border/40 rounded text-foreground focus:outline-none focus:border-primary text-sm"
          />
        </div>
      )}
    </div>
  );
};

export default ShiftDayEditorRow;
