import { motion } from "motion/react";
import { CalendarDays, Check, Trash2, X } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import { SortableHeaderRow, toggleSort } from "@/shared/components/SortableHeader";
import { arabicSource } from "@/i18n/source";
import { isLeavePending, leaveStatusKeys, normalizeLeaveStatus, translateBackendCode } from "@/i18n/status";
import { empDisplayName, type DbLeaveRequest, type DbLeaveType } from "@/shared/hooks";
import { leaveCardClass, leaveStatusColors } from "../styles";
import type { LeaveSortKey } from "../types";

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
  <div className={leaveCardClass}>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <SortableHeaderRow
            columns={[
              { label: arabicSource("common.employee"), key: "employee" },
              { label: arabicSource("leave.leave_type"), key: "type" },
              { label: arabicSource("common.from"), key: "start" },
              { label: arabicSource("common.to"), key: "end" },
              { label: arabicSource("common.duration"), key: "days" },
              { label: arabicSource("common.the_reason"), key: null },
              { label: arabicSource("common.status"), key: "status" },
              { label: arabicSource("common.procedures"), key: null },
            ]}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={(key) => toggleSort(key, sortBy, sortDir, onSortByChange, onSortDirChange)}
          />
        </thead>
        <tbody>
          {requests.length > 0 ? requests.map((leave, index) => {
            const employee = empMap[leave.employee_id];
            const employeeName = employee ? empDisplayName(employee) : leave.employee_id;
            const leaveType = leaveTypes.find((type) => type.code === leave.leave_type || type.name_ar === leave.leave_type);

            return (
              <motion.tr
                key={leave.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02 }}
                className="border-b border-border/20 hover:bg-muted/10 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary" style={{ fontSize: 11 }}>{employeeName.charAt(0)}</span>
                    </div>
                    <span className="text-foreground" style={{ fontSize: 13 }}>{employeeName}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="px-2 py-0.5 rounded-md border"
                    style={{
                      fontSize: 12,
                      borderColor: leaveType?.color || "#3b82f6",
                      color: leaveType?.color || "#3b82f6",
                      backgroundColor: `${leaveType?.color || "#3b82f6"}15`,
                    }}
                  >
                    {leave.leave_type}
                    {leave.is_half_day && <span className="ms-1" style={{ fontSize: 10 }}>{arabicSource("leave.half_a_day")}</span>}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{leave.start_date}</td>
                <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{leave.end_date}</td>
                <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }}>
                  {leave.days} {leave.is_half_day ? arabicSource("common.half_a_day") : arabicSource("common.days_2")}
                </td>
                <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }}>{leave.reason || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-md border ${leaveStatusColors[normalizeLeaveStatus(leave.status)] || ""}`} style={{ fontSize: 12 }}>
                    {translateBackendCode(leave.status, leaveStatusKeys)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {isLeavePending(leave.status) ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => onApprove(leave.id)} className="p-1.5 rounded hover:bg-emerald-500/20 transition-colors cursor-pointer" title={arabicSource("common.accept")}>
                        <Check className="w-4 h-4 text-emerald-400" />
                      </button>
                      <button onClick={() => onReject(leave.id)} className="p-1.5 rounded hover:bg-destructive/20 transition-colors cursor-pointer" title={arabicSource("common.rejected_2")}>
                        <X className="w-4 h-4 text-destructive" />
                      </button>
                      <button onClick={() => onDelete(leave.id)} className="p-1.5 rounded hover:bg-destructive/20 transition-colors cursor-pointer" title={arabicSource("common.delete")}>
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-muted-foreground" style={{ fontSize: 11 }}>
                      {leave.rejection_reason && <span className="text-destructive">{leave.rejection_reason}</span>}
                    </span>
                  )}
                </td>
              </motion.tr>
            );
          }) : (
            <tr>
              <td colSpan={8}><EmptyState icon={CalendarDays} message={arabicSource("leave.there_are_no_leave_requests")} /></td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default LeaveRequestsListView;
