/** Backend-shaped `progress` payloads for the End of Service tests. */

const STAGES = ["in_progress", "approval", "clearance", "settlement", "completed"];

/** The backend's `progress` block with `current` as the stage the process is in. */
export const progressAt = (current: string, extra: Record<string, unknown> = {}) => {
  const at = STAGES.indexOf(current);
  return {
    stages: STAGES.map((key, i) => ({ key, state: i < at ? "done" : i === at ? "current" : "todo" })),
    percent: at * 20,
    waiting_on: [],
    still_required: [],
    next: null,
    since: "2026-10-24T11:02:13+03:00",
    days_in_stage: 2,
    ...extra,
  };
};
