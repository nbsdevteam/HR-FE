import { memo, useMemo } from "react";
import { Circle, Square } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { useAppLanguage } from "@/i18n/useLocalizedName";
import type { ExitRequiredItem } from "@/shared/hooks";
import type { CustodyStatus } from "../types";
import { exitRowActions, requiredItemText, type ExitRowAction } from "../utils/exitProgress";
import ExitCustodyStatusSelect from "./ExitCustodyStatusSelect";
import ExitRequiredItemActionButton from "./ExitRequiredItemActionButton";
import ExitWaitingOnChip from "./ExitWaitingOnChip";

type ExitRequiredItemRowProps = {
  item: ExitRequiredItem;
  /** A step that waits for the items above it: drawn hollow, with its button only if the backend lists it. */
  held: boolean;
  /** The signed-in user may tick this checklist line by hand now. */
  canTick: boolean;
  /** The first approval step: the only one Approve and Reject act on. */
  isCurrentStep: boolean;
  /** `hr.lifecycle.edit`: the custody endpoint needs it, so only these users get the status dropdown. */
  canEditCustody: boolean;
  myActions: readonly string[];
  categoryLabels: Record<string, string>;
  busy: boolean;
  onAction: (action: ExitRowAction, item: ExitRequiredItem) => void;
  onCustodyStatus: (custodyId: string, status: CustodyStatus) => void;
};

/** One thing still required: who owns it, what it is, and the button when the user may do it. */
const ExitRequiredItemRow = ({
  item, held, canTick, isCurrentStep, canEditCustody, myActions, categoryLabels, busy, onAction, onCustodyStatus,
}: ExitRequiredItemRowProps) => {
  const lang = useAppLanguage();
  const specs = useMemo(
    () => exitRowActions(item, myActions, { canTick, isCurrentStep }),
    [item, myActions, canTick, isCurrentStep],
  );
  const Glyph = held ? Circle : Square;

  return (
    <li className="flex flex-wrap items-center gap-2 py-1.5" data-exit-required={item.code} data-exit-held={held || undefined}>
      <Glyph className="w-4 h-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <ExitWaitingOnChip entry={{ owner: item.owner, people: [] }} categoryLabels={categoryLabels} />
      <span className="flex-1 min-w-40 text-foreground" style={{ fontSize: 13 }} dir="auto">
        {requiredItemText(item, lang)}
        {held && (
          <span className="block text-muted-foreground" style={{ fontSize: 11 }}>
            {arabicSource("lifecycle.exit_progress_held")}
          </span>
        )}
      </span>
      {canEditCustody && item.code === "custody_item" && item.custody_id && (
        <ExitCustodyStatusSelect custodyId={item.custody_id} disabled={busy} onChange={onCustodyStatus} />
      )}
      {specs.map(spec => (
        <ExitRequiredItemActionButton key={spec.action} spec={spec} item={item} busy={busy} onAction={onAction} />
      ))}
    </li>
  );
};

export default memo(ExitRequiredItemRow);
