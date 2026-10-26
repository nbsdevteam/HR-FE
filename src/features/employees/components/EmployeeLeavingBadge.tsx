import { LogOut } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { defaultLifecycleStatusLabels } from "../styles/lifecycle";

type EmployeeLeavingBadgeProps = {
  /** The open End of Service process id; the chip renders only while one exists. */
  exitId: string | null;
  /** The backend stage for that process, shown as the chip tooltip. */
  exitStage: string | null;
  /** Kanban tile size. */
  compact?: boolean;
  className?: string;
};

/** "Leaving" while the employee has an open End of Service process; the backend exit_id and exit_stage decide, not the browser. */
const EmployeeLeavingBadge = ({ exitId, exitStage, compact = false, className = "" }: EmployeeLeavingBadgeProps) => {
  if (!exitId) return null;
  const stageLabel = exitStage ? defaultLifecycleStatusLabels[exitStage] ?? exitStage : undefined;

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-orange-500/30 bg-orange-500/10 text-orange-400 ${className}`}
      style={{ fontSize: compact ? 8 : 11 }}
      title={stageLabel}
      data-exit-stage={exitStage ?? undefined}
    >
      <LogOut className={compact ? "w-2.5 h-2.5" : "w-3 h-3"} />
      {arabicSource("employees.leaving_badge")}
    </span>
  );
};

export default EmployeeLeavingBadge;
