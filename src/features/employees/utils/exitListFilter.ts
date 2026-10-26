import type { DbExitProcess, ExitStatus } from "@/shared/hooks";

/** `needs_me` is a My tasks entry for the process; `open` is any stage before completed or cancelled. */
export type ExitListFilter = "needs_me" | "open" | ExitStatus;

export const EXIT_OPEN_STATUSES: readonly string[] = ["in_progress", "approval", "clearance", "settlement"];

/** One chip per stage, after Needs me and All open. */
export const EXIT_STAGE_FILTERS: readonly ExitStatus[] = [
  "in_progress", "approval", "clearance", "settlement", "completed", "cancelled",
];

export const isOpenExit = (process: Pick<DbExitProcess, "status">): boolean =>
  EXIT_OPEN_STATUSES.includes(process.status);

export const exitMatchesFilter = (
  process: DbExitProcess,
  filter: ExitListFilter,
  taskExitIds: ReadonlySet<string>,
): boolean => {
  if (filter === "needs_me") return taskExitIds.has(process.id);
  if (filter === "open") return isOpenExit(process);
  return process.status === filter;
};

export const exitFilterCounts = (
  processes: readonly DbExitProcess[],
  taskExitIds: ReadonlySet<string>,
): Record<ExitListFilter, number> => {
  const counts: Record<string, number> = { needs_me: 0, open: 0 };
  for (const stage of EXIT_STAGE_FILTERS) counts[stage] = 0;
  for (const process of processes) {
    if (taskExitIds.has(process.id)) counts.needs_me += 1;
    if (isOpenExit(process)) counts.open += 1;
    if (process.status in counts) counts[process.status] += 1;
  }
  return counts as Record<ExitListFilter, number>;
};

/** Open processes first, the longest wait on top; closed ones keep their order after them. */
export const sortExits = (processes: readonly DbExitProcess[]): DbExitProcess[] =>
  processes
    .map((process, index) => ({ process, index }))
    .sort((a, b) => {
      const openDiff = Number(isOpenExit(b.process)) - Number(isOpenExit(a.process));
      if (openDiff !== 0) return openDiff;
      const daysDiff = (b.process.progress.days_in_stage ?? -1) - (a.process.progress.days_in_stage ?? -1);
      return daysDiff !== 0 ? daysDiff : a.index - b.index;
    })
    .map(({ process }) => process);
