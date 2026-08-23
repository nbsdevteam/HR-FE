import { memo, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { useLocalizedName } from "@/i18n/useLocalizedName";
import type { DbLeaveType } from "@/shared/hooks";
import SettingsToggle from "./SettingsToggle";

type TLeaveTypeListItemProps = {
  leaveType: DbLeaveType;
  onToggleActive: (leaveType: DbLeaveType) => void;
  onDelete: (leaveTypeId: string) => void;
};

const LeaveTypeListItem = ({
  leaveType,
  onToggleActive,
  onDelete,
}: TLeaveTypeListItemProps) => {
  const { primary, secondary, secondaryDir } = useLocalizedName(leaveType.name_ar, leaveType.name_en);

  const handleToggleActive = useCallback((): void => {
    onToggleActive(leaveType);
  }, [onToggleActive, leaveType]);

  const handleDelete = useCallback((): void => {
    onDelete(leaveType.id);
  }, [onDelete, leaveType.id]);

  return (
    <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: leaveType.color }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-foreground text-sm" data-i18n-ignore>{primary}</span>
            {secondary && (
              <span className="text-muted-foreground text-xs" dir={secondaryDir} data-i18n-ignore>
                ({secondary})
              </span>
            )}
            <span className="text-muted-foreground text-xs px-1.5 py-0.5 bg-muted/20 rounded">
              {leaveType.code}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-muted-foreground text-xs">
              {leaveType.default_days_per_year}{" "}
              {arabicSource("settings.day_year")}
            </span>
            {!leaveType.is_paid && (
              <span className="text-destructive text-xs">
                {arabicSource("common.without_salary")}
              </span>
            )}
            {leaveType.allow_half_day && (
              <span className="text-blue-400 text-xs">
                {arabicSource("common.half_a_day")}
              </span>
            )}
            {leaveType.is_carryover_allowed && (
              <span className="text-purple-400 text-xs">
                {arabicSource("common.relay")} {leaveType.max_carryover_days}d
              </span>
            )}
            {leaveType.is_encashable && (
              <span className="text-emerald-400 text-xs">
                {arabicSource("settings.exchange")}{" "}
                {leaveType.encashment_percentage}%
              </span>
            )}
            <span className="text-muted-foreground/60 text-xs">
              {leaveType.accrual_method === "monthly"
                ? arabicSource("common.monthly")
                : leaveType.accrual_method === "annual"
                  ? arabicSource("common.annual")
                  : "—"}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <SettingsToggle on={leaveType.is_active} onClick={handleToggleActive} />
        <button
          onClick={handleDelete}
          className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default memo(LeaveTypeListItem);
