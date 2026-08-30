import { useState, memo, useCallback } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { useLocalizedName } from "@/i18n/useLocalizedName";
import type { DbLeaveType } from "@/shared/hooks";
import { useLeaveTypePermissions } from "../hooks/useLeaveTypePermissions";
import SettingsToggle from "./SettingsToggle";

type TLeaveTypeListItemProps = {
  leaveType: DbLeaveType;
  onToggleActive: (leaveType: DbLeaveType) => void;
  onDelete: (leaveTypeId: string) => void;
  onUpdateDays: (leaveTypeId: string, defaultDaysPerYear: number) => void;
};

const LeaveTypeListItem = ({
  leaveType,
  onToggleActive,
  onDelete,
  onUpdateDays,
}: TLeaveTypeListItemProps) => {
  const [editingDays, setEditingDays] = useState(false);
  const [daysValue, setDaysValue] = useState(String(leaveType.default_days_per_year));
  const { primary, secondary, secondaryDir } = useLocalizedName(leaveType.name_ar, leaveType.name_en);
  const { canManage } = useLeaveTypePermissions();

  const handleToggleActive = useCallback((): void => {
    onToggleActive(leaveType);
  }, [onToggleActive, leaveType]);

  const handleDelete = useCallback((): void => {
    onDelete(leaveType.id);
  }, [onDelete, leaveType.id]);

  const handleStartEditDays = useCallback((): void => {
    setDaysValue(String(leaveType.default_days_per_year));
    setEditingDays(true);
  }, [leaveType.default_days_per_year]);

  const handleCancelEditDays = useCallback((): void => {
    setEditingDays(false);
  }, []);

  const handleDaysValueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setDaysValue(e.target.value);
  }, []);

  const handleConfirmEditDays = useCallback((): void => {
    const parsed = Number(daysValue);
    if (Number.isFinite(parsed) && parsed >= 0) {
      onUpdateDays(leaveType.id, parsed);
    }
    setEditingDays(false);
  }, [daysValue, leaveType.id, onUpdateDays]);

  const handleDaysValueKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") handleConfirmEditDays();
    else if (e.key === "Escape") handleCancelEditDays();
  }, [handleConfirmEditDays, handleCancelEditDays]);

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
            {editingDays ? (
              <span className="flex items-center gap-1">
                <input
                  autoFocus
                  type="number"
                  min={0}
                  value={daysValue}
                  onChange={handleDaysValueChange}
                  onKeyDown={handleDaysValueKeyDown}
                  className="w-16 h-6 px-1.5 rounded border border-border bg-input-background text-foreground text-xs"
                />
                <button
                  onClick={handleConfirmEditDays}
                  className="p-1 rounded hover:bg-primary/20 text-primary transition-colors cursor-pointer"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={handleCancelEditDays}
                  className="p-1 rounded hover:bg-muted/30 text-muted-foreground transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-muted-foreground text-xs">
                {leaveType.default_days_per_year}{" "}
                {arabicSource("settings.day_year")}
                <button
                  onClick={handleStartEditDays}
                  className="p-0.5 rounded hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </span>
            )}
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
            {leaveType.allow_hourly && (
              <span className="text-cyan-400 text-xs">
                {arabicSource("leave.hourly")}
              </span>
            )}
            {leaveType.is_carryover_allowed && (
              <span className="text-purple-400 text-xs">
                {arabicSource("common.relay")} {leaveType.max_carryover_days}d
              </span>
            )}
            {leaveType.accrual_enabled && (
              <span className="text-primary text-xs">
                {arabicSource("leave.accrual_badge")}{" "}
                {leaveType.monthly_accrual > 0 ? leaveType.monthly_accrual : ""}
              </span>
            )}
            {leaveType.probation_blocked && (
              <span className="text-amber-400 text-xs">
                {arabicSource("settings.blocked_during_probation")}
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
        {canManage && (
          <button
            onClick={handleDelete}
            className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default memo(LeaveTypeListItem);
