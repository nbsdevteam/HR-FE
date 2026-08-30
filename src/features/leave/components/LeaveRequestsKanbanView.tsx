import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { KanbanColumn } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { normalizeLeaveStatus } from "@/i18n/status";
import type { DbLeaveRequest, DbLeaveType } from "@/shared/hooks";
import { leaveKanbanColumns } from "../styles";
import LeaveRequestKanbanCard from "./LeaveRequestKanbanCard";

type LeaveRequestsKanbanViewProps = {
  requests: DbLeaveRequest[];
  empMap: Record<string, any>;
  leaveTypes: DbLeaveType[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onViewAttachments: (leave: DbLeaveRequest) => void;
  onFollowUpExcuse: (leave: DbLeaveRequest) => void;
};

const LeaveRequestsKanbanView = ({
  requests,
  empMap,
  leaveTypes,
  onApprove,
  onReject,
  onViewAttachments,
  onFollowUpExcuse,
}: LeaveRequestsKanbanViewProps) => {
  const requestsByStatus = useMemo(() => {
    const map = new Map<string, DbLeaveRequest[]>();
    for (const request of requests) {
      const key = normalizeLeaveStatus(request.status);
      const bucket = map.get(key);
      if (bucket) bucket.push(request);
      else map.set(key, [request]);
    }
    return map;
  }, [requests]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {leaveKanbanColumns.map((column, columnIndex) => (
        <KanbanColumn
          key={column.key}
          label={column.label}
          accentClassName={column.accent}
          dotClassName={column.dotColor}
          index={columnIndex}
          items={requestsByStatus.get(column.key) || []}
          emptyIcon={CalendarDays}
          emptyMessage={arabicSource("leave.no_requests")}
          renderItem={(leave, i) => {
            const employee = empMap[leave.employee_id];
            const leaveType = leaveTypes.find(
              (type) => type.code === leave.leave_type || type.name_ar === leave.leave_type,
            );
            return (
              <LeaveRequestKanbanCard
                key={leave.id}
                leave={leave}
                index={i}
                employee={employee}
                leaveType={leaveType}
                onApprove={onApprove}
                onReject={onReject}
                onViewAttachments={onViewAttachments}
                onFollowUpExcuse={onFollowUpExcuse}
              />
            );
          }}
        />
      ))}
    </div>
  );
};

export default LeaveRequestsKanbanView;
