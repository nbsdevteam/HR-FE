import { memo, useCallback, useEffect, useState, type ReactNode } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { ExitProgressStageState } from "@/shared/hooks";

type ExitStageSectionProps = {
  title: string;
  /** The stage's state from `progress.stages`; finished ones fold to their summary, later ones stay grey. */
  state: ExitProgressStageState;
  /** One line shown when the section is folded: who finished it, and when. */
  summary?: ReactNode;
  /** A later stage that still has something to open (a settlement preview, a sent-back approval). */
  expandable?: boolean;
  startOpen?: boolean;
  cardCls: string;
  children: ReactNode;
};

const FOLDABLE_STATES: readonly ExitProgressStageState[] = ["done", "skipped", "cancelled", "current"];

/** One stage of the record: open while current, folded to a summary once done, a grey title before it starts. */
const ExitStageSection = ({ title, state, summary, expandable = false, startOpen = false, cardCls, children }: ExitStageSectionProps) => {
  const [open, setOpen] = useState(state === "current" || startOpen);
  const canToggle = FOLDABLE_STATES.includes(state) || expandable;

  const handleToggle = useCallback((): void => setOpen(value => !value), []);

  // A stage that becomes current after an action opens by itself.
  useEffect(() => {
    if (state === "current") setOpen(true);
  }, [state]);

  const muted = !canToggle;

  return (
    <section className={`${cardCls} ${muted ? "opacity-60" : ""}`} data-exit-section-state={state}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={!canToggle}
        aria-expanded={canToggle ? open : undefined}
        className="w-full flex items-center gap-2 p-4 text-start cursor-pointer disabled:cursor-default"
      >
        {state === "done" && <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />}
        <span className={muted ? "text-muted-foreground" : "text-foreground"}>{title}</span>
        {!open && summary && <span className="text-muted-foreground" style={{ fontSize: 12 }}>{summary}</span>}
        {muted && (
          <span className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("lifecycle.exit_progress_not_started")}</span>
        )}
        {canToggle && (open
          ? <ChevronUp className="w-4 h-4 ms-auto text-muted-foreground" aria-hidden="true" />
          : <ChevronDown className="w-4 h-4 ms-auto text-muted-foreground" aria-hidden="true" />)}
      </button>
      {open && canToggle && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </section>
  );
};

export default memo(ExitStageSection);
