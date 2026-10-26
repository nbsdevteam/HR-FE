import { memo } from "react";
import { AlertTriangle } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { ExitSettlementWarning } from "@/shared/hooks";
import { EXIT_SETTLEMENT_WARNING_KEYS } from "../utils/exitStages";

type ExitSettlementWarningNoteProps = {
  warning: ExitSettlementWarning;
};

/** A reason the statement may be incomplete, e.g. a lost item with no value on file. */
const ExitSettlementWarningNote = ({ warning }: ExitSettlementWarningNoteProps) => {
  const key = EXIT_SETTLEMENT_WARNING_KEYS[warning.code];
  return (
    <p className="flex items-center gap-1.5 text-amber-400" style={{ fontSize: 12 }} data-settlement-warning={warning.code}>
      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
      <span>
        {key ? arabicSource(key) : warning.code}
        {warning.item && <> — <span dir="auto">{warning.item}</span></>}
      </span>
    </p>
  );
};

export default memo(ExitSettlementWarningNote);
