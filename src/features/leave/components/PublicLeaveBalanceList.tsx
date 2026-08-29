import { motion } from "motion/react";
import { AlertTriangle } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import PublicLeaveBalanceRow from "./PublicLeaveBalanceRow";
import type { usePublicLeaveRequestPage } from "../hooks/usePublicLeaveRequestPage";

type PublicLeaveBalanceListProps = {
  page: ReturnType<typeof usePublicLeaveRequestPage>;
};

/**
 * Balances the employee sees right after being identified — the same
 * numbers HR and the approver see (backend hand-off §5). A `0` under
 * `accrual_excluded` means the joining date is missing, not that the
 * balance is exhausted, so it gets its own banner instead of blending into
 * the list.
 */
const PublicLeaveBalanceList = ({ page }: PublicLeaveBalanceListProps) => {
  const { balances, handleContinueFromBalances } = page;
  const data = balances.balances;

  if (!data) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div>
        <h1 className="text-foreground" style={{ fontSize: 20 }}>{arabicSource("public_leave.balances_title")}</h1>
        <p className="text-muted-foreground mt-1" style={{ fontSize: 13 }} data-i18n-ignore>{data.employee_name}</p>
      </div>

      {data.accrual_excluded && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-500">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span style={{ fontSize: 12.5 }}>{arabicSource("public_leave.accrual_excluded_banner")}</span>
        </div>
      )}

      <div className="space-y-2">
        {data.items.map((item) => (
          <PublicLeaveBalanceRow key={item.leave_type_id} item={item} probationEndDate={data.probation_end_date} />
        ))}
      </div>

      <button
        type="button"
        onClick={handleContinueFromBalances}
        className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
        style={{ fontSize: 13 }}
      >
        {arabicSource("common.next")}
      </button>
    </motion.div>
  );
};

export default PublicLeaveBalanceList;
