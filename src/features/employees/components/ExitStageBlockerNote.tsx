import { memo } from "react";
import { AlertTriangle } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { EXIT_BLOCKER_KEYS } from "../utils/exitStages";

type ExitStageBlockerNoteProps = {
  code: string;
};

/** Why the next stage is held — one backend `transition_blockers` code. */
const ExitStageBlockerNote = ({ code }: ExitStageBlockerNoteProps) => {
  const key = EXIT_BLOCKER_KEYS[code];
  return (
    <p className="flex items-center gap-1.5 text-amber-400" style={{ fontSize: 12 }} data-exit-blocker={code}>
      <AlertTriangle className="w-3.5 h-3.5" />
      {key ? arabicSource(key) : code}
    </p>
  );
};

export default memo(ExitStageBlockerNote);
