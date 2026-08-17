import { ViewToggle } from "@/shared/components/ViewToggle";
import { arabicSource } from "@/i18n/source";

type AttendanceHeaderProps = {
  viewMode: "list" | "kanban";
  selectedDate: string;
  onViewModeChange: (view: "list" | "kanban") => void;
  onSelectedDateChange: (date: string) => void;
};

const AttendanceHeader = ({ viewMode, selectedDate, onViewModeChange, onSelectedDateChange }: AttendanceHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-gradient-gold">{arabicSource("common.attendance_and_departure")}</h1>
        <p className="text-muted-foreground mt-1">{arabicSource("attendance.follow_up_on_employee_attendance_and_dismissal_live_data")}</p>
      </div>
      <div className="flex items-center gap-3">
        <ViewToggle view={viewMode} onChange={onViewModeChange} />
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => onSelectedDateChange(e.target.value)}
          className="h-11 px-4 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none"
          dir="ltr"
        />
      </div>
    </div>
  );
}

export default AttendanceHeader;
