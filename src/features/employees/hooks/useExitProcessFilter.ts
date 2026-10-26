import { useCallback, useMemo, useState } from "react";
import type { DbExitProcess, MyTask } from "@/shared/hooks";
import { exitFilterCounts, exitMatchesFilter, sortExits, type ExitListFilter } from "../utils/exitListFilter";

/**
 * The End of Service list's chips, counts and order. Until the user picks a chip,
 * Needs me is selected when it has anything in it, so each person lands on their
 * own work; otherwise All open.
 */
export const useExitProcessFilter = (processes: DbExitProcess[], tasks: readonly MyTask[]) => {
  const [chosen, setChosen] = useState<ExitListFilter | null>(null);

  const tasksByExit = useMemo(() => {
    const map = new Map<string, MyTask>();
    for (const task of tasks) if (!map.has(task.exit_id)) map.set(task.exit_id, task);
    return map;
  }, [tasks]);

  const taskExitIds = useMemo<ReadonlySet<string>>(() => new Set(tasksByExit.keys()), [tasksByExit]);

  const counts = useMemo(() => exitFilterCounts(processes, taskExitIds), [processes, taskExitIds]);

  const filter: ExitListFilter = chosen ?? (counts.needs_me > 0 ? "needs_me" : "open");

  const visible = useMemo(
    () => sortExits(processes.filter(process => exitMatchesFilter(process, filter, taskExitIds))),
    [processes, filter, taskExitIds],
  );

  const selectFilter = useCallback((next: ExitListFilter): void => setChosen(next), []);

  return { counts, filter, selectFilter, tasksByExit, visible };
};
