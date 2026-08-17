import type { ShiftDaySchedule } from "../types";

type ShiftDayEditorRowProps = {
  dayKey: string;
  label: string;
  value: ShiftDaySchedule;
  onChange: (patch: Partial<ShiftDaySchedule>) => void;
};

export const ShiftDayEditorRow = ({ label, value, onChange }: ShiftDayEditorRowProps) => (
  <div className="flex items-center gap-3 p-3 bg-muted/10 rounded-lg">
    <input
      type="checkbox"
      checked={value.is_working}
      onChange={(e) => onChange({ is_working: e.target.checked })}
      className="w-4 h-4 cursor-pointer"
    />
    <label className="text-foreground text-sm flex-1">{label}</label>
    {value.is_working && (
      <div className="flex items-center gap-2">
        <input
          type="time"
          value={value.start}
          onChange={(e) => onChange({ start: e.target.value })}
          className="px-2 py-1 bg-muted/30 border border-border/40 rounded text-foreground focus:outline-none focus:border-primary text-sm"
        />
        <span className="text-muted-foreground">-</span>
        <input
          type="time"
          value={value.end}
          onChange={(e) => onChange({ end: e.target.value })}
          className="px-2 py-1 bg-muted/30 border border-border/40 rounded text-foreground focus:outline-none focus:border-primary text-sm"
        />
      </div>
    )}
  </div>
);
