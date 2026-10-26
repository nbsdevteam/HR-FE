import { memo, useCallback } from "react";
import { StatusBadge } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { empDisplayName, type DbEmployee, type DbExitProcess, type MyTask } from "@/shared/hooks";
import { isOpenExit } from "../utils/exitListFilter";
import ExitDaysInStage from "./ExitDaysInStage";
import ExitNextStepCell from "./ExitNextStepCell";
import ExitProgressStepper from "./ExitProgressStepper";
import ExitWaitingOnChips from "./ExitWaitingOnChips";
import ExitYourTurnBadge from "./ExitYourTurnBadge";

type ExitProcessCardProps = {
  process: DbExitProcess;
  emp: DbEmployee | undefined;
  exitTypeLabels: Record<string, string>;
  statusLabels: Record<string, string>;
  statusColors: Record<string, string>;
  categoryLabels: Record<string, string>;
  task: MyTask | null;
  cardCls: string;
  onView: (processId: string) => void;
};

/** The list row below `md`: the same cells as the table, stacked. */
const ExitProcessCard = ({
  process: p, emp, exitTypeLabels, statusLabels, statusColors, categoryLabels, task, cardCls, onView,
}: ExitProcessCardProps) => {
  const { progress } = p;

  const handleOpen = useCallback((): void => {
    onView(p.id);
  }, [onView, p.id]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onView(p.id);
    }
  }, [onView, p.id]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
      data-exit-card={p.id}
      className={`${cardCls} p-4 space-y-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-foreground" style={{ fontSize: 14 }} dir="auto">{emp ? empDisplayName(emp) : p.employee_name || "—"}</p>
          <p className="text-muted-foreground" style={{ fontSize: 11 }}>
            {exitTypeLabels[p.exit_type] || p.exit_type} · <span dir="ltr">{p.last_working_day || p.exit_date}</span>
          </p>
        </div>
        <StatusBadge colorClassName={statusColors[p.status] || ""} fontSize={11}>{statusLabels[p.status] || p.status}</StatusBadge>
      </div>
      <ExitProgressStepper stages={progress.stages} statusLabels={statusLabels} size="sm" />
      <div className="flex flex-wrap items-center gap-2" style={{ fontSize: 12 }}>
        <span className="text-muted-foreground">{arabicSource("employees.lifecycle_waiting_on")}</span>
        <ExitWaitingOnChips waitingOn={progress.waiting_on} categoryLabels={categoryLabels} />
      </div>
      <div className="flex flex-wrap items-center gap-2" style={{ fontSize: 12 }}>
        <span className="text-muted-foreground">{arabicSource("lifecycle.exit_progress_next")}</span>
        <ExitNextStepCell progress={progress} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <ExitDaysInStage days={isOpenExit(p) ? progress.days_in_stage : null} />
        {task && <ExitYourTurnBadge task={task} />}
      </div>
    </div>
  );
};

export default memo(ExitProcessCard);
