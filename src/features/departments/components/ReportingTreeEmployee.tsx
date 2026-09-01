import { User } from "lucide-react";
import type { OrgStructureEmployee } from "@/shared/hooks";

type ReportingTreeEmployeeProps = {
  employee: OrgStructureEmployee;
};

/**
 * One real person on a reporting-tree node. Read-only — unlike the
 * department-grouped graph, this tree carries no click-through detail view,
 * since department/position/employees are already fully shown on the node.
 */
const ReportingTreeEmployee = ({ employee }: ReportingTreeEmployeeProps) => (
  <div className="flex items-center gap-2.5 py-1">
    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
      <User className="w-3.5 h-3.5" />
    </span>
    <span className="truncate" style={{ fontSize: 13 }}>
      {employee.name}
    </span>
    {/* Frequently empty on real rows — an empty badge would just be noise. */}
    {employee.employee_code && (
      <span
        className="shrink-0 rounded bg-muted/40 text-muted-foreground tabular-nums px-1.5 py-0.5"
        style={{ fontSize: 10.5 }}
      >
        {employee.employee_code}
      </span>
    )}
  </div>
);

export default ReportingTreeEmployee;
