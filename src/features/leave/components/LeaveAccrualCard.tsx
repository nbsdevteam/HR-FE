import { memo } from "react";
import { motion } from "motion/react";
import { StatusBadge } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DbLeaveBalanceItem } from "@/shared/hooks";
import { accrualProgressPercent, formatLeaveDays } from "../utils/accrual";

type LeaveAccrualCardProps = {
  item: DbLeaveBalanceItem;
  /** Leave-type colour from the types catalogue, when the caller has it. */
  color?: string;
};

/**
 * Accrual balance card (backend §8): entitlement + monthly rate on top,
 * accrued/used in the middle, and the year's earned share as the progress bar —
 * `accrued / annual_entitlement`, not `remaining / accrued`.
 */
const LeaveAccrualCard = ({ item, color = "#d4af37" }: LeaveAccrualCardProps) => {
  const progress = accrualProgressPercent(item.accrued, item.annual_entitlement);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card backdrop-blur-sm border border-border rounded-xl p-5 shadow-lg space-y-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-foreground" style={{ fontSize: 14 }} data-i18n-ignore>
            {item.leave_type_name}
          </span>
        </div>
        <StatusBadge colorClassName="bg-primary/10 text-primary border-primary/20" fontSize={10}>
          {arabicSource("leave.accrual_badge")}
        </StatusBadge>
      </div>

      <div className="grid grid-cols-2 gap-2" style={{ fontSize: 12 }}>
        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/20">
          <span className="text-muted-foreground">{arabicSource("leave.annual_entitlement")}</span>
          <span className="text-foreground">
            {item.annual_entitlement} {arabicSource("settings.day_year")}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/20">
          <span className="text-muted-foreground">{arabicSource("leave.monthly_accrual")}</span>
          <span className="text-foreground">
            {formatLeaveDays(item.monthly_accrual)} {arabicSource("leave.days_per_month_unit")}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/20">
          <span className="text-muted-foreground">{arabicSource("leave.accrued_days")}</span>
          <span className="text-foreground">{formatLeaveDays(item.accrued)}</span>
        </div>
        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/20">
          <span className="text-muted-foreground">{arabicSource("leave.used_days")}</span>
          <span className="text-foreground">{formatLeaveDays(item.used)}</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-muted-foreground" style={{ fontSize: 12 }}>
            {arabicSource("leave.available_days")}
          </span>
          <span className="text-gradient-gold" style={{ fontSize: 24 }}>
            {formatLeaveDays(item.remaining)}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted/30">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, backgroundColor: color }}
          />
        </div>
        <p className="text-muted-foreground/70" style={{ fontSize: 11 }}>
          {formatLeaveDays(item.accrued)} {arabicSource("leave.of_annual_entitlement")}{" "}
          {item.annual_entitlement} {arabicSource("common.days_2")}
          {item.accrual_periods > 0 &&
            ` — ${arabicSource("leave.accrual_periods_count")} ${item.accrual_periods}`}
        </p>
      </div>

      {item.blocked_by_probation && (
        <p className="text-amber-400" style={{ fontSize: 11 }}>
          {arabicSource("leave.probation_blocked_badge")}
        </p>
      )}
      {!item.blocked_by_probation && item.remaining <= 0 && (
        <p className="text-destructive" style={{ fontSize: 11 }}>
          {arabicSource("leave.no_balance_remaining")}
        </p>
      )}
    </motion.div>
  );
};

export default memo(LeaveAccrualCard);
