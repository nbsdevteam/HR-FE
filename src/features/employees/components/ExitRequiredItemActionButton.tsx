import { memo, useCallback, type ComponentType } from "react";
import { Ban, CheckCircle2, Flag, Lock, PenLine, Send, SquareCheck } from "lucide-react";
import { Button } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { ExitRequiredItem } from "@/shared/hooks";
import type { ExitRowAction, ExitRowActionSpec } from "../utils/exitProgress";

type ExitRequiredItemActionButtonProps = {
  spec: ExitRowActionSpec;
  item: ExitRequiredItem;
  busy: boolean;
  onAction: (action: ExitRowAction, item: ExitRequiredItem) => void;
};

const ACTION_ICONS: Record<ExitRowAction, ComponentType<{ className?: string }>> = {
  submit: Send,
  approve: CheckCircle2,
  reject: Ban,
  tick: SquareCheck,
  start_settlement: Flag,
  confirm: Lock,
  issue: PenLine,
  complete: CheckCircle2,
};

/** One button on a required-item row; it exists only because the backend's `my_actions` lists it. */
const ExitRequiredItemActionButton = ({ spec, item, busy, onAction }: ExitRequiredItemActionButtonProps) => {
  const handleClick = useCallback((): void => {
    onAction(spec.action, item);
  }, [item, onAction, spec.action]);

  return (
    <Button
      variant={spec.variant}
      size="sm"
      icon={ACTION_ICONS[spec.action]}
      disabled={busy}
      onClick={handleClick}
      data-exit-row-action={spec.action}
    >
      {arabicSource(spec.labelKey)}
    </Button>
  );
};

export default memo(ExitRequiredItemActionButton);
