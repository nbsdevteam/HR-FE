import { memo, useCallback } from "react";
import { motion } from "motion/react";
import { StatusBadge } from "@/shared/components";
import { empDisplayName, type DbEmployee, type DbExitProcess, type MyTask } from "@/shared/hooks";
import { isOpenExit } from "../utils/exitListFilter";
import ExitDaysInStage from "./ExitDaysInStage";
import ExitNextStepCell from "./ExitNextStepCell";
import ExitProgressStepper from "./ExitProgressStepper";
import ExitWaitingOnChips from "./ExitWaitingOnChips";
import ExitYourTurnBadge from "./ExitYourTurnBadge";

type ExitProcessTableRowProps = {
  process: DbExitProcess;
  index: number;
  emp: DbEmployee | undefined;
  exitTypeLabels: Record<string, string>;
  statusLabels: Record<string, string>;
  statusColors: Record<string, string>;
  categoryLabels: Record<string, string>;
  /** The My tasks entry for this process, when the signed-in user has one. */
  task: MyTask | null;
  onView: (processId: string) => void;
};

/** The whole row opens the record, by click or by Enter / Space. */
const ExitProcessTableRow = ({
  process: p, index: i, emp, exitTypeLabels, statusLabels, statusColors, categoryLabels, task, onView,
}: ExitProcessTableRowProps) => {
  const { progress } = p;

  const handleOpen = useCallback((): void => {
    onView(p.id);
  }, [onView, p.id]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTableRowElement>): void => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onView(p.id);
    }
  }, [onView, p.id]);

  return (
    <motion.tr
      key={p.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: i * 0.02 }}
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
      data-exit-row={p.id}
      className="border-b border-border/20 hover:bg-muted/10 transition-colors cursor-pointer align-top focus-visible:outline-none focus-visible:bg-muted/20"
    >
      {/* A completed exit archives the employee, dropping them from the
          active-employee map — the API's own name keeps the row readable. */}
      <td className="px-4 py-3">
        <p className="text-foreground" style={{ fontSize: 13 }} dir="auto">{emp ? empDisplayName(emp) : p.employee_name || "—"}</p>
        <p className="text-muted-foreground" style={{ fontSize: 11 }}>
          {exitTypeLabels[p.exit_type] || p.exit_type} · <span dir="ltr">{p.last_working_day || p.exit_date}</span>
        </p>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1.5">
          <ExitProgressStepper stages={progress.stages} statusLabels={statusLabels} size="sm" />
          <StatusBadge colorClassName={statusColors[p.status] || ""} fontSize={11} extraClassName="self-start">
            {statusLabels[p.status] || p.status}
          </StatusBadge>
        </div>
      </td>
      <td className="px-4 py-3">
        <ExitWaitingOnChips waitingOn={progress.waiting_on} categoryLabels={categoryLabels} />
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1.5">
          <ExitNextStepCell progress={progress} />
          {task && <ExitYourTurnBadge task={task} />}
        </div>
      </td>
      <td className="px-4 py-3">
        <ExitDaysInStage days={isOpenExit(p) ? progress.days_in_stage : null} />
      </td>
    </motion.tr>
  );
};

export default memo(ExitProcessTableRow);
