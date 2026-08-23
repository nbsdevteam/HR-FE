import { CalendarDays } from "lucide-react";
import DataTable from "@/shared/components/DataTable";
import EmptyState from "@/shared/components/EmptyState";
import SortableHeaderRow, {
  toggleSort,
} from "@/shared/components/SortableHeader";
import { arabicSource } from "@/i18n/source";
import {
  empDisplayName,
  type DbLeaveRequest,
  type DbLeaveType,
} from "@/shared/hooks";
import { leaveCardClass } from "../styles";
import type { LeaveSortKey } from "../types";
import LeaveRequestTableRow from "./LeaveRequestTableRow";
import { leaveData } from "../data";

type LeaveRequestsListViewProps = {
  requests: DbLeaveRequest[];
  empMap: Record<string, any>;
  leaveTypes: DbLeaveType[];
  sortBy: LeaveSortKey;
  sortDir: "asc" | "desc";
  onSortByChange: (sortBy: LeaveSortKey) => void;
  onSortDirChange: (sortDir: "asc" | "desc") => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
};

const LeaveRequestsListView = ({
  requests,
  empMap,
  leaveTypes,
  sortBy,
  sortDir,
  onSortByChange,
  onSortDirChange,
  onApprove,
  onReject,
  onDelete,
}: LeaveRequestsListViewProps) => (
  <DataTable
    wrapperClassName={leaveCardClass}
    items={requests}
    header={
      <SortableHeaderRow
        columns={leaveData}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={(key) =>
          toggleSort(key, sortBy, sortDir, onSortByChange, onSortDirChange)
        }
      />
    }
    renderRow={(leave, index) => {
      const employee = empMap[leave.employee_id];
      const employeeName = employee
        ? empDisplayName(employee)
        : leave.employee_id;
      const leaveType = leaveTypes.find(
        (type) =>
          type.code === leave.leave_type ||
          type.name_ar === leave.leave_type,
      );

      return (
        <LeaveRequestTableRow
          key={leave.id}
          leave={leave}
          index={index}
          employeeName={employeeName}
          leaveType={leaveType}
          onApprove={onApprove}
          onReject={onReject}
          onDelete={onDelete}
        />
      );
    }}
    emptyRow={
      <tr>
        <td colSpan={8}>
          <EmptyState
            icon={CalendarDays}
            message={arabicSource("leave.there_are_no_leave_requests")}
          />
        </td>
      </tr>
    }
  />
);

export default LeaveRequestsListView;
