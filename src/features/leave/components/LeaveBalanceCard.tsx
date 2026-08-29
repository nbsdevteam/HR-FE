import { memo } from "react";
import { motion } from "motion/react";
import { arabicSource } from "@/i18n/source";
import { useLocalizedName } from "@/i18n/useLocalizedName";
import type { DbLeaveBalance, DbLeaveType } from "@/shared/hooks";

type LeaveBalanceCardProps = {
  leaveType: DbLeaveType;
  index: number;
  bal: DbLeaveBalance | undefined;
  entitlement: number;
};

const LeaveBalanceCard = ({ leaveType: lt, index: i, bal, entitlement }: LeaveBalanceCardProps) => {
  const { primary: leaveTypeName } = useLocalizedName(lt.name_ar, lt.name_en);

  const totalDays = bal?.total_days ?? entitlement;
  const usedDays = bal?.used_days ?? 0;
  const carryover = bal?.carryover_days ?? 0;
  const remaining = totalDays + carryover - usedDays;
  const pct = totalDays > 0 ? Math.min(100, (usedDays / (totalDays + carryover)) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
      className="bg-card backdrop-blur-sm border border-border rounded-xl p-5 shadow-lg"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-foreground" style={{ fontSize: 14 }} data-i18n-ignore>{leaveTypeName}</span>
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: lt.color }} />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-gradient-gold" style={{ fontSize: 28 }}>{remaining}</span>
        <span className="text-muted-foreground" style={{ fontSize: 12 }}>/ {totalDays + carryover} {arabicSource("common.days_2")}</span>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-muted/30">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: lt.color }} />
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-muted-foreground" style={{ fontSize: 11 }}>{arabicSource("common.user")} {usedDays}</p>
        {carryover > 0 && <p className="text-muted-foreground" style={{ fontSize: 11 }}>{arabicSource("leave.relay")} {carryover}</p>}
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {lt.allow_half_day && <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20" style={{ fontSize: 9 }}>{arabicSource("common.half_a_day")}</span>}
        {lt.is_encashable && <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" style={{ fontSize: 9 }}>{arabicSource("common.exchangeable")}</span>}
        {lt.is_carryover_allowed && <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20" style={{ fontSize: 9 }}>{arabicSource("common.relay")}</span>}
        {!lt.is_paid && <span className="px-1.5 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20" style={{ fontSize: 9 }}>{arabicSource("common.without_salary")}</span>}
      </div>
    </motion.div>
  );
};

export default memo(LeaveBalanceCard);
