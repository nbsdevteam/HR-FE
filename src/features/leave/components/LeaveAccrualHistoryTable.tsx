import { useCallback, useMemo } from "react";
import { CalendarClock } from "lucide-react";
import { DataTable, EmptyState, TableHeaderRow } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DbLeaveAccrualEntry } from "@/shared/hooks";
import { firstAccrualDate, withRunningTotals, type AccrualHistoryRow } from "../utils/accrual";
import LeaveAccrualHistoryRow from "./LeaveAccrualHistoryRow";

type LeaveAccrualHistoryTableProps = {
  items: DbLeaveAccrualEntry[];
  /** Used to tell an employee in their first month when their first grant lands. */
  joiningDate: string | null;
};

const HEADINGS = [
  arabicSource("common.date"),
  arabicSource("common.period"),
  arabicSource("common.days_2"),
  arabicSource("leave.accrual_running_total"),
];

/** Accrual audit trail (backend §9) — rows are newest-first, totals accumulate from the oldest. */
const LeaveAccrualHistoryTable = ({ items, joiningDate }: LeaveAccrualHistoryTableProps) => {
  const rows = useMemo(() => withRunningTotals(items), [items]);
  const firstAccrual = useMemo(() => firstAccrualDate(joiningDate), [joiningDate]);

  const renderRow = useCallback(
    (row: AccrualHistoryRow, index: number) => (
      <LeaveAccrualHistoryRow key={row.id} row={row} index={index} />
    ),
    [],
  );

  return (
    <DataTable
      items={rows}
      header={<TableHeaderRow headings={HEADINGS} />}
      renderRow={renderRow}
      emptyState={
        <EmptyState
          icon={CalendarClock}
          message={arabicSource("leave.no_accruals_yet")}
          hint={
            firstAccrual
              ? `${arabicSource("leave.first_accrual_on")} ${firstAccrual}`
              : undefined
          }
          className="py-8"
        />
      }
    />
  );
};

export default LeaveAccrualHistoryTable;
