import { memo } from "react";
import { arabicSource } from "@/i18n/source";
import type { DbLeaveBalanceItem } from "@/shared/hooks";
import { formatLeaveDays } from "../utils/accrual";

type AdditionalLeaveEntitlementRowProps = {
  item: DbLeaveBalanceItem;
};

/** Base + Additional + Total entitlement breakdown for one leave type (backend v1.17.0 §2). */
const AdditionalLeaveEntitlementRow = ({ item }: AdditionalLeaveEntitlementRowProps) => (
  <div className="p-3 rounded-xl bg-muted/20 border border-border/30 space-y-1.5">
    <p className="text-foreground" style={{ fontSize: 13 }} data-i18n-ignore>
      {item.leave_type_name}
    </p>
    <div className="flex items-center justify-between" style={{ fontSize: 12 }}>
      <span className="text-muted-foreground">{arabicSource("leave.base_entitlement")}</span>
      <span className="text-foreground" dir="ltr">
        {formatLeaveDays(item.base_annual_entitlement)} {arabicSource("common.days_2")}
      </span>
    </div>
    <div className="flex items-center justify-between" style={{ fontSize: 12 }}>
      <span className="text-muted-foreground">{arabicSource("leave.additional_entitlement")}</span>
      <span className="text-emerald-400" dir="ltr">
        +{formatLeaveDays(item.additional_annual_leave)} {arabicSource("common.days_2")}
      </span>
    </div>
    <div className="flex items-center justify-between pt-1.5 border-t border-border/20" style={{ fontSize: 13 }}>
      <span className="text-foreground">{arabicSource("leave.total_entitlement")}</span>
      <span className="text-gradient-gold" dir="ltr">
        {formatLeaveDays(item.annual_entitlement)} {arabicSource("common.days_2")}
      </span>
    </div>
  </div>
);

export default memo(AdditionalLeaveEntitlementRow);
