import { memo, useCallback } from "react";
import { Button } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { ExitStatus } from "@/shared/hooks";
import { EXIT_TRANSITION_LABEL_KEYS, EXIT_TRANSITION_VARIANTS } from "../utils/exitStages";

type ExitStageActionButtonProps = {
  target: ExitStatus;
  disabled: boolean;
  busy: boolean;
  onTransition: (target: ExitStatus) => void;
};

const ExitStageActionButton = ({ target, disabled, busy, onTransition }: ExitStageActionButtonProps) => {
  const handleClick = useCallback((): void => {
    onTransition(target);
  }, [onTransition, target]);

  return (
    <Button
      variant={EXIT_TRANSITION_VARIANTS[target]}
      size="sm"
      disabled={disabled || busy}
      loading={busy}
      onClick={handleClick}
      data-exit-transition={target}
    >
      {arabicSource(EXIT_TRANSITION_LABEL_KEYS[target])}
    </Button>
  );
};

export default memo(ExitStageActionButton);
