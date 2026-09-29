import { memo, useMemo } from "react";
import type { ExitStatus } from "@/shared/hooks";
import ExitStageActionButton from "./ExitStageActionButton";
import ExitStageBlockerNote from "./ExitStageBlockerNote";

type ExitStageActionsProps = {
  allowedTransitions: ExitStatus[];
  transitionBlockers: Partial<Record<ExitStatus, string[]>>;
  busy: boolean;
  onTransition: (target: ExitStatus) => void;
};

/**
 * The moves the backend allows from the current stage — forward first,
 * cancel last. A move a gate still holds renders disabled with its reasons.
 */
const ExitStageActions = ({ allowedTransitions, transitionBlockers, busy, onTransition }: ExitStageActionsProps) => {
  const ordered = useMemo(
    () => [
      ...allowedTransitions.filter(t => t !== "cancelled"),
      ...allowedTransitions.filter(t => t === "cancelled"),
    ],
    [allowedTransitions],
  );

  const blockerCodes = useMemo(
    () => ordered.flatMap(t => transitionBlockers[t] ?? []),
    [ordered, transitionBlockers],
  );

  if (ordered.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {ordered.map(target => (
          <ExitStageActionButton
            key={target}
            target={target}
            disabled={(transitionBlockers[target] ?? []).length > 0}
            busy={busy}
            onTransition={onTransition}
          />
        ))}
      </div>
      {blockerCodes.map(code => (
        <ExitStageBlockerNote key={code} code={code} />
      ))}
    </div>
  );
};

export default memo(ExitStageActions);
