import {
  CalendarDays,
  Clock,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  XCircle,
  TreePalm,
} from "lucide-react";
import type { SalaryCalculation } from "@/features/payroll";
import { DEFAULT_SETTINGS } from "@/features/payroll";
import { formatHoursMinutes } from "@/shared/utils/currency";
import { arabicSource } from "@/i18n/source";
import PayrollSummaryChip from "./PayrollSummaryChip";
import { useMemo } from "react";

type PayrollSummaryChipsProps = {
  calc: SalaryCalculation;
  avgHoursPerDay: number;
  hasShortfallRecords: boolean;
  hasAbsenceRecords: boolean;
  leaveRecsCount: number;
  paidLeaveCount: number;
  unpaidLeaveCount: number;
  showCalendar: boolean;
  onShowShortfall: () => void;
  onShowAbsence: () => void;
  onToggleCalendar: () => void;
};

const PayrollSummaryChips = ({
  calc,
  avgHoursPerDay,
  hasShortfallRecords,
  hasAbsenceRecords,
  leaveRecsCount,
  paidLeaveCount,
  unpaidLeaveCount,
  showCalendar,
  onShowShortfall,
  onShowAbsence,
  onToggleCalendar,
}: PayrollSummaryChipsProps) => {
  const chips = useMemo(
    () => [
      {
        label: arabicSource("common.working_days"),
        value: `${calc.daysWorked} / ${calc.scheduledWorkingDays}`,
        icon: CalendarDays,
        color: "text-foreground",
      },
      {
        label: arabicSource("common.working_hours"),
        value: `${calc.totalHours.toFixed(1)}h`,
        icon: Clock,
        color: "text-foreground",
      },
      {
        label: arabicSource("payroll.average_day"),
        value: `${avgHoursPerDay.toFixed(1)}h`,
        icon: BarChart3,
        color:
          avgHoursPerDay >= DEFAULT_SETTINGS.targetWorkingHoursPerDay
            ? "text-emerald-400"
            : "text-amber-400",
      },
      {
        label: arabicSource("common.overtime"),
        value:
          calc.overtimeHours > 0 ? formatHoursMinutes(calc.overtimeHours) : "—",
        icon: ArrowUpRight,
        color: "text-emerald-400",
      },
      {
        label: arabicSource("common.shortage"),
        value:
          calc.shortfallHours > 0
            ? formatHoursMinutes(calc.shortfallHours)
            : "—",
        icon: ArrowDownRight,
        color: "text-amber-400",
        onClick: hasShortfallRecords ? onShowShortfall : undefined,
      },
      {
        label: arabicSource("common.absence"),
        value:
          calc.absenceDays.length > 0
            ? `${calc.absenceDays.length} ${arabicSource("common.days_2")}`
            : "—",
        icon: XCircle,
        color: "text-destructive",
        onClick: hasAbsenceRecords ? onShowAbsence : undefined,
      },
      {
        label: arabicSource("common.vacations"),
        value:
          leaveRecsCount > 0
            ? `${paidLeaveCount}${unpaidLeaveCount > 0 ? ` + ${unpaidLeaveCount} ${arabicSource("payroll.b_r")}` : ""} ${arabicSource("common.days_2")}`
            : "—",
        icon: TreePalm,
        color: "text-blue-400",
      },
      {
        label: arabicSource("common.calendar"),
        value: showCalendar
          ? arabicSource("common.is_open")
          : arabicSource("common.width"),
        icon: CalendarDays,
        color: showCalendar ? "text-primary" : "text-muted-foreground",
        onClick: onToggleCalendar,
        active: showCalendar,
      },
    ],
    [
      calc.daysWorked,
      calc.scheduledWorkingDays,
      calc.totalHours,
      calc.overtimeHours,
      calc.shortfallHours,
      calc.absenceDays.length,
      avgHoursPerDay,
      hasShortfallRecords,
      onShowShortfall,
      onToggleCalendar,
      onShowAbsence,
      hasAbsenceRecords,
      leaveRecsCount,
      paidLeaveCount,
      unpaidLeaveCount,
      showCalendar,
    ],
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {chips?.map((chip) => (
        <PayrollSummaryChip
          key={chip.label}
          label={chip.label}
          value={chip.value}
          icon={chip.icon}
          color={chip.color}
          onClick={chip.onClick}
          active={chip.active}
        />
      ))}
    </div>
  );
};

export default PayrollSummaryChips;
