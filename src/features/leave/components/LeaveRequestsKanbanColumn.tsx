import { motion } from "motion/react";
import { CalendarDays } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import { arabicSource } from "@/i18n/source";
import { empDisplayName } from "@/shared/hooks";
import type { DbLeaveRequest } from "@/shared/hooks";
import LeaveRequestKanbanCard from "./LeaveRequestKanbanCard";

type LeaveRequestsKanbanColumnProps = {
  label: string;
  accent: string;
  dotColor: string;
  index: number;
  items: DbLeaveRequest[];
  empMap: Record<string, any>;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
};

const LeaveRequestsKanbanColumn = ({ label, accent, dotColor, index, items, empMap, onApprove, onReject }: LeaveRequestsKanbanColumnProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className={`bg-card/20 backdrop-blur-md border ${accent} rounded-xl shadow-lg overflow-hidden`}
  >
    <div className="p-4 border-b border-border/20 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
        <span className="text-foreground" style={{ fontSize: 14 }}>{label}</span>
      </div>
      <span className="px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground" style={{ fontSize: 11 }}>
        {items.length}
      </span>
    </div>
    <div className="p-3 space-y-3 min-h-[200px]">
      {items.length > 0 ? items.map((leave, index2) => {
        const employee = empMap[leave.employee_id];
        const employeeName = employee ? empDisplayName(employee) : "—";
        return (
          <LeaveRequestKanbanCard
            key={leave.id}
            leave={leave}
            index={index2}
            employeeName={employeeName}
            onApprove={onApprove}
            onReject={onReject}
          />
        );
      }) : (
        <EmptyState icon={CalendarDays} message={arabicSource("leave.no_requests")} className="py-8" />
      )}
    </div>
  </motion.div>
);

export default LeaveRequestsKanbanColumn;
