import { useMemo } from "react";
import { normalizeLeaveStatus } from "@/i18n/status";
import type { DbLeaveRequest } from "@/shared/hooks";
import { leaveKanbanColumns } from "../styles";
import LeaveRequestsKanbanColumn from "./LeaveRequestsKanbanColumn";

type LeaveRequestsKanbanViewProps = {
  requests: DbLeaveRequest[];
  empMap: Record<string, any>;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
};

const LeaveRequestsKanbanView = ({
  requests,
  empMap,
  onApprove,
  onReject,
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
        <LeaveRequestsKanbanColumn
          key={column.key}
          label={column.label}
          accent={column.accent}
          dotColor={column.dotColor}
          index={columnIndex}
          items={requestsByStatus.get(column.key) || []}
          empMap={empMap}
          onApprove={onApprove}
          onReject={onReject}
        />
      ))}
    </div>
  );
};

export default LeaveRequestsKanbanView;
