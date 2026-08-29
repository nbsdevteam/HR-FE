import { arabicSource } from "@/i18n/source";
import type { usePublicLeaveRequestPage } from "../hooks/usePublicLeaveRequestPage";

type PublicLeaveDurationFieldsProps = {
  page: ReturnType<typeof usePublicLeaveRequestPage>;
};

/**
 * Dates, half-day/hourly duration toggle, and the hour fields. An hourly
 * request is a slice of one day — `date_to` is forced server-side, so the
 * end-date control hides once "hour" is picked (backend hand-off §6).
 */
const PublicLeaveDurationFields = ({ page }: PublicLeaveDurationFieldsProps) => {
  const { form, info, selectedLeaveType } = page;
  const maxHours = info.info?.max_hours_per_request || 0;
  const isHourly = form.form.duration_unit === "hour";

  const handleDateFromChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    form.updateForm({ date_from: event.target.value });
  };

  const handleDateToChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    form.updateForm({ date_to: event.target.value });
  };

  const handleHalfDayChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    form.updateForm({ half_day: event.target.checked });
  };

  const handleDayUnitClick = (): void => {
    form.updateForm({ duration_unit: "day" });
  };

  const handleHourUnitClick = (): void => {
    form.updateForm({ duration_unit: "hour" });
  };

  const handleHoursChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    form.updateForm({ hours: event.target.value });
  };

  const handleHourFromChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    form.updateForm({ hour_from: event.target.value });
  };

  return (
    <div className="space-y-4">
      {selectedLeaveType?.allow_hourly && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDayUnitClick}
            className={`flex-1 px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
              !isHourly ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground"
            }`}
            style={{ fontSize: 13 }}
          >
            {arabicSource("public_leave.duration_day")}
          </button>
          <button
            type="button"
            onClick={handleHourUnitClick}
            className={`flex-1 px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
              isHourly ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground"
            }`}
            style={{ fontSize: 13 }}
          >
            {arabicSource("public_leave.duration_hour")}
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-muted-foreground block mb-1.5" style={{ fontSize: 12 }}>
            {arabicSource("public_leave.date_from_label")}
          </label>
          <input
            type="date"
            dir="ltr"
            value={form.form.date_from}
            onChange={handleDateFromChange}
            className="w-full px-4 py-3 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none"
            style={{ fontSize: 14 }}
          />
        </div>
        {!isHourly && (
          <div>
            <label className="text-muted-foreground block mb-1.5" style={{ fontSize: 12 }}>
              {arabicSource("public_leave.date_to_label")}
            </label>
            <input
              type="date"
              dir="ltr"
              value={form.form.date_to}
              onChange={handleDateToChange}
              className="w-full px-4 py-3 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none"
              style={{ fontSize: 14 }}
            />
          </div>
        )}
      </div>

      {isHourly && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-muted-foreground block mb-1.5" style={{ fontSize: 12 }}>
              {arabicSource("public_leave.hours_label")} ({arabicSource("public_leave.hours_max_hint")} {maxHours})
            </label>
            <input
              type="number"
              dir="ltr"
              min={0}
              max={maxHours || undefined}
              step="0.5"
              value={form.form.hours}
              onChange={handleHoursChange}
              className="w-full px-4 py-3 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none"
              style={{ fontSize: 14 }}
            />
          </div>
          <div>
            <label className="text-muted-foreground block mb-1.5" style={{ fontSize: 12 }}>
              {arabicSource("public_leave.hour_from_label")}
            </label>
            <input
              type="number"
              dir="ltr"
              min={0}
              max={24}
              step="0.5"
              value={form.form.hour_from}
              onChange={handleHourFromChange}
              className="w-full px-4 py-3 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none"
              style={{ fontSize: 14 }}
            />
          </div>
        </div>
      )}

      {!isHourly && selectedLeaveType?.allow_half_day && (
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.form.half_day}
            onChange={handleHalfDayChange}
            className="w-4 h-4 accent-current text-primary cursor-pointer"
          />
          <span className="text-muted-foreground" style={{ fontSize: 12.5 }}>
            {arabicSource("public_leave.half_day_label")}
          </span>
        </label>
      )}
    </div>
  );
};

export default PublicLeaveDurationFields;
