import ViewToggle from "@/shared/components/ViewToggle";
import { DatePicker } from "@/shared/components";
import { arabicSource } from "@/i18n/source";

type AttendanceHeaderProps = {
  viewMode: "list" | "kanban";
  selectedDate: string;
  onViewModeChange: (view: "list" | "kanban") => void;
  onSelectedDateChange: (date: string) => void;
};

const AttendanceHeader = ({ viewMode, selectedDate, onViewModeChange, onSelectedDateChange }: AttendanceHeaderProps) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-gradient-gold">{arabicSource("common.attendance_and_departure")}</h1>
        <p className="text-muted-foreground mt-1">{arabicSource("attendance.follow_up_on_employee_attendance_and_dismissal_live_data")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <ViewToggle view={viewMode} onChange={onViewModeChange} />
        <DatePicker
          value={selectedDate}
          onChange={onSelectedDateChange}
          className="flex-1 min-w-0 sm:flex-none sm:w-44"
        />
      </div>
    </div>
  );
};

export default AttendanceHeader;
