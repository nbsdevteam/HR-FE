import { useCallback } from "react";
import { FileQuestion } from "lucide-react";
import { DataTable, EmptyState, TableHeaderRow } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DbLeaveExcuseQueueItem } from "@/shared/hooks";
import LeaveExcuseQueueRow from "./LeaveExcuseQueueRow";
import type { LeaveExcuseDecisionAction } from "../hooks/useLeaveExcuseReview";

type LeaveExcuseQueueTableProps = {
  items: DbLeaveExcuseQueueItem[];
  onDecide: (item: DbLeaveExcuseQueueItem, action: LeaveExcuseDecisionAction) => void;
};

const HEADINGS = [
  arabicSource("common.employee"),
  arabicSource("leave.leave_type"),
  arabicSource("common.from"),
  arabicSource("common.to"),
  arabicSource("common.duration"),
  arabicSource("common.the_reason"),
  arabicSource("leave.current_balance"),
  arabicSource("leave.excuse_followups_column"),
  "",
];

/** Manager/HR excuse review queue (backend v1.16.0 §4). */
const LeaveExcuseQueueTable = ({ items, onDecide }: LeaveExcuseQueueTableProps) => {
  const renderRow = useCallback(
    (row: DbLeaveExcuseQueueItem, index: number) => (
      <LeaveExcuseQueueRow key={row.id} item={row} index={index} onDecide={onDecide} />
    ),
    [onDecide],
  );

  return (
    <DataTable
      items={items}
      header={<TableHeaderRow headings={HEADINGS} />}
      renderRow={renderRow}
      emptyState={
        <EmptyState icon={FileQuestion} message={arabicSource("leave.no_pending_excuses")} className="py-8" />
      }
    />
  );
};

export default LeaveExcuseQueueTable;
