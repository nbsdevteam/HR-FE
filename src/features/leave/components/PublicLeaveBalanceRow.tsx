import { memo } from "react";
import { arabicSource } from "@/i18n/source";
import type { PublicLeaveBalanceItem } from "../types/publicLeave";

type PublicLeaveBalanceRowProps = {
  item: PublicLeaveBalanceItem;
  probationEndDate: string;
};

/** One leave type's remaining balance — disabled with its reason when `can_apply` is false (backend hand-off §5). */
const PublicLeaveBalanceRow = ({ item, probationEndDate }: PublicLeaveBalanceRowProps) => {
  const reason = item.can_apply
    ? ""
    : item.blocked_by_probation
      ? `${arabicSource("public_leave.balance_blocked_by_probation")} ${probationEndDate}`
      : arabicSource("public_leave.balance_no_remaining");

  return (
    <div
      className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
        item.can_apply ? "border-border" : "border-border opacity-60"
      }`}
    >
      <div>
        <div className="text-foreground" style={{ fontSize: 13.5 }} data-i18n-ignore>{item.leave_type_name}</div>
        {reason && (
          <div className="text-destructive mt-0.5" style={{ fontSize: 11.5 }}>{reason}</div>
        )}
      </div>
      <div className="text-primary" style={{ fontSize: 16 }}>{item.remaining}</div>
    </div>
  );
};

export default memo(PublicLeaveBalanceRow);
