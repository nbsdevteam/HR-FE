import { useMemo } from "react";
import { LoadingState } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { useLeaveAccruals, useLeaveBalanceSummary, type DbLeaveType } from "@/shared/hooks";
import AdditionalLeavePanel from "./AdditionalLeavePanel";
import LeaveAccrualCard from "./LeaveAccrualCard";
import LeaveAccrualExcludedBanner from "./LeaveAccrualExcludedBanner";
import LeaveAccrualHistoryTable from "./LeaveAccrualHistoryTable";
import LeaveProbationBanner from "./LeaveProbationBanner";

type EmployeeAccrualPanelProps = {
  /** Whose accrual to load; `null` reads the signed-in employee's own figures. */
  employeeId: string | null;
  leaveTypes: DbLeaveType[];
};

/** Last two years of monthly grants is plenty of history for the table. */
const HISTORY_LIMIT = 24;

/**
 * Accrual + probation panel for one employee, driven by `/leave/balances` and
 * `/leave/accruals` loaded in parallel (backend §7). Renders nothing when the
 * employee has no accrued leave type and is not on probation, so tenants
 * without the accrual engine see the page exactly as before.
 */
const EmployeeAccrualPanel = ({ employeeId, leaveTypes }: EmployeeAccrualPanelProps) => {
  const {
    summary,
    loading: summaryLoading,
    error,
    refetch: refetchSummary,
  } = useLeaveBalanceSummary(employeeId);
  const { history, loading: historyLoading } = useLeaveAccruals(employeeId, {
    limit: HISTORY_LIMIT,
  });

  const accrualItems = useMemo(
    () => (summary?.items ?? []).filter((item) => item.accrual_enabled),
    [summary],
  );

  // Additional Annual Leave only makes sense for types that take an
  // allocation — granting bonus days is meaningless without one to fund.
  const grantEligibleItems = useMemo(
    () => (summary?.items ?? []).filter((item) => item.requires_allocation),
    [summary],
  );

  const colorByLeaveTypeId = useMemo(() => {
    const colors: Record<string, string> = {};
    leaveTypes.forEach((leaveType) => {
      colors[leaveType.id] = leaveType.color;
    });
    return colors;
  }, [leaveTypes]);

  const accruedTotal = useMemo(
    () => accrualItems.reduce((sum, item) => sum + item.accrued, 0),
    [accrualItems],
  );

  if (summaryLoading || historyLoading) {
    return (
      <LoadingState
        wrapperClassName="flex items-center justify-center py-8"
        iconClassName="w-5 h-5 text-primary animate-spin"
      />
    );
  }

  if (error || !summary) {
    return (
      <p className="text-muted-foreground" style={{ fontSize: 12 }}>
        {arabicSource("leave.balance_details_unavailable")}
      </p>
    );
  }

  const historyItems = history?.items ?? [];
  if (
    !summary.probation &&
    !summary.accrual_excluded &&
    accrualItems.length === 0 &&
    historyItems.length === 0 &&
    grantEligibleItems.length === 0
  ) {
    return null;
  }

  return (
    <div className="space-y-4">
      {summary.accrual_excluded && (
        <LeaveAccrualExcludedBanner reason={summary.accrual_excluded_reason} />
      )}

      {summary.probation && (
        <LeaveProbationBanner
          probationEndDate={summary.probation_end_date}
          accruedDays={accruedTotal}
        />
      )}

      {summary.joining_date && (
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>
          {arabicSource("leave.joining_date")}{" "}
          <span dir="ltr">{summary.joining_date}</span>
        </p>
      )}

      {accrualItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {accrualItems.map((item) => (
            <LeaveAccrualCard
              key={item.leave_type_id}
              item={item}
              color={colorByLeaveTypeId[item.leave_type_id]}
            />
          ))}
        </div>
      )}

      {grantEligibleItems.length > 0 && (
        <AdditionalLeavePanel
          employeeId={summary.employee_id}
          entitlementItems={grantEligibleItems}
          leaveTypes={leaveTypes}
          yearsOfService={summary.years_of_service}
          onBalanceChanged={refetchSummary}
        />
      )}

      <div className="space-y-2">
        <h4 className="text-foreground" style={{ fontSize: 14 }}>
          {arabicSource("leave.accrual_history")}
        </h4>
        <LeaveAccrualHistoryTable
          items={historyItems}
          joiningDate={summary.joining_date}
        />
      </div>
    </div>
  );
};

export default EmployeeAccrualPanel;
