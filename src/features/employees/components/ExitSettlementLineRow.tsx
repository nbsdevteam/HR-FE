import { memo } from "react";
import { formatNumber } from "@/i18n/format";
import { arabicSource } from "@/i18n/source";
import type { ExitSettlementLine } from "@/shared/hooks";
import { EXIT_SETTLEMENT_LINE_KEYS } from "../utils/exitStages";

type ExitSettlementLineRowProps = {
  line: ExitSettlementLine;
};

/** `loan` and `custody` lines are deductions, so they arrive negative and are shown that way. */
const ExitSettlementLineRow = ({ line }: ExitSettlementLineRowProps) => {
  const key = EXIT_SETTLEMENT_LINE_KEYS[line.code];
  const detailed = line.code === "loan" || line.code === "custody";
  const title = key ? arabicSource(key) : line.label;

  return (
    <tr className="border-b border-border/20 last:border-b-0" data-settlement-line={line.code}>
      <td className="px-3 py-2 text-foreground" style={{ fontSize: 13 }}>
        <span dir="auto">{title}</span>
        {detailed && line.label && <span className="text-muted-foreground" dir="auto"> — {line.label}</span>}
        {line.basis && <p className="text-muted-foreground" style={{ fontSize: 11 }} dir="auto">{line.basis}</p>}
      </td>
      <td className={`px-3 py-2 text-end ${line.amount < 0 ? "text-destructive" : "text-foreground"}`} style={{ fontSize: 13 }} dir="ltr">
        {formatNumber(line.amount)} {line.currency}
      </td>
    </tr>
  );
};

export default memo(ExitSettlementLineRow);
