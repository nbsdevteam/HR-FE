import { useCallback } from "react";
import { History } from "lucide-react";
import { DataTable, EmptyState, TableHeaderRow } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DbLeaveEntitlementAdjustment } from "@/shared/hooks";
import AdditionalLeaveHistoryRow from "./AdditionalLeaveHistoryRow";

type AdditionalLeaveHistoryTableProps = {
  items: DbLeaveEntitlementAdjustment[];
  canManage: boolean;
  onVoid: (adjustment: DbLeaveEntitlementAdjustment) => void;
};

const HEADINGS = [
  arabicSource("leave.effective_date"),
  arabicSource("leave.leave_type"),
  arabicSource("common.days_2"),
  arabicSource("leave.grant_reason_label"),
  arabicSource("leave.granted_by"),
  arabicSource("common.status"),
  "",
];

/** Additional Annual Leave grant history — newest first (backend v1.17.0 §3). */
const AdditionalLeaveHistoryTable = ({ items, canManage, onVoid }: AdditionalLeaveHistoryTableProps) => {
  const renderRow = useCallback(
    (row: DbLeaveEntitlementAdjustment, index: number) => (
      <AdditionalLeaveHistoryRow key={row.id} adjustment={row} index={index} canManage={canManage} onVoid={onVoid} />
    ),
    [canManage, onVoid],
  );

  return (
    <DataTable
      items={items}
      header={<TableHeaderRow headings={HEADINGS} />}
      renderRow={renderRow}
      emptyState={
        <EmptyState icon={History} message={arabicSource("leave.no_additional_leave_grants")} className="py-8" />
      }
    />
  );
};

export default AdditionalLeaveHistoryTable;
