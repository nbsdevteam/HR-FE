import { memo } from "react";
import { formatDateTime } from "@/i18n/format";
import { arabicSource } from "@/i18n/source";
import type { ExitApprovalStep } from "@/shared/hooks";
import { EXIT_APPROVAL_STEP_STATE_KEYS, EXIT_APPROVAL_STEP_STATE_TONES } from "../utils/exitStages";

type ExitApprovalStepRowProps = {
  step: ExitApprovalStep;
};

/** One approver in the sign-off timeline: who, their decision, when, and who the pending step waits for. */
const ExitApprovalStepRow = ({ step }: ExitApprovalStepRowProps) => (
  <li
    className="relative ps-4 pb-3 border-s border-border/40 last:pb-0"
    data-approval-step={step.sequence}
    data-approval-state={step.state}
  >
    <span className="absolute -start-[5px] top-1.5 w-2 h-2 rounded-full bg-primary" />
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-foreground" style={{ fontSize: 13 }} dir="auto">{step.name}</span>
      <span className={`px-2 py-0.5 rounded-md border ${EXIT_APPROVAL_STEP_STATE_TONES[step.state] ?? ""}`} style={{ fontSize: 11 }}>
        {arabicSource(EXIT_APPROVAL_STEP_STATE_KEYS[step.state] ?? "lifecycle.exit_approval_step_not_reached")}
      </span>
    </div>
    {step.acted_by_name && (
      <p className="text-muted-foreground" style={{ fontSize: 12 }}>
        <span dir="auto">{step.acted_by_name}</span>
        {step.acted_at && <> · <span dir="ltr">{formatDateTime(step.acted_at, { timeZone: "Asia/Baghdad" })}</span></>}
      </p>
    )}
    {step.comment && <p className="text-foreground" style={{ fontSize: 12 }} dir="auto">{step.comment}</p>}
    {step.state === "pending" && step.waiting_for.length > 0 && (
      <p className="text-amber-400" style={{ fontSize: 12 }}>
        {arabicSource("employees.lifecycle_waiting_on")}: <span dir="auto">{step.waiting_for.map(who => who.name).join("، ")}</span>
      </p>
    )}
  </li>
);

export default memo(ExitApprovalStepRow);
