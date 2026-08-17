import { motion } from "motion/react";
import { CalendarDays, Check, X } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import { arabicSource } from "@/i18n/source";
import { isLeavePending, normalizeLeaveStatus } from "@/i18n/status";
import { empDisplayName, type DbLeaveRequest } from "@/shared/hooks";
import { leaveKanbanColumns } from "../styles";

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
}: LeaveRequestsKanbanViewProps) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {leaveKanbanColumns.map((column, columnIndex) => {
      const items = requests.filter((request) => normalizeLeaveStatus(request.status) === column.key);
      return (
        <motion.div
          key={column.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: columnIndex * 0.1 }}
          className={`bg-card/20 backdrop-blur-md border ${column.accent} rounded-xl shadow-lg overflow-hidden`}
        >
          <div className="p-4 border-b border-border/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${column.dotColor}`} />
              <span className="text-foreground" style={{ fontSize: 14 }}>{column.label}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground" style={{ fontSize: 11 }}>
              {items.length}
            </span>
          </div>
          <div className="p-3 space-y-3 min-h-[200px]">
            {items.length > 0 ? items.map((leave, index) => {
              const employee = empMap[leave.employee_id];
              const employeeName = employee ? empDisplayName(employee) : "—";
              return (
                <motion.div
                  key={leave.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card/60 border border-border/30 rounded-lg p-3 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                      <span className="text-primary" style={{ fontSize: 11 }}>{employeeName.charAt(0)}</span>
                    </div>
                    <span className="text-foreground" style={{ fontSize: 13 }}>{employeeName}</span>
                  </div>
                  <div className="space-y-1.5">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary" style={{ fontSize: 11 }}>
                      {leave.leave_type}
                    </span>
                    {leave.reason && <p className="text-muted-foreground" style={{ fontSize: 11 }}>{leave.reason}</p>}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground" style={{ fontSize: 11 }}>
                        {leave.days} {leave.is_half_day ? arabicSource("common.half_a_day") : arabicSource("common.days_2")}
                      </span>
                      <span className="text-muted-foreground" style={{ fontSize: 10 }} dir="ltr">{leave.start_date}</span>
                    </div>
                  </div>
                  {isLeavePending(leave.status) && (
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/20">
                      <button onClick={() => onApprove(leave.id)} className="flex-1 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors cursor-pointer" style={{ fontSize: 11 }}>
                        <Check className="w-3.5 h-3.5 inline-block" /> {arabicSource("common.accept")}
                      </button>
                      <button onClick={() => onReject(leave.id)} className="flex-1 py-1 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors cursor-pointer" style={{ fontSize: 11 }}>
                        <X className="w-3.5 h-3.5 inline-block" /> {arabicSource("common.rejected_2")}
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            }) : (
              <EmptyState icon={CalendarDays} message={arabicSource("leave.no_requests")} className="py-8" />
            )}
          </div>
        </motion.div>
      );
    })}
  </div>
);

export default LeaveRequestsKanbanView;
